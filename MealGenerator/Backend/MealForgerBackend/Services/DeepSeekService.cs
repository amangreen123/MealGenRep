using MealForgerBackend.Models;
using System.Net.Http.Json;
using System.Text.Json;

namespace MealForgerBackend.Services
{
    public class DeepSeekService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;

        public DeepSeekService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _config = config;
        }

        public async Task<string> ValidateIngredientsAsync(string ingredients)
        {
            var payload = new
            {
                model = "llama-3.1-8b-instant",
                temperature = 0,
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content =
                            "Strictly validate food ingredients. Respond only with the ingredient or an error. Follow these rules:\n" +
                            "1. Return the EXACT input if it is a commonly recognized food ingredient (e.g., meat, vegetable, fruit, grain, spice, dairy, etc.).\n" +
                            "2. Correct obvious spelling mistakes (max 1 change) and return the corrected ingredient.\n" +
                            "3. If the input is NOT a food ingredient (e.g., rock, wood, plastic), return exactly: \"Error: invalid ingredient '{input}'\", where {input} is what the user typed.\n" +
                            "4. NEVER add explanations, extra text, or formatting — respond only with either the valid ingredient or the exact error message."
                    },
                    new { role = "user", content = ingredients }
                }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
            {
                Content = JsonContent.Create(payload)
            };

            request.Headers.Add("Authorization", $"Bearer {_config["GroqApiKey"]}");

            var response = await _http.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Ingredient validation API call failed. Status: {response.StatusCode}, Error: {errorBody}");
                throw new Exception("Failed to validate ingredient.");
            }
            
            var raw = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<GroqResponse>(raw);
            return result?.choices?[0]?.message?.content?.Trim() ?? "Error: invalid ingredient";
        }

        public async Task<DietClassification> ClassifyAllDietsAsync(string ingredients)
        {
            var payload = new
            {
                model = "llama-3.1-8b-instant",
                temperature = 0,
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content =
                            "You are a diet classification expert. Analyze the ingredients and determine which diets this recipe fits.\n\n" +
                            "Respond in this EXACT format (one per line):\n" +
                            "Vegan: YES or NO\n" +
                            "Vegetarian: YES or NO\n" +
                            "Ketogenic: YES or NO\n" +
                            "GlutenFree: YES or NO\n" +
                            "Paleo: YES or NO\n\n" +
                            "Diet Rules:\n" +
                            "- Vegan: No animal products (meat, dairy, eggs, honey, gelatin, fish sauce, etc.)\n" +
                            "- Vegetarian: No meat or fish, but dairy and eggs are allowed\n" +
                            "- Ketogenic: Very low carb (<20g net carbs per serving), high fat, no sugar/grains/starchy vegetables\n" +
                            "- GlutenFree: No wheat, barley, rye, or standard oats (assume oats contain gluten unless specified as gluten-free)\n" +
                            "- Paleo: No grains, legumes, dairy, refined sugar, or processed foods. Only whole foods.\n\n" +
                            "Be strict. If you're unsure, answer NO."
                    },
                    new
                    {
                        role = "user",
                        content = $"Classify this recipe:\nIngredients: {ingredients}"
                    }
                }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
            {
                Content = JsonContent.Create(payload)
            };

            request.Headers.Add("Authorization", $"Bearer {_config["GroqApiKey"]}");

            try
            {
                var response = await _http.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine("Diet classification API call failed");
                    return new DietClassification();
                }

                var raw = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<GroqResponse>(raw);
                var content = result?.choices?[0]?.message?.content?.Trim() ?? "";

                var classification = new DietClassification
                {
                    IsVegan = content.Contains("Vegan: YES", StringComparison.OrdinalIgnoreCase),
                    IsVegetarian = content.Contains("Vegetarian: YES", StringComparison.OrdinalIgnoreCase),
                    IsKeto = content.Contains("Ketogenic: YES", StringComparison.OrdinalIgnoreCase),
                    IsGlutenFree = content.Contains("GlutenFree: YES", StringComparison.OrdinalIgnoreCase),
                    IsPaleo = content.Contains("Paleo: YES", StringComparison.OrdinalIgnoreCase)
                };

                return classification;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error classifying diets: {ex.Message}");
                return new DietClassification();
            }
        }
        
        public async Task<NutritionData> CalculateNutritionAsync(List<IngredientWithMeasure> ingredients, int servings = 4) 
        {
            // ✅ ADDED: Check if we should use fallback immediately for alcohol
            if (ShouldUseFallback(ingredients))
            {
                Console.WriteLine("🍸 Detected alcohol ingredients - using specialized fallback");
                return EstimateNutritionFallback(ingredients, servings);
            }

            var ingredientText = string.Join("\n", ingredients.Select(i => $"{i.Measure}  {i.Name}"));

            Console.WriteLine($"🤖 Ingredient list being sent to AI:\n{ingredientText}");

            var payload = new
            {
                model = "llama-3.3-70b-versatile", // ✅ UPGRADED: Better model for nutrition
                temperature = 0.1,
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content =
                            "You are a professional nutritionist with access to USDA food database knowledge.\n\n" +
                            "CRITICAL NUTRITION FACTS:\n" +
                            "- Pure spirits (vodka, rum, gin, whiskey, tequila): ~97 calories per 1.5 oz shot, 0g protein, 0g carbs, 0g fat\n" +
                            "- Liqueurs (Kahlua, Baileys, Triple Sec): ~100-160 calories per 1.5 oz, 10-17g carbs, 0-3g fat\n" +
                            "- Wine: ~120-130 calories per 5 oz, 3-5g carbs\n" +
                            "- Beer: ~150 calories per 12 oz, 13g carbs\n" +
                            "- Coffee liqueur (Kahlúa): ~107 calories per oz, 13g carbs\n" +
                            "- Cream liqueur (Baileys): ~107 calories per oz, 11g carbs, 3.5g fat\n\n" +
                            "Respond ONLY with valid JSON (no markdown):\n" +
                            "{\n" +
                            "  \"calories\": <number>,\n" +
                            "  \"protein\": <number>,\n" +
                            "  \"carbs\": <number>,\n" +
                            "  \"fat\": <number>,\n" +
                            "  \"fiber\": <number>,\n" +
                            "  \"sugar\": <number>,\n" +
                            "  \"sodium\": <number>\n" +
                            "}\n\n" +
                            "Units: calories in kcal, all others in grams, sodium in mg.\n" +
                            "Calculate TOTAL nutrition for ALL ingredients combined.\n" +
                            "Use the EXACT measures provided (oz, cups, tbsp, etc.)."
                    },
                    new
                    {
                        role = "user",
                        content = $"Calculate the total nutrition for these ingredients:\n{ingredientText}\n\nReturn ONLY the JSON object."
                    }
                }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
            {
                Content = JsonContent.Create(payload)
            };

            var apiKey = _config["GroqApiKey"];
            request.Headers.Add("Authorization", $"Bearer {apiKey}");

            try
            {
                var response = await _http.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine("❌ Nutrition API call failed");
                    Console.WriteLine($"Status: {response.StatusCode}");
                    var errorBody = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error: {errorBody}");
                    return EstimateNutritionFallback(ingredients, servings);
                }

                var raw = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<GroqResponse>(raw);
                var content = result?.choices?[0]?.message?.content?.Trim() ?? "{}";

                // Clean up markdown formatting
                content = content.Replace("```json", "").Replace("```", "").Trim();
                
                Console.WriteLine($"🤖 Raw nutrition response:\n{content}");
                
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString
                };
                
                var nutrition = JsonSerializer.Deserialize<NutritionData>(content, options);
                
                // ✅ ADDED: Validate AI response - if zeros, use fallback
                if (nutrition != null && ((nutrition.Calories ?? 0) == 0 && (nutrition.Protein ?? 0) == 0 && (nutrition.Carbohydrates ?? 0) == 0))
                {
                    Console.WriteLine("⚠️ AI returned all zeros - using fallback estimation");
                    return EstimateNutritionFallback(ingredients, servings);
                }
                
                Console.WriteLine($"✅ AI Nutrition: {nutrition?.Calories ?? 0}cal, {nutrition?.Protein ?? 0}g protein, {nutrition?.Carbohydrates ?? 0}g carbs");
                
                return nutrition ?? new NutritionData();
            } 
            catch (Exception ex) 
            {
                Console.WriteLine($"❌ Error calculating nutrition: {ex.Message}");
                return EstimateNutritionFallback(ingredients, servings);
            }
        }

        // ✅ NEW: Check if ingredients are primarily alcohol (use fallback)
        private bool ShouldUseFallback(List<IngredientWithMeasure> ingredients)
        {
            var alcoholKeywords = new[] { "vodka", "rum", "gin", "whiskey", "whisky", "tequila", 
                                          "liqueur", "schnapps", "brandy", "cognac", "wine", "beer", 
                                          "champagne", "sake", "vermouth", "aperol", "campari" };
            
            var alcoholCount = ingredients.Count(i => 
                alcoholKeywords.Any(kw => i.Name.ToLower().Contains(kw)));
            
            // If more than 50% are alcohol, use fallback
            return alcoholCount > ingredients.Count / 2;
        }

        // ✅ NEW: Accurate alcohol nutrition fallback
        private NutritionData EstimateNutritionFallback(List<IngredientWithMeasure> ingredients, int servings)
        {
            Console.WriteLine("🔢 Using fallback nutrition estimation");
            
            var nutrition = new NutritionData
            {
                Calories = 0,
                Protein = 0,
                Carbohydrates = 0,
                Fat = 0,
                Fiber = 0,
                Sugar = 0,
                Sodium = 0
            };

            foreach (var ing in ingredients)
            {
                var name = ing.Name.ToLower();
                var measure = ing.Measure.ToLower();
                
                // Extract quantity with fraction support
                double quantity = ExtractQuantity(measure);

                Console.WriteLine($"📊 Processing: {quantity} {measure} {name}");

                // Alcohol calculations (per oz)
                if (name.Contains("vodka") || name.Contains("rum") || name.Contains("gin") || 
                    name.Contains("tequila") || name.Contains("whiskey") || name.Contains("whisky") ||
                    name.Contains("brandy") || name.Contains("cognac"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 64); // 64 cal per oz
                        Console.WriteLine($"  → Added {quantity * 64} calories (spirit)");
                    }
                }
                else if (name.Contains("coffee liqueur") || name.Contains("kahlua") || name.Contains("kahlúa"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 107); // 107 cal per oz
                        nutrition.Carbohydrates += (float)(quantity * 13); // 13g carbs per oz
                        nutrition.Sugar += (float)(quantity * 11); // 11g sugar per oz
                        Console.WriteLine($"  → Added {quantity * 107} calories, {quantity * 13}g carbs (coffee liqueur)");
                    }
                }
                else if (name.Contains("cream liqueur") || name.Contains("baileys") || name.Contains("irish cream"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 107);
                        nutrition.Carbohydrates += (float)(quantity * 11);
                        nutrition.Fat += (float)(quantity * 3.5);
                        nutrition.Sugar += (float)(quantity * 7);
                        Console.WriteLine($"  → Added {quantity * 107} calories (cream liqueur)");
                    }
                }
                else if (name.Contains("triple sec") || name.Contains("cointreau") || 
                         name.Contains("grand marnier") || name.Contains("schnapps"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 100);
                        nutrition.Carbohydrates += (float)(quantity * 11);
                        Console.WriteLine($"  → Added {quantity * 100} calories (liqueur)");
                    }
                }
                else if (name.Contains("vermouth"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 45);
                        nutrition.Carbohydrates += (float)(quantity * 4);
                    }
                }
                else if (name.Contains("wine"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 24);
                        nutrition.Carbohydrates += (float)(quantity * 0.8);
                    }
                }
                else if (name.Contains("beer"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 12);
                        nutrition.Carbohydrates += (float)(quantity * 1.1);
                    }
                }
                else if (name.Contains("juice") || name.Contains("soda") || name.Contains("cola"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 12);
                        nutrition.Carbohydrates += (float)(quantity * 3);
                        nutrition.Sugar += (float)(quantity * 3);
                    }
                }
                else if (name.Contains("simple syrup") || name.Contains("syrup"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 65);
                        nutrition.Carbohydrates += (float)(quantity * 17);
                        nutrition.Sugar += (float)(quantity * 17);
                    }
                }
                else if (name.Contains("cream") || name.Contains("half"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 40);
                        nutrition.Fat += (float)(quantity * 3.5);
                        nutrition.Protein += (float)(quantity * 1);
                    }
                }
                else if (name.Contains("milk"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 18);
                        nutrition.Protein += (float)(quantity * 1);
                        nutrition.Carbohydrates += (float)(quantity * 1.5);
                    }
                }
                else if (name.Contains("lime") || name.Contains("lemon"))
                {
                    if (measure.Contains("oz"))
                    {
                        nutrition.Calories += (int)(quantity * 8);
                        nutrition.Carbohydrates += (float)(quantity * 2.5);
                    }
                }
            }

            Console.WriteLine($"🔢 Fallback Total: {nutrition.Calories}cal, {nutrition.Carbohydrates}g carbs, {nutrition.Fat}g fat");
            return nutrition;
        }

        // ✅ NEW: Extract quantity from measure text (handles fractions)
        private double ExtractQuantity(string measure)
        {
            measure = measure.Trim();
            
            // Handle fractions like "1 1/2" or "3/4"
            var fractionPattern = @"(\d+)?\s*(\d+)/(\d+)";
            var match = System.Text.RegularExpressions.Regex.Match(measure, fractionPattern);
            
            if (match.Success)
            {
                double whole = string.IsNullOrEmpty(match.Groups[1].Value) ? 0 : double.Parse(match.Groups[1].Value);
                double numerator = double.Parse(match.Groups[2].Value);
                double denominator = double.Parse(match.Groups[3].Value);
                return whole + (numerator / denominator);
            }
            
            // Handle simple numbers
            var numberMatch = System.Text.RegularExpressions.Regex.Match(measure, @"[\d.]+");
            if (numberMatch.Success)
            {
                return double.Parse(numberMatch.Value);
            }
            
            return 1.0; // Default
        }
    }

    // Response model for Groq (same structure as OpenAI)
    public class GroqResponse
    {
        public List<GroqChoice>? choices { get; set; }
    }

    public class GroqChoice
    {
        public GroqMessage? message { get; set; }
    }

    public class GroqMessage
    {
        public string? content { get; set; }
    }
}