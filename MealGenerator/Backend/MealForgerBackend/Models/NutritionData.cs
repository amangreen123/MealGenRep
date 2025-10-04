using System.Text.Json.Serialization;

namespace MealForgerBackend.Models
{
    
    // Nutrition data model to hold aggregated nutritional information
    // Help Strcutures the json response
    public class NutritionData
    {
        public int? Calories { get; set; }
        public float? Protein { get; set; }
        
        [JsonPropertyName("carbs")]
        public float? Carbohydrates { get; set; }
        public float? Fat { get; set; }
        public float? Fiber { get; set; }
        public float? Sugar { get; set; }
        public float? Sodium { get; set; }
        
    }
    
    public class IngredientWithMeasure
    {
        public string Name { get; set; } = string.Empty;
        public string Measure { get; set; } = string.Empty;
    }
    
}

