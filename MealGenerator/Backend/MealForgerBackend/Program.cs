using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Build the app
var app = builder.Build();

// Use routing and authorization middleware.
app.UseRouting(); // Ensures the app can route HTTP requests
app.UseHttpsRedirection();
app.UseAuthorization(); // Ensure authorization middleware is included if you're using any protected routes

// Add the endpoints for controllers to be mapped correctly
app.MapControllers();

// Run the app
app.Run();