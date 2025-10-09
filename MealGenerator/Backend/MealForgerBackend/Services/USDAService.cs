
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
                int fdcId = food.FdcId;

                
                var detailedResponse = await _http.GetAsync(
                    $"https://api.nal.usda.gov/fdc/v1/food/{fdcId}?api_key={apiKey}");
                
                if(!detailedResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine($"❌ Failed to get details for FdcId: {fdcId}. Status: {detailedResponse.StatusCode}");
                    return null;
                }
                
                var detailedFood = await detailedResponse.Content.ReadFromJsonAsync<USDAFood>();

                if (detailedFood?.FoodNutrients == null)
                {
                    Console.WriteLine($"⚠️ FdcId: {fdcId} had no nutrient breakdown in detail view.");
                    return null;

                }
                
                var nutritionData = new USDANutritionData
                {
                    Description =  detailedFood.Description,
                    FdcId = detailedFood.FdcId,
                    Calories = ExtractNutrient(detailedFood.FoodNutrients, "208"),
                    Protein = ExtractNutrient(detailedFood.FoodNutrients, "203"),
                    Carbs = ExtractNutrient(detailedFood.FoodNutrients, "205"),
                    Fat = ExtractNutrient(detailedFood.FoodNutrients, "204"),
                    Fiber = ExtractNutrient(detailedFood.FoodNutrients, "291"),
                    Sugar = ExtractNutrient(detailedFood.FoodNutrients, "269"),
                    Sodium = ExtractNutrient(detailedFood.FoodNutrients, "307")
                };
                
                Console.WriteLine($"✅ USDA: {ingredient} → Calories: {nutritionData.Calories}, Protein: {nutritionData.Protein}g");

                _cache[ingredient.ToLower()] = nutritionData;
                
                return nutritionData;

            } catch (Exception ex) {
                Console.WriteLine($"❌ USDA error for {ingredient}: {ex.Message}");
                return null;
            }

        }
        
        private double ExtractNutrient(List<FoodNutrient>? foodNutrients, string nutrientNumber)
        {
            var nutrient = foodNutrients?
                .FirstOrDefault(n => n.NutrientNumber == nutrientNumber);             
            
            return nutrient?.Value ?? 0.0;
        }
       
        
        public class USDANutritionData
        {
            public string Description { get; set; } = string.Empty;
            public int FdcId { get; set; }
            public double Calories { get; set; }
            public double Protein { get; set; }
            public double Fat { get; set; }
            public double Carbs { get; set; }
            public double Fiber { get; set; }
            public double Sugar { get; set; }
            public double Sodium { get; set; }
            
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
            public int NutrientId { get; set; }
            public string NutrientNumber { get; set; } = string.Empty;
            public string NutrientName { get; set; } = string.Empty;
            public double Value { get; set; }
            public string UnitName { get; set; } = string.Empty;
        }
        

    }
    
   
}

