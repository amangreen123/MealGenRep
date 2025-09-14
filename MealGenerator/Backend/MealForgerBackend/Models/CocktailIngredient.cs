namespace MealForgerBackend.Models;

public class CocktailIngredient
{
    public int CockrailId { get; set; }
    public CockTails Cocktail { get; set; }
    
    public int DrinkIngredientId { get; set; }
    public DrinkIngredient DrinkIngredient { get; set; }
    
    public string Quantity { get; set; }
    
    
}