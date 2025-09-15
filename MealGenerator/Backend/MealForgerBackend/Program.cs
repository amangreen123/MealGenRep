using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using System.Collections.Generic;
using MealForgerBackend.Models;
using MealForgerBackend.Services;
using MealForgerBackend.Data;


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
app.MapGet("/recipes-by-ingredients", async (MealForgerContext db, string ingredients ) =>
{
    if (string.IsNullOrWhiteSpace(ingredients))
    {
        return Results.BadRequest("Ingredients parameter is required.");
    }

    var ingredientList = ingredients.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                    .Select(i => i.Trim().ToLower())
                                    .ToList();

    if (!ingredientList.Any())
    {
        return Results.BadRequest("No valid ingredients provided.");
    }

    // Fetch recipes that contain all specified ingredients
    var recipes = await db.Recipes
        .Where(r => r.RecipeIngredients
            .Select(ri => ri.Ingredient.Name.ToLower())
            .Intersect(ingredientList)
            .Count() == ingredientList.Count)
        .Include(r => r.RecipeIngredients)
            .ThenInclude(ri => ri.Ingredient)
        .ToListAsync();

    return Results.Ok(recipes);
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


app.MapControllers();
app.Run();


