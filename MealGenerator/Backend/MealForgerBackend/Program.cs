using Microsoft.EntityFrameworkCore;
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
        await seeder.SeedCocktailDbAsync();
        return Results.Ok("Cocktail seeding completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error seeding cocktails: {ex.Message}");
        return Results.StatusCode(500);
    }
});

app.MapControllers();
app.Run();


