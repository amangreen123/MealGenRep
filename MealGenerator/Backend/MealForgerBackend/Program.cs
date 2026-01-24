using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;
using MealForgerBackend.Models;
using MealForgerBackend.Services;
using MealForgerBackend.Data;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.SignalR.Protocol;
using Microsoft.Extensions.Caching.Memory;



var builder = WebApplication.CreateBuilder(args);


// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();
builder.Services.AddAntiforgery();

//DB Context
builder.Services.AddDbContext<MealForgerContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("MealForgerRecipes")));

builder.Services.AddMemoryCache();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5174", "https://mealforger.org", "http://localhost:5173",
                "https://www.mealforger.org")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
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
app.UseAuthorization();

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
app.MapPost("/seed/mealdb", async (RecipeSeeder seeder) =>
{
    await seeder.SeedMealDbAsync();
    return Results.Ok("✅ MealDB seeding complete!");
});

// Seed CocktailDB Recipes
app.MapPost("/seed/cocktaildb", async (CocktailSeeder seeder) =>
{
    await seeder.SeedCocktailsAsync();
    return Results.Ok("✅ CocktailDB seeding complete!");
});



app.MapGet("/general-recipes-search", async (MealForgerContext db, string ingredients, string diet = "", int maxResults = 50) => 
{
    if(string.IsNullOrWhiteSpace(ingredients))
    {
        return Results.BadRequest("Ingredients parameter is required.");
    }
    
    var ingredientList = ingredients.Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(i => i.Trim().ToLower())
        .ToList();
    
    if(!ingredientList.Any())
    {
        return Results.BadRequest("At least one ingredient is required.");
    }
    
    var baseQuery = db.Recipes
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .AsQueryable();

    if (!string.IsNullOrEmpty(diet))
    {
       var normalizedDiet = diet.ToLower().Replace("-", "").Replace(" ", "");
       
       if(normalizedDiet == "vegan")
           baseQuery = baseQuery.Where(r => r.IsVegan);
       else if(normalizedDiet == "vegetarian")
           baseQuery = baseQuery.Where(r => r.IsVegetarian);
       else if(normalizedDiet == "keto")
           baseQuery = baseQuery.Where(r => r.IsKeto);
       else if(normalizedDiet == "glutenfree")
           baseQuery = baseQuery.Where(r => r.IsGlutenFree);
       else if(normalizedDiet == "paleo")
           baseQuery = baseQuery.Where(r => r.IsPaleo);
    }
    
    // Get all recipes from cache or database
    var allRecipes = await baseQuery.ToListAsync();
    
    var scoredRecipes = allRecipes!.Select(r => new
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
    
    return Results.Ok(new { meals = scoredRecipes  });
});

app.MapGet("/enhanced-search", async (MealForgerContext db,
    IMemoryCache cache,
    string ingredients,
    string? diet = null,
    string? searchMode = "general",
    string? type = "all",
    int maxResults = 50) =>
{
    if(string.IsNullOrWhiteSpace(ingredients))
    {
        return Results.BadRequest("Ingredients parameter is required.");
    }
    
    var ingredientList = ingredients.Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(i => i.Trim().ToLower())
        .ToList();
    
    if(!ingredientList.Any())
        return Results.BadRequest("At least one ingredient is required.");
    
    var cacheKey = $"enhanced_search_{string.Join("_", ingredientList.OrderBy(i => i))}_{diet}_{searchMode}_{type}_{maxResults}";
    
    if(cache.TryGetValue(cacheKey, out object? cachedResult))
    {
        Console.WriteLine($"✅ Cache HIT for enhanced search: {cacheKey}");
        return Results.Ok(cachedResult);
    }
    
    Console.WriteLine($"🔄 Cache MISS for enhanced search: {cacheKey}");
    
    var meals = new List<object>();
    var drinks = new List<object>();

    if (type == "all" || type == "meal")
    {
        var allRecipes = await cache.GetOrCreateAsync("all_recipes_cache", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
            entry.SetPriority(CacheItemPriority.High);
            
            Console.WriteLine("📚 Loading all recipes from database...");
            return await db.Recipes
                .Include(r => r.RecipeIngredients)
                .ThenInclude(ri => ri.Ingredient)
                .AsNoTracking()
                .ToListAsync();
        });
        
        var scoredRecipes = allRecipes!
            .Select(r => new
            {
                Recipe = r,
                MatchCount = ingredientList.Count(userIng =>
                    r.RecipeIngredients.Any(ri => ri.Ingredient.Name.ToLower().Contains(userIng))),
                TotalIngredients = r.RecipeIngredients.Count,
                MissingCount = r.RecipeIngredients.Count(ri =>
                    !ingredientList.Any(userIng => ri.Ingredient.Name.ToLower().Contains(userIng)))
            })
             .Where(x => x.MatchCount > 0)
            // ✅ NEW: Apply search mode filter
            .Where(x => searchMode == "exact" ? x.MissingCount == 0 : true)
            // ✅ FIXED: Apply diet filter properly
            .Where(x => string.IsNullOrEmpty(diet) || diet.ToLower() switch
            {
                "vegan" => x.Recipe.IsVegan,
                "vegetarian" => x.Recipe.IsVegetarian,
                "keto" => x.Recipe.IsKeto,
                "ketogenic" => x.Recipe.IsKeto,
                "gluten-free" => x.Recipe.IsGlutenFree,
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
                matchPercentage = Math.Round((double)x.MatchCount / x.TotalIngredients * 100, 1),
                userMatchPercentage = Math.Round((double)x.MatchCount / ingredientList.Count * 100, 1),
                canCook = x.MissingCount == 0,
                score = (x.MatchCount * 10) + (x.MissingCount == 0 ? 50 : 0) - (x.MissingCount * 3),
                matchLevel = x.MissingCount == 0 ? "perfect" :
                            x.MatchCount >= (x.TotalIngredients * 0.75) ? "good" :
                            x.MatchCount >= (x.TotalIngredients * 0.5) ? "okay" : "low",
                isVegan = x.Recipe.IsVegan,
                isVegetarian = x.Recipe.IsVegetarian,
                isKeto = x.Recipe.IsKeto,
                isGlutenFree = x.Recipe.IsGlutenFree,
                isPaleo = x.Recipe.IsPaleo,
                slug = x.Recipe.Title.ToLower().Replace(" ", "-").Replace("'", ""),
                // ✅ NEW: Missing ingredients list
                missingIngredientsList = x.Recipe.RecipeIngredients
                    .Where(ri => !ingredientList.Any(userIng => ri.Ingredient.Name.ToLower().Contains(userIng)))
                    .Select(ri => ri.Ingredient.Name)
                    .Take(5)
                    .ToList()
            })
            .OrderByDescending(x => x.score)
            .ThenByDescending(x => x.matchPercentage)
            .Take(maxResults)
            .ToList();

        meals = scoredRecipes.Cast<object>().ToList();
    }

    if (type == "all" || type == "drink")
    {
        var allCocktails = await cache.GetOrCreateAsync("all_cocktails_cache", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
            entry.SetPriority(CacheItemPriority.High);

            Console.WriteLine("🍹 Loading all cocktails from database...");
            return await db.CockTails
                .Include(c => c.DrinkRecipeIngredients)
                .ThenInclude(dri => dri.DrinkIngredient)
                .AsNoTracking()
                .ToListAsync();
        });

        var scoredCocktails = allCocktails!
            .Select(c => new
            {
                Cocktail = c,
                MatchCount = ingredientList.Count(userIng =>
                    c.DrinkRecipeIngredients.Any(dri => dri.DrinkIngredient.Name.ToLower().Contains(userIng))),
                TotalIngredients = c.DrinkRecipeIngredients.Count,
                MissingCount = c.DrinkRecipeIngredients.Count(dri =>
                    !ingredientList.Any(userIng => dri.DrinkIngredient.Name.ToLower().Contains(userIng)))
            })
            .Where(x => x.MatchCount > 0)
            // ✅ NEW: Apply search mode filter
            .Where(x => searchMode == "exact" ? x.MissingCount == 0 : true)
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
                matchPercentage = Math.Round((double)x.MatchCount / x.TotalIngredients * 100, 1),
                userMatchPercentage = Math.Round((double)x.MatchCount / ingredientList.Count * 100, 1),
                canMake = x.MissingCount == 0,
                score = (x.MatchCount * 10) + (x.MissingCount == 0 ? 50 : 0) - (x.MissingCount * 3),
                matchLevel = x.MissingCount == 0 ? "perfect" :
                    x.MatchCount >= (x.TotalIngredients * 0.75) ? "good" :
                    x.MatchCount >= (x.TotalIngredients * 0.5) ? "okay" : "low",
                slug = x.Cocktail.Name.ToLower().Replace(" ", "-").Replace("'", ""),
                // ✅ NEW: Missing ingredients list
                missingIngredientsList = x.Cocktail.DrinkRecipeIngredients
                    .Where(dri => !ingredientList.Any(userIng => dri.DrinkIngredient.Name.ToLower().Contains(userIng)))
                    .Select(dri => dri.DrinkIngredient.Name)
                    .Take(5)
                    .ToList()
            })
            .OrderByDescending(x => x.score)
            .ThenByDescending(x => x.matchPercentage)
            .Take(maxResults)
            .ToList();

        drinks = scoredCocktails.Cast<object>().ToList();
    }
    
    var result = new
    {
        searchMode = searchMode,
        dietFilter = diet,
        totalResults = meals.Count + drinks.Count,
        perfectMatches = meals.Count(m => 
        {
            var dict = m as dynamic;
            return dict != null && dict.canCook == true;
        }) + drinks.Count(d =>
        {
            var dict = d as dynamic;
            return dict != null && dict.canMake == true;
        }),
        meals = meals,
        drinks = drinks
    };

    cache.Set(cacheKey, result, new MemoryCacheEntryOptions
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
        SlidingExpiration = TimeSpan.FromMinutes(5)
    });

    return Results.Ok(result);
    
});


    

