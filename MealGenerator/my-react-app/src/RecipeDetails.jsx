"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home, Clock, Users, Award } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import getInstructions from "./GetInstructions.jsx"
import RecipeNavigator from "./RecipeNavigator.jsx"
import RecommendedRecipes from "./RecommendedRecipes.jsx"

const RecipeDetails = () => {
    const navigate = useNavigate()
    const { state } = useLocation()
    const previousPath = state?.previousPath || "/"
    const recipe = state?.recipe
    const userIngredients = state?.userIngredients || []

    const [loading, setLoading] = useState(true)
    const [recipeDetails, setRecipeDetails] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchRecipeData = async () => {
            if (!recipe) return
            try {
                setLoading(true)
                const data = await getInstructions(recipe.id)
                setRecipeDetails(data)
            } catch (error) {
                setError(error.message || "An error occurred while fetching recipe details")
            } finally {
                setLoading(false)
            }
        }

        fetchRecipeData()
    }, [recipe])

    const handleHomeClick = () => {
        navigate("/")
    }

    if (!recipe) {
        return (
            <div className="min-h-screen bg-[#131415] flex items-center justify-center">
                <div className="text-[#f5efe4] text-xl font-terminal">
                    Recipe not found
                    <Button variant="outline" onClick={handleHomeClick} className="mt-4 block mx-auto">
                        <Home className="w-4 h-4 mr-2" />
                        Main Menu
                    </Button>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#131415] flex items-center justify-center">
                <div className="text-[#f5efe4] text-xl font-terminal">Loading recipe details...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#131415] flex items-center justify-center">
                <div className="text-[#f5efe4] text-xl font-terminal">
                    {error}
                    <Button variant="outline" onClick={handleHomeClick} className="mt-4 block mx-auto">
                        <Home className="w-4 h-4 mr-2" />
                        Main Menu
                    </Button>
                </div>
            </div>
        )
    }

    const { instructions, macros } = recipeDetails || {}

    // Parse instructions
    const instructionSteps = instructions
        ? instructions
            .replace(/<[^>]*>/g, "")
            .split(".")
            .filter((step) => step.trim())
            .map((step) => step.trim() + ".")
        : []

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

                {state?.allRecipes?.length > 1 && (
                    <div className="mb-8">
                        <RecipeNavigator allRecipes={state?.allRecipes || []} currentRecipe={recipe} />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column - Recipe Image and Info */}
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-title text-center mb-6 relative">
                            <span className="text-[#ce7c1c]">{recipe.title.split(" ")[0]}</span>{" "}
                            {recipe.title.split(" ").slice(1).join(" ")}
                            <div className="absolute -top-4 -right-4">
                                {recipe.veryHealthy && (
                                    <Badge className="bg-green-600 hover:bg-green-700 rounded-full px-3 py-1 text-xs font-bold">
                                        <Award className="w-3 h-3 mr-1" /> Healthy
                                    </Badge>
                                )}
                            </div>
                        </h1>
                        <div className="rounded-3xl overflow-hidden border-2 border-[#ce7c1c] shadow-xl shadow-[#ce7c1c]/20 transform hover:scale-[1.02] transition-all duration-300">
                            <img src={recipe.image || "/placeholder.svg"} alt={recipe.title} className="w-full h-auto object-cover" />
                        </div>

                        {/* Recipe Info */}
                        <div className="mt-6 border-2 border-gray-700 rounded-3xl p-4 bg-gray-900/50 shadow-lg transform hover:translate-y-[-5px] transition-all duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#ce7c1c]/20 p-2 rounded-full">
                                        <Clock className="w-5 h-5 text-[#ce7c1c]" />
                                    </div>
                                    <div className="font-terminal">
                                        <div className="text-sm text-gray-400">COOK TIME</div>
                                        <div>{recipe.readyInMinutes || "30"} mins</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#ce7c1c]/20 p-2 rounded-full">
                                        <Users className="w-5 h-5 text-[#ce7c1c]" />
                                    </div>
                                    <div className="font-terminal">
                                        <div className="text-sm text-gray-400">SERVINGS</div>
                                        <div>{recipe.servings || "4"}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nutrition Info */}
                        <div className="mt-6">
                            <h2 className="text-3xl mb-4 font-title text-center">NUTRITION INFO</h2>
                            <div className="border-2 border-gray-700 rounded-3xl p-6 bg-gray-900/50 grid grid-cols-2 gap-6 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
                                <div className="text-center transform hover:scale-105 transition-all duration-300">
                                    <div className="text-4xl font-title">{Math.round(macros?.calories || 0)}</div>
                                    <div className="text-xl font-title text-[#ce7c1c] mt-2">CALORIES</div>
                                </div>

                                <div className="text-center transform hover:scale-105 transition-all duration-300">
                                    <div className="text-4xl font-title">
                                        {Math.round(macros?.protein || 0)} <span className="text-3xl">G</span>
                                    </div>
                                    <div className="text-xl font-title text-[#ce7c1c] mt-2">PROTEIN</div>
                                </div>

                                <div className="text-center transform hover:scale-105 transition-all duration-300">
                                    <div className="text-4xl font-title">
                                        {Math.round(macros?.fat || 0)} <span className="text-3xl">G</span>
                                    </div>
                                    <div className="text-xl font-title text-[#ce7c1c] mt-2">FAT</div>
                                </div>

                                <div className="text-center transform hover:scale-105 transition-all duration-300">
                                    <div className="text-4xl font-title">
                                        {Math.round(macros?.carbs || 0)} <span className="text-3xl">G</span>
                                    </div>
                                    <div className="text-xl font-title text-[#ce7c1c] mt-2">CARBS</div>
                                </div>
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
                                    {recipe.usedIngredients.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-gray-500 font-terminal">NO MATCHING INGREDIENTS</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recipe.usedIngredients.map((ingredient, index) => (
                                                <div
                                                    key={index}
                                                    className="text-lg font-terminal p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors duration-200"
                                                >
                                                    {ingredient.name.toUpperCase()}
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
                                    {recipe.missedIngredients.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-gray-500 font-terminal">YOU HAVE ALL INGREDIENTS</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recipe.missedIngredients.map((ingredient, index) => (
                                                <div
                                                    key={index}
                                                    className="text-lg font-terminal p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors duration-200"
                                                >
                                                    {ingredient.name.toUpperCase()}
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

                {state?.allRecipes?.length > 1 && (
                    <div className="mt-10">
                        <RecipeNavigator allRecipes={state?.allRecipes || []} currentRecipe={recipe} />
                    </div>
                )}

                {/* Recommended Recipes Section */}
                <RecommendedRecipes
                    recipeType="meal"
                    userIngredients={userIngredients}
                    currentRecipeId={recipe.id}
                    allRecipes={state?.allRecipes || []}
                />
            </div>
        </div>
    )
}

export default RecipeDetails
