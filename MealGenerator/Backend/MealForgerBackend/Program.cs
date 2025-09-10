using MealForgerBackend.Models;
using MealForgerBackend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient<DeepSeekService>();
builder.Services.AddScoped<DeepSeekService>();

var app = builder.Build();


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

app.Run();

