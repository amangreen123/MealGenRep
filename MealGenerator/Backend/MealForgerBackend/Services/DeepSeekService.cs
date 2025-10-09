using MealForgerBackend.Models;
using System.Net.Http.Json;
using System.Text.Json;

namespace MealForgerBackend.Services
{
    public class DeepSeekService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<DeepSeekService> _logger;

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
            var ingredientText = string.Join("\n", ingredients.Select(i => $"{i.Measure}  {i.Name}"));

            Console.WriteLine($"Ingredient list being sent:\n{ingredientText}");

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
                            "You are a nutrition expert. Calculate accurate nutritional information for recipes.\n\n" +
                            "Respond in this EXACT JSON format:\n" +
                            "{\n" +
                            "  \"calories\": number,\n" +
                            "  \"protein\": number,\n" +
                            "  \"carbs\": number,\n" +
                            "  \"fat\": number,\n" +
                            "  \"fiber\": number,\n" +
                            "  \"sugar\": number,\n" +
                            "  \"sodium\": number\n" +
                            "}\n\n" +
                            "All values in grams except calories (kcal) and sodium (mg).\n" +
                            "Use USDA food database knowledge for accuracy.\n" +
                            "Consider the MEASURE (cup, tablespoon, ounce, etc.) carefully.\n" +
                            "Return ONLY valid JSON, no explanation."
                    },
                    new
                    {
                        role = "user",
                        content = $"Calculate total nutrition for ALL these ingredients combined:\n{ingredientText}"
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
                    Console.WriteLine("Nutrition calculation API call failed");
                    Console.WriteLine($"Status: {response.StatusCode}");
                    var errorBody = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error: {errorBody}");
                    return new NutritionData();
                }

                var raw = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<GroqResponse>(raw);
                var content = result?.choices?[0]?.message?.content?.Trim() ?? "{}";

                content = content.Replace("```json", "").Replace("```", "").Trim();
                
                var nutrition = JsonSerializer.Deserialize<NutritionData>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                return nutrition ?? new NutritionData();
            } 
            catch (Exception ex) 
            {
                Console.WriteLine($"Error calculating nutrition: {ex.Message}");
                return new NutritionData();
            }
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