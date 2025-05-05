"use client"

import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { slugify } from "./utils/slugify"

const RecipeNavigator = ({ allRecipes, currentRecipe }) => {
    const navigate = useNavigate()

    // Find the current recipe index
    const currentIndex = allRecipes.findIndex((recipe) => {
        if (recipe.id && currentRecipe.id) {
            return recipe.id === currentRecipe.id
        } else if (recipe.idMeal && currentRecipe.idMeal) {
            return recipe.idMeal === currentRecipe.idMeal
        } else if (recipe.idDrink && currentRecipe.idDrink) {
            return recipe.idDrink === currentRecipe.idDrink
        }
        return false
    })

    // Get previous and next indices with wrap-around
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : allRecipes.length - 1
    const nextIndex = currentIndex < allRecipes.length - 1 ? currentIndex + 1 : 0

    const navigateToRecipe = (recipe) => {
        if (!recipe) return

        // Get recipe name for slug
        const recipeName = recipe.strDrink || recipe.strMeal || recipe.title || recipe.name || "recipe"
        const slug = recipe.slug || slugify(recipeName)

        // Determine the recipe type and navigate accordingly
        if (recipe.idDrink) {
            navigate(`/drink/${slug}`, {
                state: {
                    drink: recipe,
                    userIngredients: window.history.state?.usr?.userIngredients || [],
                    allRecipes: allRecipes,
                    previousPath: window.history.state?.usr?.previousPath || "/",
                    recipeId: recipe.idDrink,
                },
            })
        } else if (recipe.idMeal) {
            navigate(`/mealdb-recipe/${slug}`, {
                state: {
                    meal: recipe,
                    userIngredients: window.history.state?.usr?.userIngredients || [],
                    allRecipes: allRecipes,
                    previousPath: window.history.state?.usr?.previousPath || "/",
                    recipeId: recipe.idMeal,
                },
            })
        } else {
            navigate(`/recipe/${slug}`, {
                state: {
                    recipe: recipe,
                    userIngredients: window.history.state?.usr?.userIngredients || [],
                    allRecipes: allRecipes,
                    previousPath: window.history.state?.usr?.previousPath || "/",
                    recipeId: recipe.id,
                },
            })
        }
    }

    return (
        <div className="flex justify-between items-center mb-6">
            <Button
                variant="outline"
                onClick={() => navigateToRecipe(allRecipes[prevIndex])}
                className="border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/20 rounded-full transform hover:scale-105 transition-all duration-300"
            >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous Recipe
            </Button>
            <div className="text-[#f5efe4] font-terminal">
                {currentIndex + 1} of {allRecipes.length}
            </div>
            <Button
                variant="outline"
                onClick={() => navigateToRecipe(allRecipes[nextIndex])}
                className="border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/20 rounded-full transform hover:scale-105 transition-all duration-300"
            >
                Next Recipe
                <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    )
}

export default RecipeNavigator
