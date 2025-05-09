"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home, Wine, Clock, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import getDrinkDetails from "./getDrinkDetails.jsx"
import RecipeNavigator from "./RecipeNavigator.jsx"
import { ScrollArea } from "@/components/ui/scroll-area"
import RecommendedRecipes from "./RecommendedRecipes.jsx"

const DrinkDetails = () => {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const state = location.state || {}
    const { drink, userIngredients = [], allRecipes = [], previousPath = "/" } = state

    // Get the recipe ID from state or try to extract from the URL
    const drinkId = state.recipeId || drink?.idDrink || id

    const [loading, setLoading] = useState(true)
    const [drinkDetails, setDrinkDetails] = useState(null)
    const [ingredients, setIngredients] = useState([])
    const [error, setError] = useState(null)

    // Mock nutrition data (in a real app, this would come from an API)
    const [totalNutrition] = useState({
        calories: 245,
        protein: 0,
        fat: 0,
        carbs: 22,
        alcohol: 14,
    })

    useEffect(() => {
        const fetchDrinkData = async () => {
            if (!drinkId) {
                setError("Invalid drink ID")
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                console.log("Fetching drink with ID:", drinkId)
                const data = await getDrinkDetails(drinkId)

                if (data?.drinks?.[0]) {
                    const drinkData = data.drinks[0]
                    setDrinkDetails(drinkData)

                    // Extract ingredients and measures
                    const extractedIngredients = []
                    for (let i = 1; i <= 15; i++) {
                        const ingredient = drinkData[`strIngredient${i}`]
                        const measure = drinkData[`strMeasure${i}`]
                        if (ingredient && ingredient.trim() !== "") {
                            extractedIngredients.push({ ingredient, measure: measure || "To taste" })
                        }
                    }
                    setIngredients(extractedIngredients)
                } else {
                    setError("Drink not found")
                }
            } catch (error) {
                setError(error.message || "An error occurred while fetching drink details")
            } finally {
                setLoading(false)
            }
        }

        fetchDrinkData()
    }, [drinkId])

    const handleHomeClick = () => {
        navigate(previousPath)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#131415] flex items-center justify-center">
                <div className="text-[#f5efe4] text-xl font-terminal">Loading drink details...</div>
            </div>
        )
    }

    if (error || !drinkDetails) {
        return (
            <div className="min-h-screen bg-[#131415] flex items-center justify-center">
                <div className="text-[#f5efe4] text-xl font-terminal">
                    {error || "Drink not found"}
                    <Button variant="outline" onClick={handleHomeClick} className="mt-4 block mx-auto">
                        <Home className="w-4 h-4 mr-2" />
                        Main Menu
                    </Button>
                </div>
            </div>
        )
    }

    // Now that we know drinkDetails is not null, we can safely extract the data
    // Determine which ingredients the user has and which they need to buy
    const userIngredientsNormalized = userIngredients.map((ing) => ing.toLowerCase().trim())
    const pantryItems = ingredients.filter((item) =>
        userIngredientsNormalized.includes(item.ingredient.toLowerCase().trim()),
    )
    const shoppingListItems = ingredients.filter(
        (item) => !userIngredientsNormalized.includes(item.ingredient.toLowerCase().trim()),
    )

    // Parse instructions
    const instructionSteps = drinkDetails.strInstructions
        .split(/\.\s+/)
        .filter((step) => step.trim())
        .map((step) => step.trim() + (step.endsWith(".") ? "" : "."))

    // Fix for alcoholic/non-alcoholic display
    const isAlcoholic = drinkDetails.strAlcoholic && !drinkDetails.strAlcoholic.toLowerCase().includes("non")

    // Get unique feature for this drink
    const getUniqueFeature = () => {
        if (drinkDetails.strTags) {
            const tags = drinkDetails.strTags.split(",")
            return tags[0]
        }
        return isAlcoholic ? "Alcoholic" : "Non-Alcoholic"
    }

    const uniqueFeature = getUniqueFeature()

    return (
        <div className="min-h-screen bg-[#131415] text-[#f5efe4] p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Navigation Bar */}
                <div className="flex justify-end mb-10">
                    <Button
                        variant="ghost"
                        onClick={handleHomeClick}
                        className="text-[#ce7c1c] hover:bg-[#ce7c1c]/10 hover:text-[#f5efe4] text-lg font-terminal flex items-center gap-2 px-4 py-6 rounded-full transition-all duration-300 transform hover:scale-105"
                    >
                        <Home className="w-5 h-5" />
                        Main Menu
                    </Button>
                </div>

                {location.state?.allRecipes?.length > 1 && (
                    <div className="mb-8">
                        <RecipeNavigator allRecipes={location.state?.allRecipes || []} currentRecipe={drinkDetails} />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column - Drink Image and Info */}
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-title text-center mb-6 relative">
                            <span className="text-[#ce7c1c]">{drinkDetails.strDrink.split(" ")[0]}</span>{" "}
                            {drinkDetails.strDrink.split(" ").slice(1).join(" ")}
                            <div className="absolute -top-4 -right-4">
                                <Badge className="bg-purple-600 hover:bg-purple-700 rounded-full px-3 py-1 text-xs font-bold">
                                    <Wine className="w-3 h-3 mr-1" /> {uniqueFeature}
                                </Badge>
                            </div>
                        </h1>
                        <div className="rounded-3xl overflow-hidden border-2 border-[#ce7c1c] shadow-xl shadow-[#ce7c1c]/20 transform hover:scale-[1.02] transition-all duration-300">
                            <img
                                src={drinkDetails.strDrinkThumb || "/placeholder.svg"}
                                alt={drinkDetails.strDrink}
                                className="w-full h-auto object-cover"
                            />
                        </div>

                        {/* Drink Info */}
                        <div className="mt-6 border-2 border-gray-700 rounded-3xl p-4 bg-gray-900/50 shadow-lg transform hover:translate-y-[-5px] transition-all duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#ce7c1c]/20 p-2 rounded-full">
                                        <Clock className="w-5 h-5 text-[#ce7c1c]" />
                                    </div>
                                    <div className="font-terminal">
                                        <div className="text-sm text-gray-400">PREP TIME</div>
                                        <div>5 minutes</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#ce7c1c]/20 p-2 rounded-full">
                                        <Users className="w-5 h-5 text-[#ce7c1c]" />
                                    </div>
                                    <div className="font-terminal">
                                        <div className="text-sm text-gray-400">SERVINGS</div>
                                        <div>1</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nutrition Info */}
                        <div className="mt-6">
                            <h2 className="text-3xl mb-4 font-title text-center">NUTRITION INFO</h2>
                            <div className="border-2 border-gray-700 rounded-3xl p-6 bg-gray-900/50 grid grid-cols-2 gap-6 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
                                <div className="text-center transform hover:scale-105 transition-all duration-300">
                                    <div className="text-4xl font-title">{totalNutrition.calories}</div>
                                    <div className="text-xl font-title text-[#ce7c1c] mt-2">CALORIES</div>
                                </div>

                                <div className="text-center transform hover:scale-105 transition-all duration-300">
                                    <div className="text-4xl font-title">
                                        {totalNutrition.carbs} <span className="text-3xl">G</span>
                                    </div>
                                    <div className="text-xl font-title text-[#ce7c1c] mt-2">CARBS</div>
                                </div>

                                {totalNutrition.alcohol > 0 && isAlcoholic && (
                                    <div className="text-center transform hover:scale-105 transition-all duration-300 col-span-2">
                                        <div className="text-4xl font-title">
                                            {totalNutrition.alcohol} <span className="text-3xl">G</span>
                                        </div>
                                        <div className="text-xl font-title text-[#ce7c1c] mt-2">ALCOHOL</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Ingredients and Instructions */}
                    <div className="flex flex-col space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* MY PANTRY */}
                            <div>
                                <h2 className="text-3xl mb-4 font-title text-center">
                                    <span className="text-[#ce7c1c]">MY</span> PANTRY
                                </h2>
                                <div className="border-2 border-gray-700 rounded-3xl p-4 bg-gray-900/50 min-h-[150px] shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
                                    {pantryItems.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-gray-500 font-terminal">NO MATCHING INGREDIENTS</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {pantryItems.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="text-lg font-terminal p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors duration-200"
                                                >
                                                    {item.ingredient.toUpperCase()}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SHOPPING LIST */}
                            <div>
                                <h2 className="text-3xl mb-4 font-title text-center">SHOPPING LIST</h2>
                                <div className="border-2 border-gray-700 rounded-3xl p-4 bg-gray-900/50 min-h-[150px] shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
                                    {shoppingListItems.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-gray-500 font-terminal">YOU HAVE ALL INGREDIENTS</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {shoppingListItems.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="text-lg font-terminal p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors duration-200"
                                                >
                                                    {item.ingredient.toUpperCase()}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div>
                            <h2 className="text-3xl mb-4 font-title text-center">
                                <span className="text-[#ce7c1c]">INSTRUCTIONS</span>
                            </h2>
                            <div className="border-2 border-gray-700 rounded-3xl p-6 bg-gray-900/50 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
                                <ScrollArea className="h-[400px] pr-4">
                                    <ol className="list-decimal list-inside space-y-5 font-terminal text-lg">
                                        {instructionSteps.map((step, index) => (
                                            <li
                                                key={index}
                                                className="pl-2 p-3 rounded-xl hover:bg-gray-800/50 transition-colors duration-200"
                                            >
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </div>

                {location.state?.allRecipes?.length > 1 && (
                    <div className="mt-10">
                        <RecipeNavigator allRecipes={location.state?.allRecipes || []} currentRecipe={drinkDetails} />
                    </div>
                )}

                {/* Recommended Drinks Section */}
                <RecommendedRecipes
                    recipeType="drink"
                    userIngredients={userIngredients}
                    currentRecipeId={drinkId}
                    allRecipes={allRecipes}
                />
            </div>
        </div>
    )
}

export default DrinkDetails
