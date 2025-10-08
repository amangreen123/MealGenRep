namespace MealForgerBackend.Models
{
    public class GeminiResponse
    {
    
        public List<GeminiCandidate> candidates { get; set; }
        
    }
    
    public class GeminiCandidate
    {
        public GeminiContent? content { get; set; }
    }
    
    public class GeminiContent
    {
        public List<GeminiPart>? parts { get; set; }

    }
    
    public class GeminiPart
    {
        public string? text { get; set; }
    }

    public class IngredientIdentificationResult
    {
        public bool Success { get; set; }
        public string? RawIngredient { get; set; }
        public string? ValidatedIngredient { get; set; }
        public string? ErrorMessage { get; set; }
    }
    
}

