namespace MealForgerBackend.Models
{
    public class NutritionRequest
    {
        public List<IngredientWithMeasure> Ingredients { get; set; } = new();
        public int Servings { get; set; } = 1;

    }
}

