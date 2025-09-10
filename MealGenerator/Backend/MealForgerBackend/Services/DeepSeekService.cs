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
                model = "deepseek/deepseek-chat-v3.1:free",
                
                messages = new[]
                {
                    new { role = "system", content =
                        "Strictly validate food ingredient:\n" +
                        "- Return exact input if valid\n" +
                        "- Correct typos (max 1 change)\n" +
                        "- Return 'Error: invalid ingredient' if not a food\n" +
                        "- No explanations." },
                    new { role = "user", content = ingredients }
                }
            };
            var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions")
            {
                Content = JsonContent.Create(payload)
            };
            
            request.Headers.Add("Authorization", $"Bearer {_config["OpenRouterApiKey"]}");
            
            var response = await _http.SendAsync(request);
            
            if(!response.IsSuccessStatusCode)
            {
                throw new Exception("Failed to validate ingredient.");
            }
            
            var raw = await response.Content.ReadAsStringAsync();
            Console.WriteLine("🔍 OpenRouter raw response:\n" + raw);
            var result = JsonSerializer.Deserialize<OpenRouterResponse>(raw);
            return result?.choices?[0]?.message?.content?.Trim() ?? "Error: invalid ingredient";
        }
    }
}