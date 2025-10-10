"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, Users, Flame, Zap, Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { slugify } from "@/utils/slugify"
import { useRecipeDetails } from "@/hooks/useRecipeDetails" 

const MealDBRecipeDetails = () => {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const state = location.state || {}
    const { meal, userIngredients = [], allRecipes = [], previousPath = "/" } = state

    const recipeId = state.recipeId || meal?.idMeal || id

    // Use the cached hook
    const { getMealDetails, loading, error: fetchError } = useRecipeDetails()

    const [recipeDetails, setRecipeDetails] = useState(null)
    const [error, setError] = useState(null)
    const [servings, setServings] = useState(4)
    const [baseNutrition, setBaseNutrition] = useState(null)
    const [nutritionInfo, setNutritionInfo] = useState({
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
    })

    useEffect(() => {
        const fetchRecipeData = async () => {
            if (!recipeId) {
                setError("Invalid meal ID")
                return
            }

            try {
                // Use cached hook - only fetches ONCE per recipe
                const data = await getMealDetails(recipeId)

                if (data?.meals?.[0]) {
                    const mealData = data.meals[0]
                    setRecipeDetails(mealData)

                    if (mealData.nutrition?.perServing) {
                        const baseNutritionData = {
                            calories: mealData.nutrition.perServing.calories || 0,
                            protein: mealData.nutrition.perServing.protein || 0,
                            fat: mealData.nutrition.perServing.fat || 0,
                            carbs: mealData.nutrition.perServing.carbs || 0,
                        }
                        setBaseNutrition(baseNutritionData)

                        const initialServings = mealData.nutrition.servings || 4
                        setServings(initialServings)

                        setNutritionInfo({
                            calories: Math.round(baseNutritionData.calories * initialServings),
                            protein: Math.round(baseNutritionData.protein * initialServings),
                            fat: Math.round(baseNutritionData.fat * initialServings),
                            carbs: Math.round(baseNutritionData.carbs * initialServings),
                        })
                    }
                } else {
                    setError("Recipe not found")
                }
            } catch (error) {
                console.error("Error fetching recipe:", error)
                setError(error.message || "An error occurred")
            }
        }

        fetchRecipeData()
    }, [recipeId, getMealDetails])

    const handleServingsChange = (newServings) => {
        setServings(newServings)
        if (baseNutrition) {
            setNutritionInfo({
                calories: Math.round(baseNutrition.calories * newServings),
                protein: Math.round(baseNutrition.protein * newServings),
                fat: Math.round(baseNutrition.fat * newServings),
                carbs: Math.round(baseNutrition.carbs * newServings),
            })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#131415] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-[#ce7c1c] text-sm font-terminal animate-pulse">
                        Loading recipe details...
                    </div>
                </div>
            </div>
        )
    }

    if (error || fetchError || !recipeDetails) {
        return (
            <div className="min-h-screen bg-[#131415] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-[#f5efe4] text-xl font-terminal mb-4">
                        {error || fetchError || "Recipe not found"}
                    </div>
                    <Button
                        onClick={() => navigate(previousPath)}
                        className="bg-[#ce7c1c] text-white hover:bg-[#b56a15] font-terminal"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

    // Extract ingredients
    const ingredients = []
    for (let i = 1; i <= 20; i++) {
        const ingredient = recipeDetails[`strIngredient${i}`]
        const measure = recipeDetails[`strMeasure${i}`]
        if (ingredient && ingredient.trim() !== "") {
            ingredients.push({ name: ingredient, measure: measure || "To taste" })
        }
    }

    // Determine matching and missing ingredients
    const userIngredientsNormalized = userIngredients.map((ing) => ing.toLowerCase().trim())
    const pantryItems = ingredients.filter((item) =>
        userIngredientsNormalized.includes(item.name.toLowerCase().trim())
    )
    const shoppingListItems = ingredients.filter(
        (item) => !userIngredientsNormalized.includes(item.name.toLowerCase().trim())
    )

    // Parse instructions
    const instructionSteps = recipeDetails.strInstructions
        .split(/\.\s+/)
        .filter((step) => step.trim())
        .map((step) => step.trim() + (step.endsWith(".") ? "" : "."))

    // Navigation helpers
    const currentIndex = allRecipes.findIndex((r) => r.idMeal === recipeDetails.idMeal)
    const totalRecipes = allRecipes.length
    const hasPrevious = currentIndex > 0
    const hasNext = currentIndex < totalRecipes - 1

    const navigateToRecipe = (direction) => {
        const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1
        if (newIndex >= 0 && newIndex < totalRecipes) {
            const newRecipe = allRecipes[newIndex]
            navigate(`/mealdb-recipe/${slugify(newRecipe.strMeal)}`, {
                state: {
                    meal: newRecipe,
                    userIngredients,
                    allRecipes,
                    previousPath,
                    recipeId: newRecipe.idMeal,
                },
            })
        }
    }

    // Get related recipes
    const relatedRecipes = allRecipes.filter((r) => r.idMeal !== recipeDetails.idMeal).slice(0, 3)

    return (
        <div className="min-h-screen bg-[#131415] text-[#f5efe4]">
            {/* Top Navigation */}
            <div className="bg-[#131415]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => navigate(previousPath)}
                                className="text-[#ce7c1c] hover:text-[#ce7c1c] hover:bg-transparent font-terminal text-sm transition-all duration-300 px-0"
                            >
                                <Home className="w-6 h-4 mr-2" />
                                Main Menu
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => navigateToRecipe("prev")}
                                disabled={!hasPrevious}
                                className="border-2 border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-700 bg-transparent font-terminal rounded-full px-6 py-2 text-sm transition-all duration-300"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous Recipe
                            </Button>
                        </div>

                        {totalRecipes > 1 && (
                            <div className="text-[#f5efe4] font-terminal text-sm">
                                {currentIndex + 1} of {totalRecipes}
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={() => navigateToRecipe("next")}
                            disabled={!hasNext}
                            className="border-2 border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-700 bg-transparent font-terminal rounded-full px-6 py-2 text-sm transition-all duration-300"
                        >
                            Next Recipe
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content - Keep your existing UI exactly as is */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Left Column - Recipe Details */}
                    <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                        {/* Recipe Header */}
                        <div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-title mb-4">
                                <span className="text-[#ce7c1c]">{recipeDetails.strMeal.toUpperCase()}</span>
                            </h1>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {recipeDetails.strCategory && (
                                    <Badge className="bg-gray-800 text-[#f5efe4] border-gray-700 font-terminal text-xs px-3 py-1 rounded-full">
                                        {recipeDetails.strCategory}
                                    </Badge>
                                )}
                                {recipeDetails.strArea && (
                                    <Badge className="bg-gray-800 text-[#f5efe4] border-gray-700 font-terminal text-xs px-3 py-1 rounded-full">
                                        {recipeDetails.strArea}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Recipe Image */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                            <img
                                src={recipeDetails.strMealThumb || "/placeholder.svg"}
                                alt={recipeDetails.strMeal}
                                className="w-full h-[300px] sm:h-[400px] md:h-[500px] object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-6">
                                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#ce7c1c]" />
                                        <span className="font-terminal text-xs sm:text-sm">25 min</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#ce7c1c]" />
                                        <span className="font-terminal text-xs sm:text-sm">{servings} servings</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#ce7c1c]" />
                                        <span className="font-terminal text-xs sm:text-sm font-bold">{nutritionInfo.calories} kcal</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nutrition Facts */}
                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-lg">
                            <div className="flex items-center justify-between mb-6 sm:mb-8">
                                <h2 className="text-xl sm:text-2xl font-bold font-title">
                                    <span className="text-[#ce7c1c]">NUTRITION</span> <span className="text-white">FACTS</span>
                                </h2>
                                <div className="text-xs font-terminal text-gray-400">
                                    Per Serving: {Math.round(nutritionInfo.calories / servings)} kcal
                                </div>
                            </div>

                            {/* Serving Size Slider */}
                            <div className="mb-8 bg-[#0a0b0c] border border-gray-800 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-terminal text-[#f5efe4]">SERVINGS</label>
                                    <span className="text-2xl font-bold font-title text-[#ce7c1c]">{servings}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="12"
                                    value={servings}
                                    onChange={(e) => handleServingsChange(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                                />
                                <div className="flex justify-between mt-2 text-xs font-terminal text-gray-500">
                                    <span>1</span>
                                    <span>6</span>
                                    <span>12</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                                <div className="text-center">
                                    <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-[#ce7c1c] mx-auto mb-2" />
                                    <div className="text-2xl sm:text-3xl font-bold font-title text-white mb-1">
                                        {nutritionInfo.calories}
                                    </div>
                                    <div className="text-xs font-terminal text-gray-400 uppercase tracking-wider">Calories</div>
                                </div>
                                <div className="text-center">
                                    <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-[#ce7c1c] mx-auto mb-2" />
                                    <div className="text-2xl sm:text-3xl font-bold font-title text-white mb-1">
                                        {nutritionInfo.protein}g
                                    </div>
                                    <div className="text-xs font-terminal text-blue-400 uppercase tracking-wider">Protein</div>
                                </div>
                                <div className="text-center">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#ce7c1c] rounded-full flex items-center justify-center mx-auto mb-2">
                                        <span className="text-white font-bold text-xs sm:text-sm">C</span>
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold font-title text-white mb-1">
                                        {nutritionInfo.carbs}g
                                    </div>
                                    <div className="text-xs font-terminal text-yellow-400 uppercase tracking-wider">Carbs</div>
                                </div>
                                <div className="text-center">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#ce7c1c] rounded-full flex items-center justify-center mx-auto mb-2">
                                        <span className="text-white font-bold text-xs sm:text-sm">F</span>
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold font-title text-white mb-1">{nutritionInfo.fat}g</div>
                                    <div className="text-xs font-terminal text-orange-400 uppercase tracking-wider">Fat</div>
                                </div>
                            </div>
                        </div>

                        {/* Cooking Instructions */}
                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-lg">
                            <h2 className="text-xl sm:text-2xl font-bold font-title mb-6 sm:mb-8">
                                <span className="text-[#ce7c1c]">COOKING</span> <span className="text-white">INSTRUCTIONS</span>
                            </h2>
                            <ScrollArea className="h-[400px] sm:h-[500px] pr-4">
                                <div className="space-y-4 sm:space-y-6">
                                    {instructionSteps.map((step, index) => (
                                        <div key={index} className="flex gap-3 sm:gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[#ce7c1c] rounded-full flex items-center justify-center shadow-lg">
                                                <span className="font-terminal text-xs sm:text-sm font-bold text-white">{index + 1}</span>
                                            </div>
                                            <p className="font-terminal text-xs sm:text-sm text-[#f5efe4] leading-relaxed pt-1 sm:pt-2">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {/* Right Sidebar - Keep ALL your existing sidebar code */}
                    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                        {/* My Pantry */}
                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-lg">
                            <h3 className="text-lg sm:text-xl font-bold font-title mb-4">
                                <span className="text-[#ce7c1c]">MY</span> <span className="text-white">PANTRY</span>
                            </h3>
                            {pantryItems.length > 0 ? (
                                <>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {pantryItems.map((item, index) => (
                                            <Badge
                                                key={index}
                                                className="bg-gray-800 text-[#f5efe4] border-gray-700 font-terminal text-xs px-3 py-1.5 rounded-full shadow-md hover:bg-gray-700 transition-colors duration-200"
                                            >
                                                {item.name}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="text-xs sm:text-sm font-terminal text-green-500 bg-green-900/20 px-3 py-2 rounded-full inline-block">
                                        ✓ {pantryItems.length} matching ingredients
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs sm:text-sm font-terminal text-gray-500 bg-gray-900/50 px-4 py-3 rounded-2xl">
                                    NO MATCHING INGREDIENTS
                                </p>
                            )}
                        </div>

                        {/* Shopping List */}
                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-lg">
                            <h3 className="text-lg sm:text-xl font-bold font-title mb-4">
                                <span className="text-[#ce7c1c]">SHOPPING</span> <span className="text-white">LIST</span>
                            </h3>
                            {shoppingListItems.length > 0 ? (
                                <ScrollArea className="h-[300px]">
                                    <div className="space-y-2 pr-4">
                                        {shoppingListItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 font-terminal text-xs sm:text-sm text-[#f5efe4] hover:border-[#ce7c1c]/50 transition-colors duration-200"
                                            >
                                                <div>{item.name}</div>
                                                {item.measure && item.measure.trim() !== "" && (
                                                    <div className="text-gray-500 text-xs mt-1">{item.measure}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <p className="text-xs sm:text-sm font-terminal text-gray-500 bg-gray-900/50 px-4 py-3 rounded-2xl">
                                    YOU HAVE ALL INGREDIENTS
                                </p>
                            )}
                        </div>

                        {/* You Might Also Like */}
                        {relatedRecipes.length > 0 && (
                            <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-lg">
                                <h3 className="text-xl font-bold font-title mb-6">
                                    <span className="text-white">YOU MIGHT</span> <span className="text-[#ce7c1c]">ALSO LIKE</span>
                                </h3>
                                <div className="space-y-4">
                                    {relatedRecipes.map((recipe) => (
                                        <div
                                            key={recipe.idMeal}
                                            className="flex items-center gap-4 cursor-pointer hover:bg-gray-700/50 p-2 rounded-2xl transition-colors duration-200"
                                            onClick={() =>
                                                navigate(`/mealdb-recipe/${slugify(recipe.strMeal)}`, {
                                                    state: {
                                                        meal: recipe,
                                                        userIngredients,
                                                        allRecipes,
                                                        previousPath,
                                                        recipeId: recipe.idMeal,
                                                    },
                                                })
                                            }
                                        >
                                            <img
                                                src={recipe.strMealThumb || "/placeholder.svg"}
                                                alt={recipe.strMeal}
                                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-700"
                                            />
                                            <div>
                                                <h4 className="text-sm sm:text-base font-semibold font-terminal text-[#f5efe4]">
                                                    {recipe.strMeal}
                                                </h4>
                                                
                                                <Badge className="bg-[#ce7c1c]/20 text-[#ce7c1c] border-[#ce7c1c]/30 font-terminal text-xs px-2 py-0.5 rounded-full">
                                                    {recipe.strCategory && (
                                                        <div className="text-xs font-terminal text-gray-400">
                                                            {recipe.strCategory}
                                                        </div>
                                                    )}                                                
                                                </Badge>
                                               
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MealDBRecipeDetails