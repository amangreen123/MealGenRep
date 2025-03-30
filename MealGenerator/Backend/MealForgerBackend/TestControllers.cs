namespace DefaultNamespace;

using Microsoft.AspNetCore.Mvc;
using System.Text.Json; 

[ApiController]
[Route("api/[controller]")]
public class WebhookController : ControllerBase
{
    [HttpPost]
    public IActionResult ReceiveWebhook([FromBody] JsonElement payload)
    {
        var eventType = payload.GetProperty("event_type").GetString();
        var data = payload.GetProperty("data");

        switch (eventType)
        {
            case "user_created":
                ProcessUserCreated(data);
                break;
            case "order_placed":
                ProcessOrderPlaced(data);
                break;
            default:
                return BadRequest("Unknown event type");
        }

        return Ok();
    }

    private void ProcessUserCreated(JsonElement data)
    {
        var userId = data.GetProperty("user_id").GetString();
        var email = data.GetProperty("email").GetString();
        Console.WriteLine($"New user created: {userId}, Email: {email}");
    }

    private void ProcessOrderPlaced(JsonElement data)
    {
        var orderId = data.GetProperty("order_id").GetString();
        var amount = data.GetProperty("amount").GetDecimal();
        Console.WriteLine($"New order placed: {orderId}, Amount: {amount}");
    }
}