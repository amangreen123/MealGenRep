namespace MealForgerBackend.Services;
using MealForgerBackend.Models;


public class NutritionService
{
    private readonly USDAService _usda;
    private readonly DeepSeekService _deepSeek;
    
    public NutritionService(USDAService usda, DeepSeekService deepSeek)
    {
        _usda = usda;
        _deepSeek = deepSeek;
    }

    public async Task<NutritionData> CalculateNutritionAsync(List<IngredientWithMeasure> ingredients, int servings = 4)
    {
        var totalNutrition = new NutritionData();
        var failedIngredients = new List<IngredientWithMeasure>();

        foreach (var ing in ingredients)
        {
            try
            {
                //try usda first
                var usdaData = await _usda.GetNutritionDataAsync(ing.Name);

                if (usdaData != null && usdaData.Calories > 0)
                {
                    var grams = ConvertMeasureToGrams(ing.Measure, ing.Name);
                    var multiplier = grams / 100.0;
                    
                    totalNutrition.Calories += (int)(usdaData.Calories * multiplier);
                    totalNutrition.Protein += (float)(usdaData.Protein * multiplier);
                    totalNutrition.Carbohydrates += (float)(usdaData.Carbs * multiplier);
                    totalNutrition.Fat += (float)(usdaData.Fat * multiplier);
                    totalNutrition.Fiber += (float)(usdaData.Fiber * multiplier);
                    totalNutrition.Sugar += (float)(usdaData.Sugar * multiplier);
                    totalNutrition.Sodium += (float)(usdaData.Sodium * multiplier);
                }
                else
                {
                    failedIngredients.Add(ing);
                }
            } catch (Exception ex)
            {
                failedIngredients.Add(ing);
            }
        }

        if (failedIngredients.Count > 0)
        {
            try
            {
                var deeepSeekFallBack = await _deepSeek.CalculateNutritionAsync(failedIngredients, servings);
                totalNutrition.Calories += deeepSeekFallBack.Calories;
                totalNutrition.Protein += deeepSeekFallBack.Protein;
                totalNutrition.Carbohydrates += deeepSeekFallBack.Carbohydrates;
                totalNutrition.Fat += deeepSeekFallBack.Fat;
                totalNutrition.Fiber += deeepSeekFallBack.Fiber;
                totalNutrition.Sugar += deeepSeekFallBack.Sugar;
                totalNutrition.Sodium += deeepSeekFallBack.Sodium;
                
            } catch (Exception ex)
            {
                Console.WriteLine("❌ DeepSeek fallback failed: " + ex.Message);
                
            }
        }

        return totalNutrition;
    }
    
    private double ConvertMeasureToGrams(string measureText, string ingredientName)
        {
            if (string.IsNullOrEmpty(measureText)) return 100;

            measureText = measureText.ToLower().Trim();
            ingredientName = ingredientName.ToLower();

            // Extract numbers from measure
            var numberMatch = System.Text.RegularExpressions.Regex.Match(measureText, @"[\d.]+");
            double quantity = numberMatch.Success ? double.Parse(numberMatch.Value) : 1;

            // Handle fractions like "1/2 cup"
            if (measureText.Contains("/"))
            {
                var fractionMatch = System.Text.RegularExpressions.Regex.Match(measureText, @"(\d+)/(\d+)");
                if (fractionMatch.Success)
                {
                    quantity = double.Parse(fractionMatch.Groups[1].Value) / 
                              double.Parse(fractionMatch.Groups[2].Value);
                }
            }

            // Volume conversions (approximations)
            if (measureText.Contains("cup"))
            {
                // Different densities for different ingredients
                if (ingredientName.Contains("flour")) return quantity * 125;
                if (ingredientName.Contains("sugar")) return quantity * 200;
                if (ingredientName.Contains("rice")) return quantity * 185;
                if (ingredientName.Contains("water") || ingredientName.Contains("milk")) return quantity * 240;
                return quantity * 240; // default liquid
            }
            
            if (measureText.Contains("tbsp") || measureText.Contains("tablespoon"))
                return quantity * 15;
            
            if (measureText.Contains("tsp") || measureText.Contains("teaspoon"))
                return quantity * 5;
            
            if (measureText.Contains("oz") && !measureText.Contains("fl"))
                return quantity * 28.35;
            
            if (measureText.Contains("lb") || measureText.Contains("pound"))
                return quantity * 453.6;
            
            if (measureText.Contains("ml"))
                return quantity; // approximate 1:1 for liquids
            
            // Check if grams are directly specified
            if (measureText.Contains("g") && !measureText.Contains("kg"))
            {
                var gramMatch = System.Text.RegularExpressions.Regex.Match(measureText, @"(\d+)\s*g");
                if (gramMatch.Success)
                    return double.Parse(gramMatch.Groups[1].Value);
            }
            
            if (measureText.Contains("kg"))
                return quantity * 1000;
            
            return 100;
        }
    }
    