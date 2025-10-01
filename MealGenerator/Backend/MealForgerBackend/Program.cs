using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using System.Collections.Generic;

using MealForgerBackend.Models;
using MealForgerBackend.Services;
using MealForgerBackend.Data;
using Microsoft.AspNetCore.Http.Json;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();

//DB Context
builder.Services.AddDbContext<MealForgerContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("MealForgerRecipes")));


// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://mealforger.org")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; 
});

// DeepSeek Service
builder.Services.AddHttpClient<DeepSeekService>();
builder.Services.AddScoped<DeepSeekService>();

// Recipe Seeder Service
builder.Services.AddHttpClient<RecipeSeeder>();
builder.Services.AddScoped<RecipeSeeder>();

// Cocktail Seeder Service
builder.Services.AddHttpClient<CocktailSeeder>();
builder.Services.AddScoped<CocktailSeeder>();

var app = builder.Build();

app.UseCors();

//DeeoSeek Ingredient Validation Endpoint
app.MapPost("/validate-ingredient", async (DeepSeekService deepSeek, IngredientRequest request) =>
{
    if(string.IsNullOrWhiteSpace(request.Ingredient))
    {
        return Results.BadRequest("Ingredient cannot be empty.");
    }

    try
    {
        var result = await deepSeek.ValidateIngredientsAsync(request.Ingredient);
        return Results.Ok(result);
        
    } catch(Exception ex)
    {
        Console.WriteLine("❌ Error validating ingredient: " + ex.Message);
        return Results.StatusCode(500);
    }
    
});

// Seed MealDB Recipes
app.MapPost("/seed-mealdb", async (RecipeSeeder seeder) =>
{
    await seeder.SeedMealDbAsync();
    return Results.Ok("Seeding process completed.");
    
});

