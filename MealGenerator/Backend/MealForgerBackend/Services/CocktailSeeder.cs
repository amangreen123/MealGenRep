using MealForgerBackend.Data;
using MealForgerBackend.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Net.Http.Json;

namespace MealForgerBackend.Services
{
    public class CocktailSeeder
    {
        private readonly MealForgerContext _db;
        private readonly HttpClient _http;
        private readonly IConfiguration _config;

        public CocktailSeeder(MealForgerContext db, HttpClient http, IConfiguration config)
        {
            _db = db;
            _http = http;
            _config = config;
        }

        /// <summary>
        /// Fetches all cocktails (A–Z) and seeds them.
        /// </summary>
        public async Task SeedCocktailsAsync()
        {
            var apiKey = _config["CocktailDbApiKey"];

            if (string.IsNullOrEmpty(apiKey))
            {
                Console.WriteLine("❌ CocktailDB API key is missing in configuration.");
                return;
            }

            var letters = Enumerable.Range('a', 26).Select(i => (char)i);
            int totalAdded = 0;
            int totalSkipped = 0;

            foreach (var letter in letters)
            {
                var url = $"https://www.thecocktaildb.com/api/json/v2/{apiKey}/search.php?f={letter}";
                CocktailDbResponse? response = null;

                for (int attempt = 1; attempt <= 3; attempt++)
                {
                    try
                    {
                        Console.WriteLine($"🍸 Fetching cocktails starting with '{letter}' (Attempt {attempt})...");
                        response = await _http.GetFromJsonAsync<CocktailDbResponse>(url);
                        break;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ Error fetching cocktails for '{letter}': {ex.Message}");
                        if (attempt == 3)
                        {
                            Console.WriteLine("❌ Max retry attempts reached, skipping this letter.");
                        }
                        else
                        {
                            Console.WriteLine("🔄 Retrying...");
                            await Task.Delay(1000 * attempt);
                        }
                    }
                }

                if (response?.Drinks == null || !response.Drinks.Any())
                {
                    Console.WriteLine($"❌ No cocktails found for '{letter}'.");
                    continue;
                }

                Console.WriteLine($"📚 Found {response.Drinks.Count} cocktails for '{letter}'");

                foreach (var drink in response.Drinks)
                {
                    if (await _db.Recipes.AnyAsync(r => r.ExternalId == drink.idDrink))
                    {
                        totalSkipped++;
                        Console.WriteLine($"⏭️  Skipping existing cocktail: {drink.strDrink}");
                        continue;
                    }

                    var recipe = await CreateRecipeFromDrink(drink);
                    _db.Recipes.Add(recipe);
                    totalAdded++;

                    if (totalAdded % 10 == 0)
                    {
                        await _db.SaveChangesAsync();
                        Console.WriteLine($"💾 Saved {totalAdded} cocktails so far...");
                    }
                }

                await _db.SaveChangesAsync();
            }

            Console.WriteLine($"\n✅ Done seeding CocktailDB recipes.");
            Console.WriteLine($"   ➕ Added: {totalAdded}");
            Console.WriteLine($"   ⏭️ Skipped: {totalSkipped}");
        }

        private async Task<Recipes> CreateRecipeFromDrink(CocktailDbDrink drink)
        {
            var recipe = new Recipes
            {
                ExternalId = drink.idDrink,
                Source = "cocktaildb",
                Title = drink.strDrink,
                Category = drink.strCategory,
                Area = drink.strAlcoholic,
                Instructions = drink.strInstructions,
                ImageUrl = drink.strDrinkThumb,
                IsDrink = true
            };

            var ingredientMeasures = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

            for (int i = 1; i <= 15; i++)
            {
                var ingredientName = drink.GetType().GetProperty($"strIngredient{i}")?.GetValue(drink)?.ToString();
                var measure = drink.GetType().GetProperty($"strMeasure{i}")?.GetValue(drink)?.ToString();

                if (string.IsNullOrWhiteSpace(ingredientName))
                    continue;

                ingredientName = ingredientName.Trim();

                if (!ingredientMeasures.ContainsKey(ingredientName))
                    ingredientMeasures[ingredientName] = new List<string>();

                if (!string.IsNullOrWhiteSpace(measure))
                    ingredientMeasures[ingredientName].Add(measure.Trim());
            }

            foreach (var kvp in ingredientMeasures)
            {
                var ingredientName = kvp.Key;
                var combinedMeasure = kvp.Value.Any() ? string.Join(" + ", kvp.Value) : string.Empty;

                var existingIngredient =
                    await _db.Ingredients.FirstOrDefaultAsync(i => i.Name.ToLower() == ingredientName.ToLower());

                Ingredient ingredient;
                if (existingIngredient != null)
                {
                    ingredient = existingIngredient;
                }
                else
                {
                    ingredient = new Ingredient { Name = ingredientName };
                    _db.Ingredients.Add(ingredient);

                    try
                    {
                        await _db.SaveChangesAsync();
                    }
                    catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
                    {
                        _db.Entry(ingredient).State = EntityState.Detached;
                        ingredient = await _db.Ingredients.FirstAsync(i => i.Name.ToLower() == ingredientName.ToLower());
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

    public class CocktailDbResponse
    {
        public List<CocktailDbDrink>? Drinks { get; set; }
    }

    public class CocktailDbDrink
    {
        public string idDrink { get; set; } = string.Empty;
        public string strDrink { get; set; } = string.Empty;
        public string strCategory { get; set; } = string.Empty;
        public string strAlcoholic { get; set; } = string.Empty;
        public string strInstructions { get; set; } = string.Empty;
        public string strDrinkThumb { get; set; } = string.Empty;

        // Up to 15 ingredients in CocktailDB
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
    }
}
