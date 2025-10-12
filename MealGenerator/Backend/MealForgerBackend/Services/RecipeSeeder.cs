using MealForgerBackend.Data;
using MealForgerBackend.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;
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

        /// <summary>
        /// Fetches all MealDB recipes (A–Z) and seeds them with diet classification.
        /// </summary>

        public async Task SeedMealDbAsync()
        {
            var apiKey = _config["MealDbApiKey"];

            if (string.IsNullOrEmpty(apiKey))
            {
                Console.WriteLine(
                    "❌ MealDB API key is not configured. Please set the 'MealDbApiKey' in configuration.");
                return;
            }

            var letters = Enumerable.Range('a', 26).Select(i => (char)i);

            int totalAdded = 0;
            int totalSkipped = 0;

            foreach (var letter in letters)
            {
                var url = $"https://www.themealdb.com/api/json/v2/{apiKey}/search.php?f={letter}";
                MealDbResponse? response = null;

                for (int attempt = 1; attempt <= 3; attempt++)
                {
                    try
                    {
                        Console.WriteLine($"🌐 Fetching meals starting with '{letter}' (Attempt {attempt})...");
                        response = await _http.GetFromJsonAsync<MealDbResponse>(url);
                        break; // Exit loop if successful
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Error fetching data for letter '{letter}': {ex.Message}");
                        if (attempt == 3)
                        {
                            Console.WriteLine("❌ Max retry attempts reached. Moving to next letter.");
                        }
                        else
                        {
                            Console.WriteLine("🔄 Retrying...");
                            await Task.Delay(1000 * attempt); // Wait before retrying
                        }
                    }
                }

                if (response?.Meals == null || !response.Meals.Any())
                {
                    Console.WriteLine("❌ No meals found in the API response.");
                    return;
                }

                Console.WriteLine($"\n📚 Found {response.Meals.Count} meals for '{letter}'");


                foreach (var meal in response.Meals)
                {
                    if (await _db.Recipes.AnyAsync(r => r.ExternalId == meal.idMeal))
                    {
                        totalSkipped++;
                        Console.WriteLine($"⏭️  Skipping existing recipe: {meal.strMeal}");
                        continue;
                    }

                    var recipe = await CreateRecipeFromMeal(meal);
                    _db.Recipes.Add(recipe);
                    totalAdded++;

                    if (totalAdded % 10 == 0)
                    {
                        await _db.SaveChangesAsync();
                        Console.WriteLine($"💾 Saved {totalAdded} new recipes so far...");
                    }
                }

                await _db.SaveChangesAsync();

            }

            Console.WriteLine($"\n✅ Done seeding MealDB recipes.");
            Console.WriteLine($"   ➕ Added: {totalAdded}");
            Console.WriteLine($"   ⏭️ Skipped: {totalSkipped}");
        }

        private async Task<Recipes> CreateRecipeFromMeal(MealDbMeal meal)
        {

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

            var ingredientMeasures = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

            for (int i = 1; i <= 20; i++)
            {
                var ingredientName = meal.GetType().GetProperty($"strIngredient{i}")?.GetValue(meal)?.ToString();
                var measure = meal.GetType().GetProperty($"strMeasure{i}")?.GetValue(meal)?.ToString();

                if (string.IsNullOrWhiteSpace(ingredientName))
                    continue;

                ingredientName = ingredientName.Trim();
                if (!ingredientMeasures.ContainsKey(ingredientName))
                {
                    ingredientMeasures[ingredientName] = new List<string>();
                }

                if (!string.IsNullOrWhiteSpace(measure))
                {
                    ingredientMeasures[ingredientName].Add(measure.Trim());
                }

            }

            var ingredientList = string.Join(",", ingredientMeasures.Keys);
            try
            {
                var deepSeekService = new DeepSeekService(_http, _config);
                var dietInfo = await deepSeekService.ClassifyAllDietsAsync(ingredientList);

                recipe.IsVegan = dietInfo.IsVegan;
                recipe.IsVegetarian = dietInfo.IsVegetarian;
                recipe.IsGlutenFree = dietInfo.IsGlutenFree;
                recipe.IsKeto = dietInfo.IsKeto;
                recipe.IsPaleo = dietInfo.IsPaleo;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error classifying diets for recipe '{recipe.Title}': {ex.Message}");
                recipe.IsVegan = recipe.IsVegetarian = recipe.IsGlutenFree = recipe.IsKeto = recipe.IsPaleo = false;
            }

            foreach (var kvp in ingredientMeasures)
            {
                var ingredientName = kvp.Key;
                var combinedMeasure = kvp.Value.Any() ? string.Join(" + ", kvp.Value) : string.Empty;

                var ingredient =
                    await _db.Ingredients.FirstOrDefaultAsync(i => i.Name.ToLower() == ingredientName.ToLower());

                if (ingredient == null)
                {
                    ingredient = new Ingredient { Name = ingredientName };
                    _db.Ingredients.Add(ingredient);

                    try
                    {
                        await _db.SaveChangesAsync();
                    }
                    catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx &&
                                                       pgEx.SqlState == "23505")
                    {
                        _db.Entry(ingredient).State = EntityState.Detached;
                        ingredient = await _db.Ingredients.FirstOrDefaultAsync(i => i.Name.ToLower() == ingredientName.ToLower());
                    }
                }

                recipe.RecipeIngredients.Add(new RecipeIngredient
                {
                    Ingredient = ingredient,
                    Quantity = combinedMeasure
                });

            }

            return recipe;
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