// Cocktail Search By Ingredients (with caching)
app.MapGet("/general-cocktails-search", async (
    MealForgerContext db,
    IMemoryCache cache,
    string ingredients, 
    int maxResults = 50) =>
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
        return Results.BadRequest("At least one ingredient is required.");
    }

    // Create cache key
    var cacheKey = $"cocktail_search_{string.Join("_", ingredientList.OrderBy(i => i))}_{maxResults}";
    
    // Try to get from cache
    if (cache.TryGetValue(cacheKey, out object? cachedResult))
    {
        Console.WriteLine($"✅ Cache HIT for: {cacheKey}");
        return Results.Ok(cachedResult);
    }
    
    Console.WriteLine($"🔄 Cache MISS for: {cacheKey}");
    
    // Get all cocktails from cache or database
    var allCocktails = await cache.GetOrCreateAsync("all_cocktails_cache", async entry =>
    {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
        entry.SetPriority(CacheItemPriority.High);
        
        Console.WriteLine("🍹 Loading all cocktails from database...");
        return await db.CockTails
            .Include(c => c.DrinkRecipeIngredients)
            .ThenInclude(dri => dri.DrinkIngredient)
            .AsNoTracking()
            .ToListAsync();
    });

    var scoredCocktails = allCocktails!.Select(c => new
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

    var result = new { drinks = scoredCocktails };
    
    // Cache the result for 10 minutes
    cache.Set(cacheKey, result, new MemoryCacheEntryOptions
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
        SlidingExpiration = TimeSpan.FromMinutes(5)
    });

    return Results.Ok(result);
});

