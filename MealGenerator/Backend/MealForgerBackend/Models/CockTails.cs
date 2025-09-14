namespace MealForgerBackend.Models;

public class CockTails
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Alcoholic { get; set; } = null!;
    public string Glass { get; set; } = null!;
    public string Instructions { get; set; } = null!;
    public string Thumbnail { get; set; } = null!;
    
    public ICollection<DrinkRecipeIngredient> DrinkRecipeIngredients { get; set; } = new List<DrinkRecipeIngredient>();
}