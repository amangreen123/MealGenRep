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
    
    public bool IsVegan { get; set; }
    public bool IsVegetarian { get; set; }
    public bool IsGlutenFree { get; set; }
    public bool IsKeto { get; set; }
    public bool IsPaleo { get; set; }
    
    
    public int? Calories { get; set; }
    public float? Protein { get; set; }
    public float? Carbohydrates { get; set; }
    public float? Fat { get; set; }
    public float? Fiber { get; set; }
    public float? Sugar { get; set; }
    public float? Sodium { get; set; }
    public DateTime? NutritionCalculatedAt { get; set; }
    
    public ICollection<DrinkRecipeIngredient> DrinkRecipeIngredients { get; set; } = new List<DrinkRecipeIngredient>();
}