namespace MealForgerBackend.Models
{
    public class RecipeIngredient
    {
        public int RecipeId { get; set; }
        public int IngredientId { get; set; }
        public string Quantity { get; set; }
        public Recipes Recipe { get; set; }
        public Ingredient Ingredient { get; set; }

        
    }
}

