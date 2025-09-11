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

    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();
}

}