using MealForgerBackend.Models;
using System.Net.Http.Json;
using System.Text.Json;

namespace MealForgerBackend.Services
{

    public class GeminiService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly DeepSeekService _deepSeek;


        public GeminiService(HttpClient http, IConfiguration config, DeepSeekService deepSeek)
        {
            _http = http;
            _config = config;
            _deepSeek = deepSeek;
        }


        public async Task<IngredientIdentificationResult> IdentifyIngredientFromImageAsync(string image)
        {
            try
            {
                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new object[]
                            {
                                new
                                {
                                    text =
                                        "List all food ingredients you can identify in this picture. Respond with ONLY the ingredient name in singular form. " +
                                        "Examples: 'apple', 'chicken breast', 'tomato', 'onion', 'carrot'. " +
                                        "If multiple items are visible, name the most prominent one. " +
                                        "If no food is visible, respond with 'none'."
                                },
                                new
                                {
                                    inline_data = new
                                    {
                                        mime_type = "image/jpeg",
                                        data = image
                                    }
                                }
                            }
                        }
                    }
                };

                var apiKey = _config["GEMINI_API_KEY"];
                var request = new HttpRequestMessage(HttpMethod.Post,
                    $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}")
                {
                    Content = JsonContent.Create(payload)
                };

                var response = await _http.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBOdy = await response.Content.ReadAsStringAsync();

                    return new IngredientIdentificationResult
                    {
                        Success = false,
                        ErrorMessage = $"Error from Gemini API: {response.StatusCode} - {errorBOdy}"
                    };
                }

                var result = await response.Content.ReadFromJsonAsync<GeminiResponse>();
                var rawIngredient = result?.candidates?[0]?.content?.parts?.FirstOrDefault()?.text?.Trim() ?? "none";

                if (rawIngredient.Equals("none", StringComparison.OrdinalIgnoreCase))
                {
                    return new IngredientIdentificationResult
                    {
                        Success = false,
                        ErrorMessage = "No food ingredient identified in the image.",
                    };
                }

                var validatedIngredient = await _deepSeek.ValidateIngredientsAsync(rawIngredient);
                
                if (validatedIngredient.StartsWith("Error:", StringComparison.OrdinalIgnoreCase))
                {
                    return new IngredientIdentificationResult
                    {
                        Success = false,
                        RawIngredient = rawIngredient,
                        ErrorMessage = validatedIngredient
                    };
                }
                return new IngredientIdentificationResult
                {
                    Success = true,
                    RawIngredient = rawIngredient,
                    ValidatedIngredient = validatedIngredient
                };

            } catch (Exception ex) {
                
                return new IngredientIdentificationResult
                {
                    Success = false,
                    ErrorMessage = $"Exception occurred: {ex.Message}"
                };
            }
        }
    }
}
    
    

