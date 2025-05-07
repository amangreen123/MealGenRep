"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Sparkles, ChefHat, Wine } from "lucide-react"
import { slugify } from "./utils/slugify"

const RecommendedRecipes = ({ recipeType, userIngredients = [], currentRecipeId, allRecipes = [] }) => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)

        // If we already have recipes from the same search, use those first
        if (allRecipes && allRecipes.length > 0) {
          // Filter out the current recipe
          const filteredRecipes = allRecipes.filter((recipe) => {
            const recipeId = recipe.id || recipe.idMeal || recipe.idDrink
            return recipeId !== currentRecipeId
          })

          // If we have enough recipes from the same search, use those
          if (filteredRecipes.length >= 4) {
            // Randomly select 4 recipes
            const shuffled = [...filteredRecipes].sort(() => 0.5 - Math.random())
            setRecommendations(shuffled.slice(0, 4))
            setLoading(false)
            return
          }
        }

        // Otherwise, fetch new recommendations based on user ingredients
        const apiKey = import.meta.env.VITE_MEALDB_KEY || "1"

        // For drinks, fetch from CocktailDB
        if (recipeType === "drink") {
          // If user has ingredients, try to find drinks with those ingredients
          if (userIngredients.length > 0) {
            // Randomly select one ingredient to search by
            const randomIngredient = userIngredients[Math.floor(Math.random() * userIngredients.length)]
            const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${randomIngredient}`)
            const data = await response.json()

            if (data && data.drinks && data.drinks.length > 0) {
              // Add slugs to each drink
              const drinksWithSlugs = data.drinks.map((drink) => ({
                ...drink,
                slug: slugify(drink.strDrink),
                isDrink: true,
              }))

              // Randomly select up to 4 drinks
              const shuffled = [...drinksWithSlugs].sort(() => 0.5 - Math.random())
              setRecommendations(shuffled.slice(0, 4))
              setLoading(false)
              return
            }
          }

          // Fallback: fetch random drinks
          const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/random.php`)
          const data = await response.json()

          if (data && data.drinks) {
            // We need 4 drinks, so make multiple requests
            const drinks = [...data.drinks]

            for (let i = 0; i < 3; i++) {
              const additionalResponse = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/random.php`)
              const additionalData = await additionalResponse.json()
              if (additionalData && additionalData.drinks) {
                drinks.push(...additionalData.drinks)
              }
            }

            // Add slugs to each drink
            const drinksWithSlugs = drinks.map((drink) => ({
              ...drink,
              slug: slugify(drink.strDrink),
              isDrink: true,
            }))

            setRecommendations(drinksWithSlugs.slice(0, 4))
          }
        }
        // For meals, fetch from MealDB
        else {
          // If user has ingredients, try to find meals with those ingredients
          if (userIngredients.length > 0) {
            // Randomly select one ingredient to search by
            const randomIngredient = userIngredients[Math.floor(Math.random() * userIngredients.length)]
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${randomIngredient}`)
            const data = await response.json()

            if (data && data.meals && data.meals.length > 0) {
              // Add slugs to each meal
              const mealsWithSlugs = data.meals.map((meal) => ({
                ...meal,
                slug: slugify(meal.strMeal),
              }))

              // Randomly select up to 4 meals
              const shuffled = [...mealsWithSlugs].sort(() => 0.5 - Math.random())
              setRecommendations(shuffled.slice(0, 4))
              setLoading(false)
              return
            }
          }

          // Fallback: fetch random selection
          const response = await fetch(`https://www.themealdb.com/api/json/v2/${apiKey}/randomselection.php`)
          const data = await response.json()

          if (data && data.meals) {
            // Add slugs to each meal
            const mealsWithSlugs = data.meals.map((meal) => ({
              ...meal,
              slug: slugify(meal.strMeal),
            }))

            setRecommendations(mealsWithSlugs.slice(0, 4))
          }
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [recipeType, userIngredients, currentRecipeId, allRecipes])

  const handleRecipeClick = (recipe) => {
    const currentPath = window.location.pathname

    if (recipe.isDrink) {
      navigate(`/drink/${recipe.slug}`, {
        state: {
          drink: recipe,
          userIngredients: userIngredients,
          allRecipes: recommendations,
          previousPath: currentPath,
          recipeId: recipe.idDrink,
        },
      })
    } else if (recipe.idMeal) {
      navigate(`/mealdb-recipe/${recipe.slug}`, {
        state: {
          meal: recipe,
          userIngredients: userIngredients,
          allRecipes: recommendations,
          previousPath: currentPath,
          recipeId: recipe.idMeal,
        },
      })
    } else {
      navigate(`/recipe/${recipe.slug}`, {
        state: {
          recipe,
          userIngredients: userIngredients,
          allRecipes: recommendations,
          previousPath: currentPath,
          recipeId: recipe.id,
        },
      })
    }
  }

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-6">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-[#ce7c1c] mx-auto animate-pulse mb-3" />
          <p className="font-terminal text-gray-400">Finding recommendations...</p>
        </div>
      </div>
    )
  }

  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <div className="w-full mt-12 mb-8">
      <h2 className="text-3xl font-title mb-6 text-center">
        <span className="text-[#ce7c1c]">YOU MAY</span> <span className="text-white">ALSO LIKE</span>
      </h2>

      <div className="bg-gray-900/50 rounded-3xl border border-gray-700 p-4 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {recommendations.map((recipe) => {
            const title = recipe.title || recipe.strMeal || recipe.strDrink
            const image = recipe.image || recipe.strMealThumb || recipe.strDrinkThumb
            const isDrink = recipe.isDrink || recipe.strDrink

            return (
              <Card
                key={recipe.id || recipe.idMeal || recipe.idDrink}
                className="overflow-hidden border border-gray-700 bg-gray-800/50 rounded-xl hover:shadow-md hover:shadow-[#ce7c1c]/20 transition-all duration-300 cursor-pointer transform hover:scale-[1.03]"
                onClick={() => handleRecipeClick(recipe)}
              >
                <div className="p-0">
                  <div className="relative">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={title}
                      className="w-full h-32 md:h-40 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <h3 className="text-white font-terminal text-xs md:text-sm line-clamp-2">{title}</h3>
                      <div className="flex items-center mt-1">
                        {isDrink ? (
                          <Wine className="h-3 w-3 text-[#ce7c1c]" />
                        ) : (
                          <ChefHat className="h-3 w-3 text-[#ce7c1c]" />
                        )}
                        <span className="text-xs text-gray-300 font-terminal ml-1">
                          {isDrink ? "Drink" : recipe.strCategory || "Meal"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RecommendedRecipes
