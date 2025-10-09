using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;
using MealForgerBackend.Models;
using MealForgerBackend.Services;
using MealForgerBackend.Data;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.SignalR.Protocol;



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

// USDA Service
builder.Services.AddHttpClient<USDAService>();
builder.Services.AddScoped<USDAService>();

// Nutrition Service
builder.Services.AddScoped<NutritionService>();

// Gemini Service
builder.Services.AddHttpClient<GeminiService>();
builder.Services.AddScoped<GeminiService>();

var app = builder.Build();

app.UseRouting();
app.UseCors();
app.UseAntiforgery();

//DeepSeek Ingredient Validation Endpoint
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
app.MapGet("/search-all", async (MealForgerContext db, string ingredients, string diet = "", int maxResults = 50) =>
{
    if (string.IsNullOrWhiteSpace(ingredients))
        return Results.BadRequest("Ingredients parameter is required.");

    var ingredientsList = ingredients.Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(i => i.Trim().ToLower())
        .ToList();

    // Search Recipes
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
            type = "meal",
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
            slug = x.Recipe.Title.ToLower().Replace(" ", "-").Replace("'", "")
        })
        .OrderByDescending(x => x.score)
        .Take(maxResults / 2)  // Split results between recipes and cocktails
        .ToList();

    // Search Cocktails
    var allCocktails = await db.CockTails
        .Include(c => c.DrinkRecipeIngredients)
        .ThenInclude(dri => dri.DrinkIngredient)
        .ToListAsync();

    var scoredCocktails = allCocktails
        .Select(c => new
        {
            Cocktail = c,
            MatchCount = ingredientsList.Count(userIng =>
                c.DrinkRecipeIngredients.Any(dri => dri.DrinkIngredient.Name.ToLower().Contains(userIng))),
            TotalIngredients = c.DrinkRecipeIngredients.Count,
            MissingCount = c.DrinkRecipeIngredients.Count(dri =>
                !ingredientsList.Any(userIng => dri.DrinkIngredient.Name.ToLower().Contains(userIng)))
        })
        .Where(x => x.MatchCount > 0)
        .Select(x => new
        {
            type = "drink",
            idDrink = x.Cocktail.Id,
            strDrink = x.Cocktail.Name,
            strDrinkThumb = x.Cocktail.Thumbnail,
            strCategory = x.Cocktail.Category,
            strAlcoholic = x.Cocktail.Alcoholic,
            strGlass = x.Cocktail.Glass,
            matchScore = x.MatchCount,
            totalIngredients = x.TotalIngredients,
            missingIngredients = x.MissingCount,
            matchPercentage = Math.Round((double)x.MatchCount / ingredientsList.Count * 100, 1),
            canMake = x.MissingCount == 0,
            score = (x.MatchCount * 10) + (x.MissingCount == 0 ? 20 : 0) - (x.MissingCount * 2),
            slug = x.Cocktail.Name.ToLower().Replace(" ", "-").Replace("'", "")
        })
        .OrderByDescending(x => x.score)
        .Take(maxResults / 2)
        .ToList();

    return Results.Ok(new
    {
        meals = scoredRecipes,
        drinks = scoredCocktails,
        totalResults = scoredRecipes.Count + scoredCocktails.Count
    });
});



