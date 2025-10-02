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

//Search Recipes by Ingredients
app.MapGet("/general-recipes-search", async (MealForgerContext db, string ingredients, string diet = "", int maxResults = 50) =>
{
    if(string.IsNullOrWhiteSpace(ingredients))
    {
        return Results.BadRequest("Ingredients parameter is required.");
    }
    
    var ingredientList = ingredients.Split(',' , StringSplitOptions.RemoveEmptyEntries)
        .Select(i => i.Trim().ToLower())
        .ToList();
    
    if(!ingredients.Any())
    {
        return Results.BadRequest("At least one ingredient is required.");
    }
    
    var allRecipes = await db.Recipes
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .ToListAsync();
    
    var scoredRecipes = allRecipes.Select(r => new
        {
            Recipe = r,
            MatchCount = ingredientList.Count(userIng =>
                r.RecipeIngredients.Any(ri => ri.Ingredient.Name.ToLower().Contains(userIng))),
            TotalIngredients = r.RecipeIngredients.Count,
            MissingCount = r.RecipeIngredients.Count(ri =>
                !ingredientList.Any(userIng => ri.Ingredient.Name.ToLower().Contains(userIng)))
        })
        .Where(x => x.MatchCount > 0)
        .Where(x => string.IsNullOrEmpty(diet) || diet.ToLower().Replace("-", "").Replace(" ", "") switch
        {
            "vegan" => x.Recipe.IsVegan,
            "vegetarian" => x.Recipe.IsVegetarian,
            "keto" => x.Recipe.IsKeto,
            "glutenfree" => x.Recipe.IsGlutenFree,
            "paleo" => x.Recipe.IsPaleo,
            _ => true
        })
        .Select(x => new {
            idMeal = x.Recipe.ExternalId,
            strMeal = x.Recipe.Title,
            strMealThumb = x.Recipe.ImageUrl,
            strCategory = x.Recipe.Category,
            strArea = x.Recipe.Area,
            matchScore = x.MatchCount,
            totalIngredients = x.TotalIngredients,
            missingIngredients = x.MissingCount,
            matchPercentage = Math.Round((double)x.MatchCount / ingredientList.Count * 100, 1),
            canCook = x.MissingCount == 0,
            score = (x.MatchCount * 10) + (x.MissingCount == 0 ? 20 : 0) - (x.MissingCount * 2),
            isVegan = x.Recipe.IsVegan,
            isVegetarian = x.Recipe.IsVegetarian,
            isKetogenic = x.Recipe.IsKeto,
            isGlutenFree = x.Recipe.IsGlutenFree,
            isPaleo = x.Recipe.IsPaleo,
            slug = x.Recipe.Title.ToLower().Replace(" ", "-").Replace("'", "")
        })
        .OrderByDescending(x => x.score)
        .Take(maxResults)
        .ToList();

    return Results.Ok(new { meals = scoredRecipes });
});

//Cocktail Search By Ingredients
app.MapGet("/general-cocktails-search", async (MealForgerContext db, string ingredients, int maxResults = 50) =>
{
    if (string.IsNullOrWhiteSpace(ingredients))
    {
        return Results.BadRequest("Ingredients parameter is required.");
    }

    var ingredientList = ingredients.Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(i => i.Trim().ToLower())
        .ToList();

    if (!ingredients.Any())
    {
        return Results.BadRequest("At least one ingredient is required.");
    }

    var allCocktails = await db.CockTails
        .Include(c => c.DrinkRecipeIngredients)
        .ThenInclude(dri => dri.DrinkIngredient)
        .ToListAsync();

    var scoredCocktails = allCocktails.Select(c => new
        {
            Cocktail = c,
            MatchCount = ingredientList.Count(userIng =>
                c.DrinkRecipeIngredients.Any(dri => dri.DrinkIngredient.Name.ToLower().Contains(userIng))),
            TotalIngredients = c.DrinkRecipeIngredients.Count,
            MissingCount = c.DrinkRecipeIngredients.Count(dri =>
                !ingredientList.Any(userIng => dri.DrinkIngredient.Name.ToLower().Contains(userIng)))
        })
        .Where(x => x.MatchCount > 0)
        .Select(x => new
        {
            idDrink = x.Cocktail.Id,
            strDrink = x.Cocktail.Name,
            strDrinkThumb = x.Cocktail.Thumbnail,
            strCategory = x.Cocktail.Category,
            strAlcoholic = x.Cocktail.Alcoholic,
            strGlass = x.Cocktail.Glass,
            matchScore = x.MatchCount,
            totalIngredients = x.TotalIngredients,
            missingIngredients = x.MissingCount,
            matchPercentage = Math.Round((double)x.MatchCount / ingredientList.Count * 100, 1),
            canMake = x.MissingCount == 0,
            score = (x.MatchCount * 10) + (x.MissingCount == 0 ? 20 : 0) - (x.MissingCount * 2),
            slug = x.Cocktail.Name.ToLower().Replace(" ", "-").Replace("'", "")
        })
        .OrderByDescending(x => x.score)
        .Take(maxResults)
        .ToList();

    return Results.Ok(new { drinks = scoredCocktails });
});