// Seed CocktailDB Recipes
app.MapPost("/seed-cocktaildb", async (CocktailSeeder seeder) =>
{
    try
    {
        Console.WriteLine("Starting cocktail seeding...");
        await seeder.SeedCocktailDbAsync();
        return Results.Ok("Cocktail seeding completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"ERROR: {ex.Message}");
        Console.WriteLine($"INNER: {ex.InnerException?.Message}");
        Console.WriteLine($"STACK: {ex.StackTrace}");
        return Results.Problem($"Error: {ex.Message}");
    }
});

//Exact Search Recipes by Ingredients
app.MapGet("/recipes-by-ingredients", async (MealForgerContext db, string ingredients) =>
{
    if (string.IsNullOrWhiteSpace(ingredients))
        return Results.BadRequest("Ingredients parameter is required.");

    var ingredientList = ingredients.Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(i => i.Trim().ToLower())
        .ToList();

    if (!ingredientList.Any())
        return Results.BadRequest("No valid ingredients provided.");

    // Find recipes that contain ALL the specified ingredient names (EXACT match)
    var recipes = await db.Recipes
        .Where(r => ingredientList.All(searchIngredient => 
            r.RecipeIngredients.Any(ri => 
                ri.Ingredient.Name.ToLower() == searchIngredient)))
        .Select(r => new
        {
            idMeal = r.ExternalId,
            strMeal = r.Title,
            strMealThumb = r.ImageUrl,
            strCategory = r.Category,
            slug = r.Title.ToLower()
                .Replace(" ", "-")
                .Replace("'", "")
        })
        .ToListAsync();

    return Results.Ok(new { meals = recipes });
});


// General Recipe Search
app.MapGet("/search-recipes", async (MealForgerContext db, string query) =>
{
    if (string.IsNullOrWhiteSpace(query))
    {
        return Results.BadRequest("Query parameter is required.");
    }

    var recipes = await db.Recipes
        .Where(r => EF.Functions.ILike(r.Title, $"%{query}%") ||
                    EF.Functions.ILike(r.Instructions, $"%{query}%") ||
                    r.RecipeIngredients.Any(ri => EF.Functions.ILike(ri.Ingredient.Name, $"%{query}%")))
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .ToListAsync();

    return Results.Ok(recipes);
});



// Cocktail Only Search
app.MapGet("/search-cocktails", async (MealForgerContext db, string query) =>
{
    if (string.IsNullOrWhiteSpace(query))
    {
        return Results.BadRequest("Query parameter is required.");
    }
    var cocktails = await db.CockTails
        .Where(c => EF.Functions.ILike(c.Name, $"%{query}%") ||
                    c.DrinkRecipeIngredients.Any(dri => EF.Functions.ILike(dri.DrinkIngredient.Name, $"%{query}%")))
        .Include(c => c.DrinkRecipeIngredients)
        .ThenInclude(dri => dri.DrinkIngredient)
        .ToListAsync();
    return Results.Ok(cocktails);
});

// Both Recipes and Cocktails Search
app.MapGet("/search-all", async (MealForgerContext db, string query) =>
{
    if (string.IsNullOrWhiteSpace(query))
    {
        return Results.BadRequest("Query parameter is required.");
    }
    if (query.Length < 2)
    {
        return Results.BadRequest("Query parameter must be at least 2 characters long.");
    }
    
    
    var recipes = await db.Recipes
        .Where(r => EF.Functions.ILike(r.Title, $"%{query}%") ||
                    EF.Functions.ILike(r.Instructions, $"%{query}%") ||
                    r.RecipeIngredients.Any(ri => EF.Functions.ILike(ri.Ingredient.Name, $"%{query}%")))
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .ToListAsync();

    var cocktails = await db.CockTails
        .Where(c => EF.Functions.ILike(c.Name, $"%{query}%") ||
                    c.DrinkRecipeIngredients.Any(dri => EF.Functions.ILike(dri.DrinkIngredient.Name, $"%{query}%")))
        .Include(c => c.DrinkRecipeIngredients)
        .ThenInclude(dri => dri.DrinkIngredient)
        .ToListAsync();

    return Results.Ok(new { Recipes = recipes, Cocktails = cocktails });
});

// Get Recipe Details by External ID
app.MapGet("/recipe/{id}", async (MealForgerContext db, string id) =>
{
    var recipe = await db.Recipes
        .Where(r => r.ExternalId == id)
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .FirstOrDefaultAsync();

    if (recipe == null)
        return Results.NotFound();

    // Create the ingredient/measure pairs like TheMealDB API
    var ingredients = recipe.RecipeIngredients.ToList();

    var response = new Dictionary<string, object?>
    {
        ["idMeal"] = recipe.ExternalId,
        ["strMeal"] = recipe.Title,
        ["strMealAlternate"] = null,
        ["strCategory"] = recipe.Category,
        ["strArea"] = recipe.Area,
        ["strInstructions"] = recipe.Instructions,
        ["strMealThumb"] = recipe.ImageUrl,
        ["strTags"] = null,
        ["strYoutube"] = null,
        ["strSource"] = null,
        ["strImageSource"] = null,
        ["strCreativeCommonsConfirmed"] = null,
        ["dateModified"] = null
    };

    for (int i = 0; i < 20; i++)
    {
        response[$"strIngredient{i + 1}"] = i < ingredients.Count ? ingredients[i].Ingredient.Name : "";
        response[$"strMeasure{i + 1}"] = i < ingredients.Count ? ingredients[i].Quantity : "";
    }
    
    return Results.Ok(new { meals = new[] { response } });
});

// Get Cocktail Details by External ID
app.Map("/cocktail/{id}", async (MealForgerContext db, string id) =>
{
    var cocktail = await db.CockTails
        .Where(c => c.Id == id)
        .Include(c => c.DrinkRecipeIngredients)
        .ThenInclude(dri => dri.DrinkIngredient)
        .FirstOrDefaultAsync();
    
    if (cocktail == null)
        return Results.NotFound();
    
    var ingredients = cocktail.DrinkRecipeIngredients.ToList();
    
    var response = new Dictionary<string, object?>
    {
        ["idDrink"] = cocktail.Id,
        ["strDrink"] = cocktail.Name,
        ["strDrinkAlternate"] = null,
        ["strCategory"] = cocktail.Category,
        ["strAlcoholic"] = cocktail.Alcoholic,
        ["strGlass"] = cocktail.Glass,
        ["strInstructions"] = cocktail.Instructions,
        ["strDrinkThumb"] = cocktail.Thumbnail,
        ["strTags"] = null,
        ["strVideo"] = null,
        ["strIBA"] = null,
        ["strCreativeCommonsConfirmed"] = null,
        ["dateModified"] = null
    };
    
    for (int i = 0; i < 15; i++)
    {
        response[$"strIngredient{i + 1}"] = i < ingredients.Count ? ingredients[i].DrinkIngredient.Name : "";
        response[$"strMeasure{i + 1}"] = i < ingredients.Count ? ingredients[i].Measure : "";
    }
    
    return Results.Ok(new { drinks = new[] { response } });
});


app.MapControllers();
app.Run();


