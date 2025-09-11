using MealForgerBackend.Data;
using MealForgerBackend.Models;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;


namespace MealForgerBackend.Services
{
    public class RecipeSeeder
    {
        private readonly MealForgerContext _db;
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        
        public RecipeSeeder(MealForgerContext db, HttpClient http, IConfiguration config) 
        {
            _db = db;
            _http = http;
            _config = config;
        }

        public async Task SeedMealDbAsync()
        {
            var apiKey = _config["MealDbApiKey"];
            var url = $"https://www.themealdb.com/api/json/v1/{apiKey}/search.php?s=";
            
            var response = await _http.GetFromJsonAsync<MealDbResponse>(url); 
            
            if(response?.Meals == null || !response.Meals.Any())
            {
                Console.WriteLine("❌ No meals found in the API response.");
                return;
            }

            foreach (var meal in response.Meals)
            {
                if (await _db.Recipes.AnyAsync(r => r.ExternalId == meal.idMeal)) continue;

                var recipe = new Recipes
                {
                    ExternalId = meal.idMeal,
                    Source = "mealdb",
                    Title = meal.strMeal,
                    Category = meal.strCategory,
                    Area = meal.strArea,
                    Instructions = meal.strInstructions,
                    ImageUrl = meal.strMealThumb,
                    IsDrink = false
                };

                for (int i = 1; i <= 20; i++)
                {
                    var ingredient = meal.GetType().GetProperty($"strIngredient{i}")?.GetValue(meal)?.ToString();
                    var measure = meal.GetType().GetProperty($"strMeasure{i}")?.GetValue(meal)?.ToString();
                    
                    if(string.IsNullOrWhiteSpace(ingredient)) continue;
                    
                    var ing = await _db.Ingredients
                        .FirstOrDefaultAsync(i => i.Name.ToLower() == ingredient.ToLower())
                        ?? new Ingredient { Name = ingredient };

                    recipe.RecipeIngredients.Add(new RecipeIngredient
                    {
                        Ingredient = ing,
                        Quantity = measure ?? string.Empty
                    });
                }
                
                _db.Recipes.Add(recipe);
            }
            await _db.SaveChangesAsync();
            Console.WriteLine("✅ MealDB recipes seeded successfully.");
        }

    }
    
    public class MealDbResponse
    {
        public List<MealDbMeal>? Meals { get; set; }
    }

    public class MealDbMeal
    {
        public string idMeal { get; set; } = string.Empty;
        public string strMeal { get; set; } = string.Empty;
        public string strCategory { get; set; } = string.Empty;
        public string strArea { get; set; } = string.Empty;
        public string strInstructions { get; set; } = string.Empty;
        public string strMealThumb { get; set; } = string.Empty;
        public string? strTags { get; set; }
        public string? strYoutube { get; set; }
        public string? strSource { get; set; }
        public string? strImageSource { get; set; }
        public string? strCreativeCommonsConfirmed { get; set; }
        public string? dateModified { get; set; }

        // Ingredients and Measures
        public string? strIngredient1 { get; set; }
        public string? strIngredient2 { get; set; }
        public string? strIngredient3 { get; set; }
        public string? strIngredient4 { get; set; }
        public string? strIngredient5 { get; set; }
        public string? strIngredient6 { get; set; }
        public string? strIngredient7 { get; set; }
        public string? strIngredient8 { get; set; }
        public string? strIngredient9 { get; set; }
        public string? strIngredient10 { get; set; }
        public string? strIngredient11 { get; set; }
        public string? strIngredient12 { get; set; }
        public string? strIngredient13 { get; set; }
        public string? strIngredient14 { get; set; }
        public string? strIngredient15 { get; set; }
        public string? strIngredient16 { get; set; }
        public string? strIngredient17 { get; set; }
        public string? strIngredient18 { get; set; }
        public string? strIngredient19 { get; set; }
        public string? strIngredient20 { get; set; }

        public string? strMeasure1 { get; set; }
        public string? strMeasure2 { get; set; }
        public string? strMeasure3 { get; set; }
        public string? strMeasure4 { get; set; }
        public string? strMeasure5 { get; set; }
        public string? strMeasure6 { get; set; }
        public string? strMeasure7 { get; set; }
        public string? strMeasure8 { get; set; }
        public string? strMeasure9 { get; set; }
        public string? strMeasure10 { get; set; }
        public string? strMeasure11 { get; set; }
        public string? strMeasure12 { get; set; }
        public string? strMeasure13 { get; set; }
        public string? strMeasure14 { get; set; }
        public string? strMeasure15 { get; set; }
        public string? strMeasure16 { get; set; }
        public string? strMeasure17 { get; set; }
        public string? strMeasure18 { get; set; }
        public string? strMeasure19 { get; set; }
        public string? strMeasure20 { get; set; }
    }

}

