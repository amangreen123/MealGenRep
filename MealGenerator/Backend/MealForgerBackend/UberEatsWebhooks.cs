using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging; // Add this namespace
using System.Threading.Tasks;

namespace MealForger.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UberWebhookController : ControllerBase
    {
        private readonly ILogger<UberWebhookController> _logger; // Declare the logger

        // Inject ILogger into the constructor
        public UberWebhookController(ILogger<UberWebhookController> logger)
        {
            _logger = logger;
        }

        [HttpPost("ubereats")]
        public async Task<IActionResult> UberEatsWebhook([FromBody] UberEatsEvent request)
        {
            // Ensure request and its data are not null
            if (request?.Data == null)
            {
                return BadRequest("Invalid request data");
            }

            // Extract the user information from the request.
            var userId = request.Data.UserId;
            var email = request.Data.Email;

            if (!string.IsNullOrEmpty(userId))
            {
                // Process the request here (e.g., logging, saving data, etc.)
                await ProcessOrder(userId, email ?? string.Empty, request.EventType ?? string.Empty);
            }

            // Log the webhook call with useful context
            _logger.LogInformation("Webhook processed successfully for User ID:{userId}, EventType: {EventType}", userId, request.EventType);

            return Ok(new { message = "Webhook processed successfully!" });
        }
        
        
        private Task ProcessOrder(string userId, string email, string eventType)
        {
            // Implement order processing logic here (e.g., save to database or other logic)
            return Task.CompletedTask;
        }
        
        [HttpGet("test")]
        public IActionResult Test()
        {
            _logger.LogInformation("Test endpoint accessed");
            return Ok("Webhook server is running!");
        }

        // This class will be used to deserialize the incoming JSON body.
        public class UberEatsEvent
        {
            public string EventType { get; set; } = string.Empty;
            public EventData Data { get; set; } = new EventData();
        }

        public class EventData
        {
            public string UserId { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
        }
        
        
    }
    
  
}