// Get Recipe Details by External ID
app.MapGet("/recipe/{id}", async (MealForgerContext db, NutritionService nutritionService, string id, int? servings) =>
{
    var recipe = await db.Recipes
        .Where(r => r.ExternalId == id)
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .FirstOrDefaultAsync();

    if (recipe == null)
        return Results.NotFound();
    
    var ingredients = recipe.RecipeIngredients.ToList();
    
    int actualServings = servings ?? 4;

    
    foreach (var ri in recipe.RecipeIngredients ?? Enumerable.Empty<RecipeIngredient>())
    {
        Console.WriteLine($"  - {ri.Ingredient?.Name ?? "NULL"}: {ri.Quantity}");
    }
    // Check if nutrition data is already cached in database
    NutritionData nutrition;
    
    if (recipe.Calories.HasValue && recipe.Protein.HasValue)
    {
        // Use cached data from database
        nutrition = new NutritionData
        {
            Calories = recipe.Calories ?? 0, 
            Protein = recipe.Protein ?? 0,
            Carbohydrates = recipe.Carbohydrates ?? 0,
            Fat = recipe.Fat ?? 0,
            Fiber = recipe.Fiber ?? 0,
            Sugar = recipe.Sugar ?? 0,
            Sodium = recipe.Sodium ?? 0
        };
        
        Console.WriteLine($"✅ Using cached nutrition for: {recipe.Title}");
    }
    else
    {
        // Calculate nutrition using hybrid USDA + AI approach
        var ingredientsList = recipe.RecipeIngredients
            .Select(ri => new IngredientWithMeasure
            {
                Name = ri.Ingredient.Name,
                Measure = ri.Quantity
            })
            .ToList();

        Console.WriteLine($"🔄 Calculating fresh nutrition for: {recipe.Title}");
        Console.WriteLine($"📊 Created {ingredientsList.Count} ingredients for API");


        try
        {
            nutrition = await nutritionService.CalculateNutritionAsync(ingredientsList, servings: actualServings);

        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Nutrition calculation failed: {ex.Message}");
            nutrition = new NutritionData();
        }

        if (nutrition.Calories > 0 || nutrition.Protein > 0)
        {
            // Cache the results in database
            recipe.Calories = nutrition.Calories;
            recipe.Protein = nutrition.Protein;
            recipe.Carbohydrates = nutrition.Carbohydrates;
            recipe.Fat = nutrition.Fat;
            recipe.Fiber = nutrition.Fiber;
            recipe.Sugar = nutrition.Sugar;
            recipe.Sodium = nutrition.Sodium;
            recipe.NutritionCalculatedAt = DateTime.UtcNow;
            
            try
            {
                await db.SaveChangesAsync();
                Console.WriteLine($"💾 Nutrition cached for: {recipe.Title}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️  Failed to cache nutrition: {ex.Message}");
                // Continue anyway - we still have the calculated data
            }
        }
    }

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
        ["dateModified"] = null,
        ["isVegan"] = recipe.IsVegan,
        ["isVegetarian"] = recipe.IsVegetarian,
        ["isKeto"] = recipe.IsKeto,
        ["isGlutenFree"] = recipe.IsGlutenFree,
        ["isPaleo"] = recipe.IsPaleo,
        
        ["nutrition"] = new
        {
            total = nutrition,
            perServing = new
            {
                calories = (nutrition.Calories ?? 0) / actualServings,
                protein = Math.Round((double)((nutrition.Protein ?? 0) / actualServings), 1),
                carbs = Math.Round((double)((nutrition.Carbohydrates ?? 0) / actualServings), 1),
                fat = Math.Round((double)((nutrition.Fat ?? 0) / actualServings), 1),
                fiber = Math.Round((double)((nutrition.Fiber ?? 0) / actualServings), 1),
                sugar = Math.Round((double)((nutrition.Sugar ?? 0) / actualServings), 1),
                sodium = Math.Round((double)((nutrition.Sodium ?? 0) / actualServings), 1)
            },
            servings = actualServings,
            lastCalculated = recipe.NutritionCalculatedAt.HasValue ? recipe.NutritionCalculatedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") : null
        }
    };
    
    // Add ingredients and measures dynamically
    for (int i = 0; i < ingredients.Count; i++)
    {
        response[$"strIngredient{i + 1}"] = i < ingredients.Count ? ingredients[i].Ingredient.Name : "";
        response[$"strMeasure{i + 1}"] = i < ingredients.Count ? ingredients[i].Quantity : "";
    }
    
    return Results.Ok(new { meals = new[] { response } });
});

// Get Cocktail Details by External ID
app.MapGet("/cocktail/{id}", async (MealForgerContext db, DeepSeekService deepSeek, string id, int? servings) =>
{
    // Use 1 as default for cocktails (typically single serving)
    int actualServings = servings ?? 1;
    
    var cocktail = await db.CockTails
        .Where(c => c.Id == id)
        .Include(c => c.DrinkRecipeIngredients)
        .ThenInclude(dri => dri.DrinkIngredient)
        .FirstOrDefaultAsync();
    
    if (cocktail == null)
        return Results.NotFound();
    
    var ingredients = cocktail.DrinkRecipeIngredients.ToList();

    var ingredientsList = cocktail.DrinkRecipeIngredients
        .Select(dri => new IngredientWithMeasure
        {
            Name = dri.DrinkIngredient.Name,
            Measure = dri.Measure
        })
        .ToList();
    
    // Calculate nutrition (DeepSeek handles the total)
    var nutrition = await deepSeek.CalculateNutritionAsync(ingredientsList, servings: actualServings);
    
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
        ["nutrition"] = new
        {
            total = nutrition,
            perServing = new
            {
                calories = (nutrition.Calories ?? 0) / actualServings,
                protein = Math.Round((double)((nutrition.Protein ?? 0) / actualServings), 1),
                carbs = Math.Round((double)((nutrition.Carbohydrates ?? 0) / actualServings), 1),
                fat = Math.Round((double)((nutrition.Fat ?? 0) / actualServings), 1),
                fiber = Math.Round((double)((nutrition.Fiber ?? 0) / actualServings), 1),
                sugar = Math.Round((double)((nutrition.Sugar ?? 0) / actualServings), 1),
                sodium = Math.Round((double)((nutrition.Sodium ?? 0) / actualServings), 1)
            },
            servings = actualServings
        }
    };
    
    for (int i = 0; i < ingredients.Count; i++)
    {
        response[$"strIngredient{i + 1}"] = ingredients[i].DrinkIngredient.Name;
        response[$"strMeasure{i + 1}"] = ingredients[i].Measure;
    }
    
    return Results.Ok(new { drinks = new[] { response } });
});

//Gemini AI Photo to text endpoint
app.MapPost("/identify-ingredient", async (GeminiService gemini, IFormFile image) =>
{
    try
    {
        using var memoryStream = new MemoryStream();
        await image.CopyToAsync(memoryStream);
        var base64Image = Convert.ToBase64String(memoryStream.ToArray());

        var result = await gemini.IdentifyIngredientFromImageAsync(base64Image);

        if (!result.Success)
        {
            return Results.BadRequest(new
            {
                success = false,
                message = result.ErrorMessage ?? "Failed to identify ingredient."
            });
        }

        return Results.Ok(new
        {
            success = true,
            ingredient = result.ValidatedIngredient,
            rawResult = result.RawIngredient
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine("❌ Error identifying ingredient: " + ex.Message);
        return Results.StatusCode(500);
    }
    
});


app.MapControllers();
app.Run();


