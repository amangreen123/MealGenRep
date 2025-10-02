
namespace MealForgerBackend.Services
{
    public class USDAService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private static readonly Dictionary<string, USDANutritionData> _cache = new();
        
        
        public USDAService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _config = config;
        }


        public async Task<USDANutritionData?> GetNutritionDataAsync(string ingredient)
        {
            if (_cache.ContainsKey(ingredient.ToLower()))
            {
                return _cache[ingredient.ToLower()];
            }

            try
            {
                var apiKey = _config["USDAApiKey"];
                var response = await _http.GetAsync(
                    $"https://api.nal.usda.gov/fdc/v1/foods/search?query={Uri.EscapeDataString(ingredient)}&pageSize=1&api_key={apiKey}");

                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var data = await response.Content.ReadFromJsonAsync<USDASearchResponse>();

                if (data?.Foods == null || !data.Foods.Any())
                {
                    return null;
                }

                var food = data.Foods.First();

                var nutritionData = new USDANutritionData
                {
                    Description = food.Description,
                    FdcId = food.FdcId,
                    Calories = ExtractNutrient(food, "208"), // Energy
                    Protein = ExtractNutrient(food, "203"), // Protein
                    Fat = ExtractNutrient(food, "204"), // Total lipid (fat)
                    Carbs = ExtractNutrient(food, "205") // Carbohydrate,
                };
                _cache[ingredient.ToLower()] = nutritionData;
                return nutritionData;

            } catch (Exception ex) {
                Console.WriteLine($"Error fetching nutrition data: {ex.Message}");
                return null;
            }

        }
        
        private double ExtractNutrient(USDAFood food, string nutrientId)
        {
            var nutrient = food.FoodNutrients?.FirstOrDefault(n => n.NutrientId == nutrientId);
            return nutrient?.Value ?? 0.0;
        }
        
        public class USDANutritionData
        {
            public string Description { get; set; }
            public int FdcId { get; set; }
            public double Calories { get; set; }
            public double Protein { get; set; }
            public double Fat { get; set; }
            public double Carbs { get; set; }
        }
        
        public class USDASearchResponse
        {
            public List<USDAFood> Foods { get; set; } = new();
        }
    
        public class USDAFood
        {
            public string Description { get; set; } = string.Empty;
            public int FdcId { get; set; }
            public List<FoodNutrient>? FoodNutrients { get; set; }
            public string DataType { get; set; } = string.Empty;
        }
    
        public class FoodNutrient
        {
            public string NutrientId { get; set; } = string.Empty;
            public string NutrientNumber { get; set; } = string.Empty;
            public string NutrientName { get; set; } = string.Empty;
            public double Value { get; set; }
            public string UnitName { get; set; } = string.Empty;
        }
        

    }
    
   
}

