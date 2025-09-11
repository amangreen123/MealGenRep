using Microsoft.AspNetCore.Mvc;
using MealForgerBackend.Data;
using Microsoft.EntityFrameworkCore;

namespace MealForgerBackend.Controllers
{
    [ApiController]
    [Route("api/test")]

    public class TestController : ControllerBase
    {
        private readonly MealForgerContext _db;
        public TestController(MealForgerContext db) => _db = db;

        [HttpGet("db")]
        public async Task<IActionResult> TestDb()
        {
            var recipeCount = await _db.Recipes.CountAsync();
            return Ok(new { db = "ok", recipeCount });
        }
    }
}

