import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Sparkles, X, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import MealForgerLogo from "../Images/Meal_Forger.png";


const FirstTimeUserRecipes = ({ onDismiss }) => {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)

  const navigate = useNavigate()

  // Lock body scroll when active
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("https://www.themealdb.com/api/json/v1/1/categories.php")
        const data = await response.json()
        if (data.categories) setCategories(data.categories.slice(0, 8))
      } catch (err) {
        console.error("Failed to fetch categories:", err)
      }
    }
    fetchCategories()
  }, [])

  // Fetch recipes from backend
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true)
        setError(null)

        const BASE_URL = import.meta.env.VITE_DEPLOYED_BACKEND_URL || 'http://localhost:5261'

        // If category is selected, fetch filtered recipes
        let url = selectedCategory
            ? `${BASE_URL}/category-recipes?category=${encodeURIComponent(selectedCategory)}&count=12`
            : `${BASE_URL}/latest-recipes?count=12`

        console.log("Fetching from:", url)

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Received data:", data)

        if (data.meals && Array.isArray(data.meals)) {
          setRecipes(data.meals)
        } else {
          throw new Error("Invalid response format from backend")
        }
      } catch (err) {
        console.error("Error fetching recipes:", err)
        setError(err.message || "Failed to fetch recipes from MealForger Backend")
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [selectedCategory])

  const handleRecipeClick = (recipe) => {
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

  const handleDismiss = () => {
    localStorage.setItem("mealForgerFirstTimeUser", "false")
    if (onDismiss) onDismiss()
  }

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="bg-[#131415] w-full max-w-6xl h-[90vh] rounded-3xl border border-gray-800 shadow-2xl relative flex flex-col overflow-hidden">

          {/* Header Section */}
          <div className="p-8 md:p-10 border-b border-gray-800 flex flex-col items-center text-center relative bg-gradient-to-b from-gray-900 to-[#131415] overflow-hidden">

            {/* Background decorative glow (Matches your brand orange) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#ce7c1c]/10 blur-[60px] rounded-full pointer-events-none" />

            {/* Close Button */}
            <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors z-20"
            >
              <X size={24} />
            </button>

            <div className="relative mb-6 group z-10">
              {/* Subtle pulse animation behind logo */}
              
              <div className="absolute -inset-4 bg-gradient-to-r from-[#ce7c1c]/0 via-[#ce7c1c]/20 to-[#ce7c1c]/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700"></div>
              <img
                  src={MealForgerLogo}           
                  alt="Meal Forger Logo"
                  className="h-32 md:h-48 w-auto object-contain drop-shadow-[0_0_15px_rgba(206,124,28,0.3)] transition-transform duration-500 hover:scale-105"
              />
            </div>

              {/* Title - Adjusted spacing */}
              <h1 className="text-3xl md:text-5xl font-bold font-title mb-3 relative z-10">
                <span className="text-white drop-shadow-lg">WELCOME TO </span>
                <span className="text-[#ce7c1c] drop-shadow-[0_0_10px_rgba(206,124,28,0.4)]">MEAL FORGER</span>
              </h1>

              <p className="text-gray-400 max-w-xl text-lg font-sans relative z-10 leading-relaxed">
                Stop wondering what to cook. We help you build amazing meals with the ingredients you already have matched with our AI.
              </p>
            </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#131415]">
            <div className="flex flex-col h-full">

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                <Button
                    onClick={() => setSelectedCategory(null)}
                    variant={!selectedCategory ? "default" : "outline"}
                    className={`rounded-full font-sans ${!selectedCategory ? 'bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white border-none' : 'border-gray-700 text-gray-400'}`}
                >
                  All Inspiration
                </Button>
                {categories.map((category) => (
                    <Button
                        key={category.strCategory}
                        onClick={() => setSelectedCategory(
                            category.strCategory === selectedCategory ? null : category.strCategory
                        )}
                        variant={selectedCategory === category.strCategory ? "default" : "outline"}
                        className={`rounded-full font-sans ${
                            selectedCategory === category.strCategory
                                ? 'bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white border-none'
                                : 'border-gray-700 text-gray-400'
                        }`}
                    >
                      {category.strCategory}
                    </Button>
                ))}
              </div>

              {/* Grid */}
              {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce7c1c] mb-4"></div>
                    <p className="text-gray-500 font-sans">Forging recipes...</p>
                  </div>
              ) : error ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-red-400">
                    <p className="mb-2">⚠️ {error}</p>
                    <p className="text-sm text-gray-500 mb-4">Check that your backend is running on port 5261</p>
                    <Button
                        variant="outline"
                        className="mt-4 border-gray-700"
                        onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
              ) : recipes.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-gray-400">
                    <p>No recipes found</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
                    {recipes.map((recipe) => (
                        <div
                            key={recipe.idMeal}
                            onClick={() => handleRecipeClick(recipe)}
                            className="group cursor-pointer bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800 hover:border-[#ce7c1c]/50 hover:shadow-lg hover:shadow-[#ce7c1c]/10 transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className="aspect-square overflow-hidden relative">
                            <img
                                src={recipe.strMealThumb}
                                alt={recipe.strMeal}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-gray-200 group-hover:text-[#ce7c1c] transition-colors line-clamp-2 font-title text-lg">
                              {recipe.strMeal}
                            </h3>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent pointer-events-none flex justify-center pb-8">
            <Button
                onClick={handleDismiss}
                className="pointer-events-auto bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white font-bold rounded-full px-8 py-6 text-lg shadow-xl shadow-orange-900/20 animate-bounce"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Forging My Meal
            </Button>
          </div>
        </div>
      </div>
  )
}

export default FirstTimeUserRecipes