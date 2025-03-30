using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace MealForger.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UberWebhookController : ControllerBase
    {
        [HttpPost("ubereats")]
        public async Task<IActionResult> UberEatsWebhook([FromBody] UberEatsEvent request)
        {
            var storeId = request.User;

            if (storeId != null)
            {
                await ProcessOrder(storeId, request);
            }

            return Ok(new { message = "Webhook processed successfully!" });
        }
        
        private Task ProcessOrder(string storeId, UberEatsEvent request)
        {
            // Implement order processing logic here
            return Task.CompletedTask;
        }

        public class UberEatsEvent
        {
            public string User { get; set; }
            public string EventType { get; set; }
            
            public string OrderId { get; set; }
        }
    }
}