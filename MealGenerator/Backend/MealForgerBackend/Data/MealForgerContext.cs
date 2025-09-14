using Microsoft.EntityFrameworkCore;
using MealForgerBackend.Models;

namespace MealForgerBackend.Data
{
    public class MealForgerContext : DbContext
    {
        public MealForgerContext(DbContextOptions<MealForgerContext> options) : base(options) { }
        
        public DbSet<Recipes> Recipes { get; set; }
        public DbSet<Ingredient> Ingredients { get; set; }
        public DbSet<RecipeIngredient> RecipeIngredients { get; set; }
        
        public DbSet<CockTails> CockTails { get; set; }
        public DbSet<DrinkIngredient> DrinkIngredients { get; set; }
        public DbSet<DrinkRecipeIngredient> DrinkRecipeIngredients { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Ingredient>()
                .HasIndex(i => i.Name)
                .IsUnique();
            modelBuilder.Entity<RecipeIngredient>()
                .HasKey(ri => new { ri.RecipeId, ri.IngredientId });
            
            modelBuilder.Entity<RecipeIngredient>()
                .HasOne(ri => ri.Recipe)
                .WithMany(r => r.RecipeIngredients)
                .HasForeignKey(ri => ri.RecipeId);

            modelBuilder.Entity<RecipeIngredient>()
                .HasOne(ri => ri.Ingredient)
                .WithMany(i => i.RecipeIngredients)
                .HasForeignKey(ri => ri.IngredientId);
            
            // Drink entities configuration
            modelBuilder.Entity<DrinkIngredient>()
                .HasIndex(di => di.Name)
                .IsUnique();

            modelBuilder.Entity<DrinkRecipeIngredient>()
                .HasKey(dri => new { dri.CockTailId, dri.DrinkIngredientId });
            
            modelBuilder.Entity<DrinkRecipeIngredient>()
                .HasOne(dri => dri.CockTail)
                .WithMany(c => c.DrinkRecipeIngredients)
                .HasForeignKey(dri => dri.CockTailId);
            
            modelBuilder.Entity<DrinkRecipeIngredient>()
                .HasOne(dri => dri.DrinkIngredient)
                .WithMany(dri => dri.DrinkRecipeIngredients)
                .HasForeignKey(dri => dri.DrinkIngredientId);

        }
    }
}