// Both Recipes and Cocktails Search
app.MapGet("/search-all", async (MealForgerContext db, string ingredients, string diet = "", int maxResults = 50 ) =>
{
    if(string.IsNullOrWhiteSpace(ingredients))
    {
        return Results.BadRequest("Ingredients parameter is required.");
    }
    
    if(!ingredients.Any())
    {
        return Results.BadRequest("At least one ingredient is required.");
    }
    
    var ingredientsList = ingredients.Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(i => i.Trim().ToLower())
        .ToList();
    
    var allRecipes = await db.Recipes
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .ToListAsync();

    var scoredRecipes = allRecipes
        .Select(r => new
        {
            Recipe = r,
            MatchCount = ingredientsList.Count(userIng =>
                r.RecipeIngredients.Any(ri => ri.Ingredient.Name.ToLower().Contains(userIng))),
            TotalIngredients = r.RecipeIngredients.Count,
            MissingCount = r.RecipeIngredients.Count(ri =>
                !ingredientsList.Any(userIng => ri.Ingredient.Name.ToLower().Contains(userIng)))
        })
        .Where(x => x.MatchCount > 0)
        .Where(x => string.IsNullOrEmpty(diet) || diet.ToLower().Replace("-", "").Replace(" ", "") switch
        {
            "vegan" => x.Recipe.IsVegan,
            "vegetarian" => x.Recipe.IsVegetarian,
            "keto" => x.Recipe.IsKeto,
            "glutenfree" => x.Recipe.IsGlutenFree,
            "paleo" => x.Recipe.IsPaleo,
            _ => true
        })
        .Select(x => new
        {
            idMeal = x.Recipe.ExternalId,
            strMeal = x.Recipe.Title,
            strMealThumb = x.Recipe.ImageUrl,
            strCategory = x.Recipe.Category,
            strArea = x.Recipe.Area,
            matchScore = x.MatchCount,
            totalIngredients = x.TotalIngredients,
            missingIngredients = x.MissingCount,
            matchPercentage = Math.Round((double)x.MatchCount / ingredientsList.Count * 100, 1),
            canCook = x.MissingCount == 0,
            score = (x.MatchCount * 10) + (x.MissingCount == 0 ? 20 : 0) - (x.MissingCount * 2),
            isVegan = x.Recipe.IsVegan,
            isVegetarian = x.Recipe.IsVegetarian,
            isKetogenic = x.Recipe.IsKeto,
            isGlutenFree = x.Recipe.IsGlutenFree,
            isPaleo = x.Recipe.IsPaleo,
            slug = x.Recipe.Title.ToLower().Replace(" ", "-").Replace("'", "")
        })
        .OrderByDescending(x => x.score)
        .Take(maxResults)
        .ToList();
    return Results.Ok(new { meals = scoredRecipes });
});



// Get Recipe Details by External ID
app.MapGet("/recipe/{id}", async (MealForgerContext db, DeepSeekService deepSeek, string id) =>
{
    var recipe = await db.Recipes
        .Where(r => r.ExternalId == id)
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .FirstOrDefaultAsync();

    if (recipe == null)
        return Results.NotFound();

    // Create the ingredient/measure pairs like TheMealDB API
    var ingredients = recipe.RecipeIngredients
        .Select(ri => new IngredientWithMeasure
        {
            Name = ri.Ingredient.Name,
            Measure = ri.Quantity
        })
        .ToList();
    
    var nutrition = await deepSeek.CalculateNutritionAsync(ingredients);

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
        ,["nutrition"] = nutrition,
        ["ingredients"] = recipe.RecipeIngredients.Select(ri => new
        {
            name = ri.Ingredient.Name,
            measure = ri.Quantity
        }).ToList()
    };
    
    return Results.Ok(new { meals = new[] { response } });
});



// Get Cocktail Details by External ID
app.Map("/cocktail/{id}", async (MealForgerContext db, string id, DeepSeekService deepSeek) =>
{
    var cocktail = await db.CockTails
        .Where(c => c.Id == id)
        .Include(c => c.DrinkRecipeIngredients)
        .ThenInclude(dri => dri.DrinkIngredient)
        .FirstOrDefaultAsync();
    
    if (cocktail == null)
        return Results.NotFound();

    var ingredients = cocktail.DrinkRecipeIngredients
        .Select(dri => new IngredientWithMeasure
        {
            Name = dri.DrinkIngredient.Name,
            Measure = dri.Measure
        })
        .ToList();
    
    var nutrition = await deepSeek.CalculateNutritionAsync(ingredients);
    
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
        ["dateModified"] = null,
        ["nutrition"] = nutrition,
        ["ingredients"] = cocktail.DrinkRecipeIngredients.Select(dri => new
        {
            name = dri.DrinkIngredient.Name,
            measure = dri.Measure
        }).ToList()
    };
    
    return Results.Ok(new { drinks = new[] { response } });
});


app.MapControllers();
app.Run();


