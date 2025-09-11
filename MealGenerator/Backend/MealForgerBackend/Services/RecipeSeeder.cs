using MealForgerBackend.Data;
using MealForgerBackend.Models;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;


namespace MealForgerBackend.Services
{
    public class RecipeSeeder
    {
        private readonly MealForgerContext _db;
        private readonly HttpClient _http;
        
        public RecipeSeeder(MealForgerContext db, HttpClient http)
        {
            _db = db;
            _http = http;
        }

        public async Task SeedMealDbAsync()
        {
            var response = await _http.GetAsync("https://www.themealdb.com/api/json/v1/1/search.php?f=a");
            if (response.IsSuccessStatusCode)
        }

    }
    
}

