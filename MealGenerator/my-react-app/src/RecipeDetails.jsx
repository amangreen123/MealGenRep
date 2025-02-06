import React, { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { ChevronLeft, Clock, Users, Utensils } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import getInstructions from "./GetInstructions.jsx"
import IngredientAmount from "./IngredientAmount"

const IngredientList = ({ ingredients, title }) => {
    return (
        <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {ingredients?.length > 0 ? (
                    <ul className="space-y-2">
                        {ingredients.map((ingredient) => (
                            <li key={ingredient.id} className="flex items-center">
                                <Badge variant="outline" className="mr-2">
                                    {ingredient.amount} {ingredient.unit}
                                </Badge>
                                {ingredient.name}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400">No ingredients found for this recipe.</p>
                )}
            </CardContent>
        </Card>
    );
};

const RecipeDetails = () => {
    const { state } = useLocation()
    const recipe = state?.recipe

    const [loading, setLoading] = useState(true)
    const [recipeDetails, setRecipeDetails] = useState(null)
    const [error, setError] = useState(null)

    console.log("Recipe data from location:", recipe);

    useEffect(() => {
        const fetchRecipeData = async () => {
            if (!recipe) return
            try {
                setLoading(true)
                const data = await getInstructions(recipe.id)
                console.log("API Response:", data);
                setRecipeDetails(data)
            } catch (error) {
                setError(error.message || "An error occurred while fetching recipe details")
            } finally {
                setLoading(false)
            }
        }

        fetchRecipeData()
    }, [recipe])

    if (!recipe) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
                <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
                    <CardContent className="p-6">
                        <h1 className="text-2xl font-bold text-center mb-4">Recipe not found</h1>
                        <p className="text-center text-gray-400">
                            The recipe you're looking for doesn't exist or has been removed.
                        </p>
                        <Button className="w-full mt-4" variant="outline" onClick={() => window.history.back()}>
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                        <h1 className="text-2xl font-bold text-center mb-4">Loading Recipe Details</h1>
                        <p className="text-center text-gray-400">Please wait while we fetch the recipe information...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
                <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
                    <CardContent className="p-6">
                        <h1 className="text-2xl font-bold text-center mb-4">Error</h1>
                        <p className="text-center text-red-500">{error}</p>
                        <Button className="w-full mt-4" variant="outline" onClick={() => window.history.back()}>
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { instructions, macros } = recipeDetails || {}

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button variant="outline" onClick={() => window.history.back()} className="mb-4">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Recipes
                </Button>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-4">{recipe.title}</h1>
                        <img
                            src={recipe.image || "/placeholder.svg"}
                            alt={recipe.title}
                            className="w-full h-64 object-cover rounded-lg shadow-lg mb-4"
                        />
                        <div className="flex space-x-4 mb-4">
                            <div className="flex items-center">
                                <Clock className="w-5 h-5 mr-2" />
                                <span>{recipe.readyInMinutes || "N/A"} mins</span>
                            </div>
                            <div className="flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                <span>{recipe.servings || "N/A"} servings</span>
                            </div>
                            <div className="flex items-center">
                                <Utensils className="w-5 h-5 mr-2" />
                                <span>{recipe.dishTypes?.join(", ") || "N/A"}</span>
                            </div>
                        </div>
                        {macros && (
                            <Card className="bg-gray-800/50 border-gray-700 mb-4">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Nutrition Facts</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>Calories: {macros.calories}</div>
                                        <div>Carbs: {macros.carbs}</div>
                                        <div>Fat: {macros.fat}</div>
                                        <div>Protein: {macros.protein}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-4">
                        <IngredientList ingredients={recipe.usedIngredients}  title="Ingredients You Have" />
                        <IngredientList ingredients={recipe.missedIngredients} title="Missing Ingredients" />
                    </div>
                </div>

                {instructions && (
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px] w-full pr-4">
                                <ol className="list-decimal list-inside space-y-2">
                                    {instructions
                                        .split("\n")
                                        .filter((step) => step.trim() !== "")
                                        .map((step, index) => (
                                            <li key={index} className="pl-2">
                                                {step}
                                            </li>
                                        ))}
                                </ol>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default RecipeDetails
