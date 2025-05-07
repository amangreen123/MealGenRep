"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, X } from "lucide-react"
import { slugify } from "./utils/slugify"

const FirstTimeUserRecipes = ({ onDismiss }) => {
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
    // Mark user as no longer new after they click a recipe
    localStorage.setItem("mealForgerFirstTimeUser", "false")

    navigate(`/mealdb-recipe/${recipe.slug}`, {
      state: {
        meal: recipe,
        userIngredients: [],
        allRecipes: recipes,
        previousPath: window.location.pathname,
        recipeId: recipe.idMeal,
      },
    })
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category)
  }

  const handleDismiss = () => {
    // Mark user as no longer new when they dismiss the section
    localStorage.setItem("mealForgerFirstTimeUser", "false")
    if (onDismiss) onDismiss()
  }

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="text-center">
          <Sparkles className="h-10 w-10 text-[#ce7c1c] mx-auto animate-pulse mb-3" />
          <p className="font-terminal text-gray-400">Loading popular recipes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return null // Don't show anything if there's an error
  }

  return (
    <div className="bg-gray-900/50 rounded-3xl border border-gray-700 p-4 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300 mb-6 md:mb-8 relative">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 rounded-full p-1.5 text-gray-400 hover:text-white transition-colors z-10"
        aria-label="Dismiss popular recipes"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col items-center mb-4">
        <h2 className="text-2xl md:text-3xl font-bold font-title text-center">
          <span className="text-[#ce7c1c]">WELCOME</span> <span className="text-white">TO MEAL FORGER</span>
        </h2>
        <p className="text-gray-400 font-terminal text-sm mt-2 text-center">
          Discover popular recipes to get started with your culinary journey
        </p>
      </div>

      {/* Category filters */}
      <div className="flex overflow-x-auto pb-3 mb-4 scrollbar-thin scrollbar-thumb-[#ce7c1c] scrollbar-track-gray-800 px-2 gap-2">
        <Button
          onClick={() => setSelectedCategory(null)}
          className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap ${
            !selectedCategory
              ? "bg-[#ce7c1c] text-white"
              : "bg-transparent border border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/10"
          }`}
        >
          All Recipes
        </Button>

        {categories.slice(0, 8).map((category) => (
          <Button
            key={category.strCategory}
            onClick={() => handleCategoryChange(category.strCategory)}
            className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap ${
              selectedCategory === category.strCategory
                ? "bg-[#ce7c1c] text-white"
                : "bg-transparent border border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/10"
            }`}
          >
            {category.strCategory}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {recipes.slice(0, 8).map((recipe) => (
          <Card
            key={recipe.idMeal}
            className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors rounded-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300"
            onClick={() => handleRecipeClick(recipe)}
          >
            <div className="p-0">
              <div className="relative">
                <img
                  src={recipe.strMealThumb || "/placeholder.svg"}
                  alt={recipe.strMeal}
                  className="w-full h-32 md:h-40 object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <h3 className="text-white font-terminal text-xs md:text-sm line-clamp-2">{recipe.strMeal}</h3>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Get Started button */}
      <div className="flex justify-center mt-4">
        <Button
          onClick={handleDismiss}
          className="border-2 border-[#ce7c1c] bg-[#ce7c1c]/10 hover:bg-[#ce7c1c]/30 text-[#ce7c1c] px-6 py-2 font-terminal rounded-full cursor-pointer text-sm md:text-base font-bold shadow-md shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/30 transform hover:scale-105 transition-all duration-300"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Get Started
        </Button>
      </div>
    </div>
  )
}

export default FirstTimeUserRecipes