// Both Recipes and Cocktails Search (with caching)
app.MapGet("/search-all", async (
    MealForgerContext db,
    IMemoryCache cache,
    string ingredients, 
    string diet = "", 
    int maxResults = 50) =>
{
    if (string.IsNullOrWhiteSpace(ingredients))
        return Results.BadRequest("Ingredients parameter is required.");

    var ingredientsList = ingredients.Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(i => i.Trim().ToLower())
        .ToList();

    // Create cache key
    var cacheKey = $"search_all_{string.Join("_", ingredientsList.OrderBy(i => i))}_{diet}_{maxResults}";
    
    // Try to get from cache
    if (cache.TryGetValue(cacheKey, out object? cachedResult))
    {
        Console.WriteLine($"✅ Cache HIT for search-all: {cacheKey}");
        return Results.Ok(cachedResult);
    }
    
    Console.WriteLine($"🔄 Cache MISS for search-all: {cacheKey}");

    // Get all recipes from cache or database
    var allRecipes = await cache.GetOrCreateAsync("all_recipes_cache", async entry =>
    {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
        entry.SetPriority(CacheItemPriority.High);
        
        Console.WriteLine("📚 Loading all recipes from database...");
        return await db.Recipes
            .Include(r => r.RecipeIngredients)
            .ThenInclude(ri => ri.Ingredient)
            .AsNoTracking()
            .ToListAsync();
    });

    var scoredRecipes = allRecipes!
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
        .Take(maxResults / 2)
        .ToList();

    // Get all cocktails from cache or database
    var allCocktails = await cache.GetOrCreateAsync("all_cocktails_cache", async entry =>
    {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
        entry.SetPriority(CacheItemPriority.High);
        
        Console.WriteLine("🍹 Loading all cocktails from database...");
        return await db.CockTails
            .Include(c => c.DrinkRecipeIngredients)
            .ThenInclude(dri => dri.DrinkIngredient)
            .AsNoTracking()
            .ToListAsync();
    });

    var scoredCocktails = allCocktails!
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

    var result = new
    {
        meals = scoredRecipes,
        drinks = scoredCocktails,
        totalResults = scoredRecipes.Count + scoredCocktails.Count
    };
    
    // Cache the result for 10 minutes
    cache.Set(cacheKey, result, new MemoryCacheEntryOptions
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
        SlidingExpiration = TimeSpan.FromMinutes(5)
    });

    return Results.Ok(result);
});

