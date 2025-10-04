using System.Collections.Generic;

namespace MealForgerBackend.Models{

public class Recipes
{
    public int Id { get; set; }
    public string ExternalId { get; set; }
    public string Source { get; set; }  // mealdb / cocktaildb
    public string Title { get; set; }
    public string Category { get; set; }
    public string Area { get; set; }
    public string Instructions { get; set; }
    public string ImageUrl { get; set; }
    public bool IsDrink { get; set; }
    
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
    
    
    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();
}

}