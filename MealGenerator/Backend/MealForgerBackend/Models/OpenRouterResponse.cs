namespace MealForgerBackend.Models
{
    //Model for Open Router Response
    public class OpenRouterResponse
    {
        public Choice[] choices { get; set; }

        public class Choice
        {
            public Message message { get; set; }
        }

        public class Message
        {
            public string role { get; set; }
            public string content { get; set; }
            
        }
    }
}