// Get Recipe Details by External ID (with caching)
// Replace your existing /recipe/{id} endpoint with this:

app.MapGet("/recipe/{id}", async (
    MealForgerContext db, 
    NutritionService nutritionService,
    IMemoryCache cache,
    string id, 
    int? servings) =>
{
    var cacheKey = $"recipe_details_{id}_{servings ?? 4}";
    
    // Try to get from cache
    if (cache.TryGetValue(cacheKey, out object? cachedResult))
    {
        Console.WriteLine($"✅ Cache HIT for recipe: {id}");
        return Results.Ok(cachedResult);
    }
    
    Console.WriteLine($"🔄 Cache MISS for recipe: {id}");
    
    var recipe = await db.Recipes
        .Where(r => r.ExternalId == id)
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .AsNoTracking()
        .FirstOrDefaultAsync();

    if (recipe == null)
        return Results.NotFound();
    
    var ingredients = recipe.RecipeIngredients.ToList();
    int actualServings = servings ?? 4;

    // Check if nutrition data is already cached in database
    NutritionData nutrition;
    
    if (recipe.Calories.HasValue && recipe.Protein.HasValue && recipe.Calories > 0)
    {
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
        Console.WriteLine($"   Calories: {nutrition.Calories}, Protein: {nutrition.Protein}g, Carbs: {nutrition.Carbohydrates}g, Fat: {nutrition.Fat}g");
    }
    else
    {
        var ingredientsList = recipe.RecipeIngredients
            .Select(ri => new IngredientWithMeasure
            {
                Name = ri.Ingredient.Name,
                Measure = ri.Quantity
            })
            .ToList();

        Console.WriteLine($"🔄 Calculating fresh nutrition for: {recipe.Title}");
        Console.WriteLine($"📝 Ingredients: {string.Join(", ", ingredientsList.Select(i => $"{i.Measure} {i.Name}"))}");

        try
        {
            // This will use USDA first, then DeepSeek fallback for missing ingredients
            nutrition = await nutritionService.CalculateNutritionAsync(ingredientsList, servings: actualServings);
            
            Console.WriteLine($"✅ Calculated nutrition: Calories={nutrition.Calories}, Protein={nutrition.Protein}g");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Nutrition calculation failed: {ex.Message}");
            Console.WriteLine($"   Stack: {ex.StackTrace}");
            nutrition = new NutritionData();
        }

        // Save to database if we got valid data
        if ((nutrition.Calories ?? 0) > 0 || (nutrition.Protein ?? 0) > 0)
        {
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
                Console.WriteLine($"💾 Nutrition cached to database for: {recipe.Title}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to cache nutrition: {ex.Message}");
            }
        }
        else
        {
            Console.WriteLine($"⚠️ No nutrition data to save (all zeros)");
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
            total = new
            {
                calories = nutrition.Calories ?? 0,
                protein = nutrition.Protein ?? 0,
                carbs = nutrition.Carbohydrates ?? 0,
                fat = nutrition.Fat ?? 0,
                fiber = nutrition.Fiber ?? 0,
                sugar = nutrition.Sugar ?? 0,
                sodium = nutrition.Sodium ?? 0
            },
            perServing = new
            {
                calories = Math.Round((double)((nutrition.Calories ?? 0) / actualServings), 0),
                protein = Math.Round((double)((nutrition.Protein ?? 0) / actualServings), 1),
                carbs = Math.Round((double)((nutrition.Carbohydrates ?? 0) / actualServings), 1),
                fat = Math.Round((double)((nutrition.Fat ?? 0) / actualServings), 1),
                fiber = Math.Round((double)((nutrition.Fiber ?? 0) / actualServings), 1),
                sugar = Math.Round((double)((nutrition.Sugar ?? 0) / actualServings), 1),
                sodium = Math.Round((double)((nutrition.Sodium ?? 0) / actualServings), 1)
            },
            servings = actualServings,
            lastCalculated = recipe.NutritionCalculatedAt.HasValue 
                ? recipe.NutritionCalculatedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") 
                : null
        }
    };
    
    for (int i = 0; i < ingredients.Count; i++)
    {
        response[$"strIngredient{i + 1}"] = ingredients[i].Ingredient.Name;
        response[$"strMeasure{i + 1}"] = ingredients[i].Quantity;
    }
    
    var result = new { meals = new[] { response } };
    
    // Cache for 30 minutes (recipes don't change often)
    cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
    
    return Results.Ok(result);
});

