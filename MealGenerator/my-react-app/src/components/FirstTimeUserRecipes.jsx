"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, X, ChevronDown, ChevronUp } from "lucide-react"

const FirstTimeUserRecipes = ({ onDismiss }) => {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 768)
  const navigate = useNavigate()

  // Track window width for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Automatically expand on desktop
  useEffect(() => {
    setExpanded(windowWidth >= 768)
  }, [windowWidth])

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

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  // Determine how many recipes to show based on screen size and expanded state
  const getRecipesToShow = () => {
    if (windowWidth >= 768) return recipes.slice(0, 8) // Always show 8 on desktop
    return expanded ? recipes.slice(0, 4) : recipes.slice(0, 3) // Show 3 or 4 on mobile
  }

  if (loading) {
    return (
        <div className="w-full flex justify-center items-center py-2">
          <div className="text-center">
            <Sparkles className="h-6 w-6 text-[#ce7c1c] mx-auto animate-pulse mb-1" />
            <p className="font-terminal text-gray-400 text-xs">Loading recipes...</p>
          </div>
        </div>
    )
  }

  if (error) {
    return null // Don't show anything if there's an error
  }

  return (
      <div className="bg-gray-900/50 rounded-2xl border border-gray-700 p-3 md:p-6 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300 mb-3 md:mb-8 relative">
        {/* Dismiss button */}
        <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 rounded-full p-1.5 text-gray-400 hover:text-white transition-all duration-300 transform hover:rotate-90 hover:scale-110 z-10"
            aria-label="Dismiss popular recipes"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center mb-2 md:mb-4">
          <h2 className="text-xl md:text-3xl font-bold font-title text-center">
            <span className="text-[#ce7c1c]">WELCOME</span> <span className="text-white">TO MEAL FORGER</span>
          </h2>

          <p className="text-gray-400 font-terminal text-xs md:text-sm mt-1 text-center px-2 md:px-0 max-w-md mx-auto">
            Discover popular recipes to get started
          </p>
        </div>

        {/* Category filters - horizontal scrollable row with better spacing */}
        <div className="flex overflow-x-auto py-2 mb-3 scrollbar-thin scrollbar-thumb-[#ce7c1c] scrollbar-track-gray-800 px-1 gap-2 snap-x justify-center md:justify-start">
          <Button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1 text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  !selectedCategory
                      ? "bg-[#ce7c1c] text-white"
                      : "bg-transparent border border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/10"
              }`}
          >
            All
          </Button>

          {categories.slice(0, windowWidth >= 768 ? 6 : 4).map((category) => (
              <Button
                  key={category.strCategory}
                  onClick={() => handleCategoryChange(category.strCategory)}
                  className={`rounded-full px-3 py-1 text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === category.strCategory
                          ? "bg-[#ce7c1c] text-white"
                          : "bg-transparent border border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/10"
                  }`}
              >
                {category.strCategory}
              </Button>
          ))}
        </div>

        {/* Recipe grid - responsive layout */}
        <div className={`grid grid-cols-3 ${windowWidth >= 768 ? "md:grid-cols-4" : ""} gap-2 md:gap-4`}>
          {getRecipesToShow().map((recipe) => (
              <Card
                  key={recipe.idMeal}
                  className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors rounded-lg overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 snap-center"
                  onClick={() => handleRecipeClick(recipe)}
              >
                <div className="p-0">
                  <div className="relative">
                    <img
                        src={recipe.strMealThumb || "/placeholder.svg"}
                        alt={recipe.strMeal}
                        className="w-full h-20 sm:h-24 md:h-32 object-cover"
                        loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 md:p-2">
                      <h3 className="text-white font-terminal text-[10px] md:text-xs line-clamp-1">{recipe.strMeal}</h3>
                    </div>
                  </div>
                </div>
              </Card>
          ))}
        </div>

        {/* Show more/less toggle - visible on all devices */}
        {recipes.length > (windowWidth >= 768 ? 8 : 3) && (
            <div className="flex justify-center mt-3">
              <Button
                  onClick={toggleExpanded}
                  variant="ghost"
                  size="sm"
                  className="text-xs md:text-sm text-gray-400 hover:text-white flex items-center gap-1 py-1 px-3 h-auto"
              >
                {expanded ? (
                    <>
                      <ChevronUp size={14} /> Show Less
                    </>
                ) : (
                    <>
                      <ChevronDown size={14} /> Show More
                    </>
                )}
              </Button>
            </div>
        )}

        {/* Get Started button */}
        <div className="flex justify-center mt-3 md:mt-4">
          <Button
              onClick={handleDismiss}
              className="border border-[#ce7c1c] bg-[#ce7c1c]/10 hover:bg-[#ce7c1c]/30 text-[#ce7c1c] px-4 py-1.5 font-terminal rounded-full cursor-pointer text-xs md:text-sm font-bold shadow-md shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/30 transform hover:scale-110 hover:translate-y-[-2px] active:translate-y-[1px] transition-all duration-300"
          >
            <Sparkles className="h-3 w-3 mr-1.5 animate-pulse" />
            Get Started
          </Button>
        </div>
      </div>
  )
}

export default FirstTimeUserRecipes
