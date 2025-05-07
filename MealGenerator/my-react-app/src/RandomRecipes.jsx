"use client"

import { Button } from "@/components/ui/button"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { slugify } from "./utils/slugify"

const RandomRecipes = () => {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const navigate = useNavigate()

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("https://www.themealdb.com/api/json/v1/1/categories.php")
        const data = await response.json()
        if (data.categories) {
          setCategories(data.categories)
        }
      } catch (err) {
        console.error("Error fetching categories:", err)
      }
    }

    fetchCategories()
  }, [])

  // Fetch random recipes or category-specific recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true)

        const apiKey = import.meta.env.VITE_MEALDB_KEY || "1" // Use environment variable or default to free API
        let url = `https://www.themealdb.com/api/json/v2/${apiKey}/randomselection.php`

        // If a category is selected, fetch recipes from that category
        if (selectedCategory) {
          url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${selectedCategory}`
        }

        const response = await fetch(url)
        const data = await response.json()

        if (data.meals) {
          // Add slugs to each recipe
          const recipesWithSlugs = data.meals.map((meal) => ({
            ...meal,
            slug: slugify(meal.strMeal),
          }))
          setRecipes(recipesWithSlugs)
        } else {
          setError("No recipes found")
        }
      } catch (err) {
        setError("Failed to fetch recipes")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [selectedCategory])

  const handleRecipeClick = (recipe) => {
    navigate(`/mealdb-recipe/${recipe.slug}`, {
      state: {
        meal: recipe,
        userIngredients: [],
        allRecipes: recipes,
        previousPath: window.location.pathname,
        // Store the ID explicitly
        recipeId: recipe.idMeal,
      },
    })
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category)
  }

  if (loading) {
    return (
        <div className="w-full flex justify-center items-center py-12">
          <div className="text-center">
            <Sparkles className="h-12 w-12 text-[#ce7c1c] mx-auto animate-pulse mb-4" />
            <p className="text-lg font-terminal text-gray-400">Loading recipes...</p>
          </div>
        </div>
    )
  }

  if (error) {
    return (
        <div className="w-full flex justify-center items-center py-12">
          <p className="text-lg font-terminal text-gray-400">{error}</p>
        </div>
    )
  }

  return (
      <div className="w-full max-w-7xl mx-auto px-6 py-8 mb-12">
        <h2 className="text-3xl font-title mb-6 text-center">
          <span className="text-[#ce7c1c]">DISCOVER</span> RECIPES
        </h2>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-4 py-2 text-sm ${
                  !selectedCategory
                      ? "bg-[#ce7c1c] text-white"
                      : "bg-transparent border border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/10"
              }`}
          >
            All
          </Button>

          {categories.slice(0, 8).map((category) => (
              <Button
                  key={category.strCategory}
                  onClick={() => handleCategoryChange(category.strCategory)}
                  className={`rounded-full px-4 py-2 text-sm ${
                      selectedCategory === category.strCategory
                          ? "bg-[#ce7c1c] text-white"
                          : "bg-transparent border border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/10"
                  }`}
              >
                {category.strCategory}
              </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto">
          {recipes.map((recipe) => (
              <Card
                  key={recipe.idMeal}
                  className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors rounded-3xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
                  onClick={() => handleRecipeClick(recipe)}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                        src={recipe.strMealThumb || "/placeholder.svg"}
                        alt={recipe.strMeal}
                        className="w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <h3 className="text-white font-terminal text-lg">{recipe.strMeal}</h3>
                      <div className="flex items-center mt-1">
                        {recipe.strCategory && (
                            <>
                              <span className="text-sm text-gray-300 font-terminal">{recipe.strCategory}</span>
                              {recipe.strArea && <span className="mx-2 text-gray-500">•</span>}
                            </>
                        )}
                        {recipe.strArea && <span className="text-sm text-gray-300 font-terminal">{recipe.strArea}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>

        {/* "Refresh" button to get new random recipes */}
        {!selectedCategory && (
            <div className="flex justify-center mt-8">
              <Button
                  onClick={() => {
                    setLoading(true)
                    const apiKey = import.meta.env.VITE_MEALDB_KEY || "1"
                    fetch(`https://www.themealdb.com/api/json/v2/${apiKey}/randomselection.php`)
                        .then((res) => res.json())
                        .then((data) => {
                          if (data.meals) {
                            const recipesWithSlugs = data.meals.map((meal) => ({
                              ...meal,
                              slug: slugify(meal.strMeal),
                            }))
                            setRecipes(recipesWithSlugs)
                          }
                        })
                        .catch((err) => console.error(err))
                        .finally(() => setLoading(false))
                  }}
                  className="border-2 border-[#ce7c1c] bg-[#ce7c1c]/10 hover:bg-[#ce7c1c]/30 text-[#ce7c1c] px-6 py-3 font-terminal rounded-full cursor-pointer text-base font-bold shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/30 transform hover:scale-105 transition-all duration-300"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Discover More Recipes
              </Button>
            </div>
        )}
      </div>
  )
}

export default RandomRecipes
