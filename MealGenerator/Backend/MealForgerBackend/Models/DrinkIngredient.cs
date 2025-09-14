namespace MealForgerBackend.Models;

public class DrinkIngredient
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    
    public ICollection<DrinkRecipeIngredient> DrinkRecipeIngredients { get; set; } = new List<DrinkRecipeIngredient>();
}