namespace MealForgerBackend.Models;

public class DrinkRecipeIngredient
{
    public string CockTailId { get; set; }
    public CockTails CockTail { get; set; } = null!;
    public int DrinkIngredientId { get; set; }
    public DrinkIngredient DrinkIngredient { get; set; } = null!;
    
    public string Measure { get; set; } = String.Empty;
}