// Get Cocktail Details by External ID (with caching)
// Replace your existing /cocktail/{id} endpoint with this:

app.MapGet("/cocktail/{id}", async (
    MealForgerContext db, 
    DeepSeekService deepSeek,
    IMemoryCache cache,
    string id, 
    int? servings) =>
{
    int actualServings = servings ?? 1;
    
    var cocktail = await db.CockTails
        .Where(c => c.Id == id)
        .Include(c => c.DrinkRecipeIngredients)
        .ThenInclude(dri => dri.DrinkIngredient)
        .AsNoTracking()
        .FirstOrDefaultAsync();
    
    if (cocktail == null)
        return Results.NotFound();
    
    var ingredients = cocktail.DrinkRecipeIngredients.ToList();
    
    NutritionData nutrition;

    if(cocktail.Calories.HasValue && cocktail.Protein.HasValue)
    {
        nutrition = new NutritionData
        {
            Calories = cocktail.Calories ?? 0, 
            Protein = cocktail.Protein ?? 0,
            Carbohydrates = cocktail.Carbohydrates ?? 0,
            Fat = cocktail.Fat ?? 0,
            Fiber = cocktail.Fiber ?? 0,
            Sugar = cocktail.Sugar ?? 0,
            Sodium = cocktail.Sodium ?? 0,
            Alcohol = cocktail.Alcohol ?? 0
        };
        
        Console.WriteLine($"✅ Using cached nutrition for: {cocktail.Name}");
    }
    else
    {
        var ingredientsList = cocktail.DrinkRecipeIngredients
            .Select(dri => new IngredientWithMeasure
            {
                Name = dri.DrinkIngredient.Name,
                Measure = dri.Measure
            })
            .ToList();

        Console.WriteLine($"🔄 Calculating fresh nutrition for: {cocktail.Name}");

        try
        {
            nutrition = await deepSeek.CalculateNutritionAsync(ingredientsList, servings: actualServings);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Nutrition calculation failed: {ex.Message}");
            nutrition = new NutritionData();
        }

        if (nutrition.Calories > 0 || nutrition.Protein > 0)
        {
            cocktail.Calories = nutrition.Calories;
            cocktail.Protein = nutrition.Protein;
            cocktail.Carbohydrates = nutrition.Carbohydrates;
            cocktail.Fat = nutrition.Fat;
            cocktail.Fiber = nutrition.Fiber;
            cocktail.Sugar = nutrition.Sugar;
            cocktail.Sodium = nutrition.Sodium;
            cocktail.Alcohol = nutrition.Alcohol;
            cocktail.NutritionCalculatedAt = DateTime.UtcNow;
            
            try
            {
                await db.SaveChangesAsync();
                Console.WriteLine($"💾 Nutrition cached for: {cocktail.Name}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to cache nutrition: {ex.Message}");
            }
        }
    }

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
                sodium = Math.Round((double)((nutrition.Sodium ?? 0) / actualServings), 1),
                alcohol = Math.Round((double)((nutrition.Alcohol ?? 0) / actualServings), 1)
            },
            servings = actualServings,
            lastCalculated = cocktail.NutritionCalculatedAt.HasValue ? cocktail.NutritionCalculatedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") : null
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
    
}).DisableAntiforgery();


