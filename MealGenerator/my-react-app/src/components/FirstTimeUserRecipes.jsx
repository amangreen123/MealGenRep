import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, X } from "lucide-react"

const FirstTimeUserRecipes = ({ onDismiss }) => {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const navigate = useNavigate()

  // Prevent body scroll when component mounts
  useEffect(() => {
    document.body.classList.add('first-time-active')
    return () => {
      document.body.classList.remove('first-time-active')
    }
  }, [])

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("https://www.themealdb.com/api/json/v1/1/categories.php")
        const data = await response.json()
        if (data.categories) {
          setCategories(data.categories.slice(0, 8)) // Show first 8 categories
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

        const apiKey = import.meta.env.VITE_MEALDB_KEY || "1"
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

  const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
  }

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
        <div className="first-time-overlay">
          <div className="first-time-loading">
            <div className="first-time-spinner" />
            <p className="font-terminal text-gray-400 text-lg">Loading delicious recipes...</p>
          </div>
        </div>
    )
  }

  if (error) {
    return null // Don't show anything if there's an error
  }

  return (
      <div className="first-time-overlay">
        {/* Close button */}
        <button
            onClick={handleDismiss}
            className="first-time-close-btn"
            aria-label="Close welcome screen"
        >
          <X size={24} className="text-[#ce7c1c]" />
        </button>

        <div className="first-time-container">
          {/* Header */}
          <div className="first-time-header">
            <h1 className="first-time-title">
              <span className="text-[#ce7c1c]">WELCOME TO</span>{" "}
              <span className="text-white">MEAL</span>{" "}
              <span className="text-[#ce7c1c]">FORGER</span>
            </h1>
            <p className="first-time-subtitle font-terminal">
              Discover amazing recipes and start cooking with what you have
            </p>
          </div>

          {/* Category filters */}
          <div className="first-time-filters">
            <button
                onClick={() => setSelectedCategory(null)}
                className={`first-time-filter-btn font-terminal ${
                    !selectedCategory ? "active" : "inactive"
                }`}
            >
              All Recipes
            </button>

            {categories.map((category) => (
                <button
                    key={category.strCategory}
                    onClick={() => handleCategoryChange(category.strCategory)}
                    className={`first-time-filter-btn font-terminal ${
                        selectedCategory === category.strCategory ? "active" : "inactive"
                    }`}
                >
                  {category.strCategory}
                </button>
            ))}
          </div>

          {/* Recipe grid */}
          <div className="first-time-recipe-grid">
            {recipes.slice(0, 16).map((recipe) => (
                <div
                    key={recipe.idMeal}
                    className="first-time-recipe-card"
                    onClick={() => handleRecipeClick(recipe)}
                >
                  <img
                      src={recipe.strMealThumb || "/placeholder.svg"}
                      alt={recipe.strMeal}
                      className="first-time-recipe-image"
                      loading="lazy"
                  />
                  <div className="first-time-recipe-info">
                    <h3 className="first-time-recipe-title font-title">
                      {recipe.strMeal}
                    </h3>
                  </div>
                </div>
            ))}
          </div>

          {/* Get Started CTA */}
          <div className="first-time-cta">
            <button
                onClick={handleDismiss}
                className="first-time-cta-btn font-terminal"
            >
              <Sparkles className="h-5 w-5 animate-pulse" />
              Get Started
            </button>
          </div>
        </div>
      </div>
  )
}

export default FirstTimeUserRecipes