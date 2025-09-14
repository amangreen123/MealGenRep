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

        public async Task SeedCocktailDbAsync()
{
    var apiKey = _config["CocktailDbApiKey"];
    var url = $"https://www.thecocktaildb.com/api/json/v2/{apiKey}/search.php?s=";

    var response = await _http.GetFromJsonAsync<CocktailDbResponse>(url);

    if (response?.Drinks == null || !response.Drinks.Any())
    {
        Console.WriteLine("❌ No drinks found in the API response.");
        return;
    }

    foreach (var drink in response.Drinks)
    {
        // Check CockTails table, not Recipes
        if (await _db.CockTails.AnyAsync(c => c.Id == drink.idDrink))
        {
            Console.WriteLine($"⏭️  Skipping existing cocktail: {drink.strDrink}");
            continue;
        }

        Console.WriteLine($"➕ Processing: {drink.strDrink}");

        var drinkRecipe = new CockTails 
        {
             Id = drink.idDrink,
             Name = drink.strDrink,
             Category = drink.strCategory,
             Alcoholic = drink.strAlcoholic,
             Glass = drink.strGlass,
             Instructions = drink.strInstructions,
             Thumbnail = drink.strDrinkThumb
        };

        var ingredientMeasures = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        // Your ingredient collection logic is fine...
        for (int i = 1; i <= 15; i++)
        {
            var drinkIngredientName = drink.GetType().GetProperty($"strIngredient{i}")?.GetValue(drink)?.ToString();
            var drinkIngredientMeasure = drink.GetType().GetProperty($"strMeasure{i}")?.GetValue(drink)?.ToString();

            if (string.IsNullOrWhiteSpace(drinkIngredientName)) continue;

            drinkIngredientName = drinkIngredientName.Trim();

            if (!ingredientMeasures.ContainsKey(drinkIngredientName))
            {
                ingredientMeasures[drinkIngredientName] = new List<string>();
            }

            if (!string.IsNullOrWhiteSpace(drinkIngredientMeasure))
            {
                ingredientMeasures[drinkIngredientName].Add(drinkIngredientMeasure.Trim());
            }
        }

        foreach (KeyValuePair<string, List<string>> drinkIngredientEntry in ingredientMeasures)
        {
            var drinkIngredientName = drinkIngredientEntry.Key;
            var drinkIngredientMeasures = drinkIngredientEntry.Value;

            var combinedMeasure = drinkIngredientMeasures.Any() 
                ? string.Join(" + ", drinkIngredientMeasures) 
                : string.Empty;

            // Check DrinkIngredients table, not Ingredients
            var existingIngredient = await _db.DrinkIngredients
                .FirstOrDefaultAsync(i => i.Name.ToLower() == drinkIngredientName.ToLower());

            DrinkIngredient ingredient;

            if (existingIngredient != null) // ← Fixed: Added missing if
            {
                ingredient = existingIngredient;
            }
            else
            {
                ingredient = new DrinkIngredient { Name = drinkIngredientName };
                _db.DrinkIngredients.Add(ingredient);

                try
                {
                    await _db.SaveChangesAsync();
                    Console.WriteLine($"   ➕ Added new ingredient: {ingredient.Name}");
                }
                catch (DbUpdateException dbEx) when (dbEx.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
                {
                    Console.WriteLine($" ⚠️  Ingredient already exists, fetching existing: {ingredient.Name}");
                    _db.Entry(ingredient).State = EntityState.Detached;
                    ingredient = await _db.DrinkIngredients.FirstAsync(i =>
                        i.Name.ToLower() == drinkIngredientName.ToLower());
                }
            }

            var drinkRecipeIngredient = new DrinkRecipeIngredient
            {
                CockTail = drinkRecipe,  
                DrinkIngredient = ingredient,
                Measure = combinedMeasure
            };
            
            
            _db.DrinkRecipeIngredients.Add(drinkRecipeIngredient);
        }
        
        _db.CockTails.Add(drinkRecipe);
    }
    
    await _db.SaveChangesAsync();
    Console.WriteLine("✅ Cocktail seeding completed.");
    }
        
        
    }

    public class CocktailDbResponse
    {
        public List<CockTailsDB>? Drinks { get; set; }
    }

    public class CockTailsDB
    {
        public string idDrink { get; set; } = null!;
        public string strDrink { get; set; } = null!;
        public string strCategory { get; set; } = null!;
        public string strAlcoholic { get; set; } = null!;
        public string strGlass { get; set; } = null!;
        public string strInstructions { get; set; } = null!;
        public string strDrinkThumb { get; set; } = null!;

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
        
