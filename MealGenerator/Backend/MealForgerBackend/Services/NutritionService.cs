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
        var totalNutrition = new NutritionData
        {
            Calories = 0,           
            Protein = 0,
            Carbohydrates = 0,
            Fat = 0,
            Fiber = 0,
            Sugar = 0,
            Sodium = 0
        };
        
        var failedIngredients = new List<IngredientWithMeasure>();
        
        Console.WriteLine($"🔍 CalculateNutritionAsync called with {ingredients?.Count ?? 0} ingredients");
    
        if (ingredients == null || ingredients.Count == 0)
        {
            Console.WriteLine("❌ No ingredients provided to calculate nutrition!");
            return new NutritionData();
        }

        var ingredientText = string.Join("\n", ingredients.Select(i => $"{i.Measure}  {i.Name}"));

        Console.WriteLine($"🍎 Ingredient list being sent:\n{ingredientText}");

        foreach (var ing in ingredients)
        {
            try
            {
                //try usda first
                var usdaData = await _usda.GetNutritionDataAsync(ing.Name);

                if (usdaData != null)
                {
                    var grams = ConvertMeasureToGrams(ing.Measure, ing.Name);
                    var multiplier = grams / 100.0;
                    
                    var calsToAdd = (int)(usdaData.Calories * multiplier);
                    
                    totalNutrition.Calories += (int)(usdaData.Calories * multiplier);
                    totalNutrition.Protein += (float)(usdaData.Protein * multiplier);
                    totalNutrition.Carbohydrates += (float)(usdaData.Carbs * multiplier);
                    totalNutrition.Fat += (float)(usdaData.Fat * multiplier);
                    totalNutrition.Fiber += (float)(usdaData.Fiber * multiplier);
                    totalNutrition.Sugar += (float)(usdaData.Sugar * multiplier);
                    totalNutrition.Sodium += (float)(usdaData.Sodium * multiplier);
                    
                    Console.WriteLine($"✅ {ing.Name} ({grams}g): +{calsToAdd} cal");
                }
                else
                {
                    failedIngredients.Add(ing);
                    Console.WriteLine($"⚠️ {ing.Name} - USDA returned null");
                }
            } catch (Exception ex)
            {
                failedIngredients.Add(ing);
                Console.WriteLine($"❌ {ing.Name} exception: {ex.Message}");
            }
        }

        Console.WriteLine($"📊 TOTAL: {totalNutrition.Calories} cal, {totalNutrition.Protein}g protein, {totalNutrition.Carbohydrates}g carbs, {totalNutrition.Fat}g fat");

        if (failedIngredients.Count > 0)
        {
            Console.WriteLine($"🤖 Using AI for {failedIngredients.Count} failed ingredients");
        
            try
            {
                var deepSeekFallBack = await _deepSeek.CalculateNutritionAsync(failedIngredients, servings);
               
                totalNutrition.Calories += deepSeekFallBack.Calories ?? 0;
                totalNutrition.Protein += deepSeekFallBack.Protein ?? 0;
                totalNutrition.Carbohydrates += deepSeekFallBack.Carbohydrates ?? 0;
                totalNutrition.Fat += deepSeekFallBack.Fat ?? 0;
                totalNutrition.Fiber +=deepSeekFallBack.Fiber ?? 0;
                totalNutrition.Sugar += deepSeekFallBack.Sugar ?? 0;
                totalNutrition.Sodium += deepSeekFallBack.Sodium ?? 0;
                
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
            var fractionMatch = System.Text.RegularExpressions.Regex.Match(measureText, @"(\d+)\s*/\s*(\d+)");
            if (fractionMatch.Success)
            {
                double fractionValue = double.Parse(fractionMatch.Groups[1].Value) / 
                                       double.Parse(fractionMatch.Groups[2].Value);
                
                // If there's a whole number before the fraction (e.g., "1 1/2")
                var wholeNumberMatch = System.Text.RegularExpressions.Regex.Match(measureText, @"^(\d+)\s+\d+/\d+");
                if (wholeNumberMatch.Success)
                {
                    quantity = double.Parse(wholeNumberMatch.Groups[1].Value) + fractionValue;
                }
                else
                {
                    quantity = fractionValue;
                }
            }

            // Volume conversions (approximations)
            if (measureText.Contains("cup"))
            {
                // Different densities for different ingredients
                if (ingredientName.Contains("flour")) return quantity * 125;
                if (ingredientName.Contains("sugar") && !ingredientName.Contains("powder")) return quantity * 200;
                if (ingredientName.Contains("rice")) return quantity * 185;
                if (ingredientName.Contains("oat")) return quantity * 80;
                if (ingredientName.Contains("water") || ingredientName.Contains("milk") || 
                    ingredientName.Contains("juice") || ingredientName.Contains("broth")) return quantity * 240;
                if (ingredientName.Contains("oil") || ingredientName.Contains("butter")) return quantity * 220;
                if (ingredientName.Contains("honey") || ingredientName.Contains("syrup")) return quantity * 340;
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
                return quantity;
            
            // Liquid volume
            if (measureText.Contains("ml"))
                return quantity;
        
            if (measureText.Contains("liter") || measureText.Contains("litre"))
                return quantity * 1000;
        
            if (measureText.Contains("pint"))
                return quantity * 473;
        
            if (measureText.Contains("quart"))
                return quantity * 946;
        
            if (measureText.Contains("gallon"))
                return quantity * 3785;
        
            if (measureText.Contains("fl oz") || measureText.Contains("fluid ounce"))
                return quantity * 30;
            
            if (measureText.Contains("clove") && ingredientName.Contains("garlic"))
                return quantity * 3;
        
            if (measureText.Contains("piece") || measureText.Contains("whole"))
            {
                if (ingredientName.Contains("egg")) return quantity * 50;
                if (ingredientName.Contains("onion")) return quantity * 150;
                if (ingredientName.Contains("tomato")) return quantity * 120;
                if (ingredientName.Contains("potato")) return quantity * 170;
                if (ingredientName.Contains("carrot")) return quantity * 60;
                if (ingredientName.Contains("lemon") || ingredientName.Contains("lime")) return quantity * 60;
                return quantity * 100;
            }
            
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
    