app.MapPost("/reclassify-diets", async (MealForgerContext db, DeepSeekService deepSeek) =>
{
    Console.WriteLine("🔄 Starting diet reclassification for all recipes...");

    var recipes = await db.Recipes
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .ToListAsync();

    Console.WriteLine($"📚 Found {recipes.Count} recipes to classify");

    int processed = 0;
    int failed = 0;

    foreach (var recipe in recipes)
    {
        try
        {
            var ingredientList = string.Join(", ", recipe.RecipeIngredients.Select(ri => ri.Ingredient.Name));
            
            if(string.IsNullOrWhiteSpace(ingredientList))
            {
                Console.WriteLine($"⚠️ Recipe '{recipe.Title}' has no ingredients, skipping.");
                continue;
            }
            
            Console.WriteLine($"🔍 Classifying '{recipe.Title}' with ingredients: {ingredientList}");
            
            var dietInfo = await deepSeek.ClassifyAllDietsAsync(ingredientList);
            
            recipe.IsVegan = dietInfo.IsVegan;
            recipe.IsVegetarian = dietInfo.IsVegetarian;
            recipe.IsKeto = dietInfo.IsKeto;
            recipe.IsGlutenFree = dietInfo.IsGlutenFree;
            recipe.IsPaleo = dietInfo.IsPaleo;
            
            
            Console.WriteLine($"✅ {recipe.Title}:");
            Console.WriteLine($"   V:{dietInfo.IsVegan} VG:{dietInfo.IsVegetarian} K:{dietInfo.IsKeto} GF:{dietInfo.IsGlutenFree} P:{dietInfo.IsPaleo}");
            
            processed++;
            
            if(processed % 10 == 0)
            {
                await db.SaveChangesAsync();
                Console.WriteLine($"💾 Saved progress after {processed}/{recipes.Count} recipes...");
            }

            await Task.Delay(500);
            
        } catch(Exception ex) {
            Console.WriteLine($"❌ Failed to classify '{recipe.Title}': {ex.Message}");
            failed++;
        }
        
        await db.SaveChangesAsync();
    
        Console.WriteLine($"✅ Reclassification complete!");
        Console.WriteLine($"   Processed: {processed}");
        Console.WriteLine($"   Failed: {failed}");
        Console.WriteLine($"   Total: {recipes.Count}");
        
    }
    
    // Return summary
    var summary = new
    {
        totalRecipes = recipes.Count,
        processed = processed,
        failed = failed,
        veganCount = recipes.Count(r => r.IsVegan),
        vegetarianCount = recipes.Count(r => r.IsVegetarian),
        ketoCount = recipes.Count(r => r.IsKeto),
        glutenFreeCount = recipes.Count(r => r.IsGlutenFree),
        paleoCount = recipes.Count(r => r.IsPaleo)
    };
    
    
    return Results.Ok(summary);
    
});

app.MapGet("/random-recipes", async (MealForgerContext db, int count = 12) =>
{
    var randomRecipes = await db.Recipes
        .Include(r => r.RecipeIngredients)
        .ThenInclude(ri => ri.Ingredient)
        .OrderBy(r => Guid.NewGuid()) // Random order
        .Take(count)
        .Select(r => new
        {
            idMeal = r.ExternalId,
            strMeal = r.Title,
            strMealThumb = r.ImageUrl,
            strCategory = r.Category,
            strArea = r.Area,
            slug = r.Title.ToLower().Replace(" ", "-").Replace("'", "")
        })
        .ToListAsync();
    
    return Results.Ok(new { meals = randomRecipes });
});

app.MapControllers();
app.Run();


