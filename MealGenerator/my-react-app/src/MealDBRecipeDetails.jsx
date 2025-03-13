"use client"

import { useEffect, useState } from "react"
import {useLocation, useNavigate, useParams} from "react-router-dom"
import { ChevronLeft, Globe2, UtensilsCrossed, Scale, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GetMealDBRecipeDetails from "@/GetMealDBRecipeDetails.jsx"
import { getUSDAInfo } from "@/GetUSDAInfo.jsx"

const MealDBRecipeDetails = () => {
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [recipeDetails, setRecipeDetails] = useState(null)
    const [macros, setMacros] = useState({})
    const [totalNutrition, setTotalNutrition] = useState({
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
    })
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const {state} = useLocation()
    const userIngredients = state?.userIngredients || [];


    const getIngredients = (meal) => {
        const ingredients = []
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`]
            const measure = meal[`strMeasure${i}`]
            if (ingredient && ingredient.trim() !== "") {
                ingredients.push({ ingredient, measure })
            }
        }
        return ingredients
    }

    //Compares the user ingredients with the recipe ingredients
    const compareIngredients = (recipeIngredients, userIngredients) => {
        const userIngredientsLower = userIngredients.map((ingredient) => ingredient.toLowerCase());
        const hasIngredients = recipeIngredients.filter((item) =>
            userIngredientsLower.includes(item.ingredient.toLowerCase())
        );
        const missingIngredients = recipeIngredients.filter(
            (item) => !userIngredientsLower.includes(item.ingredient.toLowerCase())
        );
        return { hasIngredients, missingIngredients };
    };




    useEffect(() => {
        const fetchRecipeData = async () => {
            if (!id) {
                setError("Invalid recipe ID.")
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const data = await GetMealDBRecipeDetails(id)

                if (data?.meals?.[0]) {
                    const recipeData = data.meals[0]
                    setRecipeDetails(recipeData)

                    const ingredients = getIngredients(recipeData)
                    const macrosData = {}
                    let totalCals = 0,
                        totalProtein = 0,
                        totalFat = 0,
                        totalCarbs = 0

                    for (const item of ingredients) {
                        const macroData = await getUSDAInfo(item.ingredient)

                        if (macroData) {
                            macrosData[item.ingredient] = macroData
                            totalCals += macroData.calories || 0
                            totalProtein += macroData.protein || 0
                            totalFat += macroData.fat || 0
                            totalCarbs += macroData.carbs || 0
                        }
                    }

                    setMacros(macrosData)
                    setTotalNutrition({
                        calories: Math.round(totalCals),
                        protein: Math.round(totalProtein),
                        fat: Math.round(totalFat),
                        carbs: Math.round(totalCarbs),
                    })
                } else {
                    setError("Recipe details not found.")
                }
            } catch (error) {
                setError(error.message || "An error occurred while fetching recipe details")
            } finally {
                setLoading(false)
            }
        }

        fetchRecipeData()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
                <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-gray-700/50 rounded w-3/4 mx-auto" />
                            <div className="h-64 bg-gray-700/50 rounded" />
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-700/50 rounded w-1/2 mx-auto" />
                                <div className="h-4 bg-gray-700/50 rounded w-3/4 mx-auto" />
                            </div>
                        </div>
                        <p className="mt-4 text-gray-400">Loading recipe details...</p>
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
                        <p className="text-center text-red-500 mb-6">{error}</p>
                        <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back to Recipes
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!recipeDetails) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
                <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
                    <CardContent className="p-6">
                        <h1 className="text-2xl font-bold text-center mb-4">Recipe not found</h1>
                        <p className="text-center text-gray-400 mb-6">
                            The recipe you're looking for doesn't exist or has been removed.
                        </p>
                        <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back to Recipes
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const ingredients = getIngredients(recipeDetails)
    const { hasIngredients, missingIngredients } = compareIngredients(ingredients, userIngredients)

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Recipes
                </Button>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Recipe Info */}
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold">{recipeDetails.strMeal}</h1>
                        <img
                            src={recipeDetails.strMealThumb || "/placeholder.svg"}
                            alt={recipeDetails.strMeal}
                            className="w-full aspect-video object-cover rounded-lg shadow-lg"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-4">
                                <UtensilsCrossed className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-sm text-gray-400">Category</div>
                                    <div className="font-medium">{recipeDetails.strCategory}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-4">
                                <Globe2 className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-sm text-gray-400">Cuisine</div>
                                    <div className="font-medium">{recipeDetails.strArea}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nutrition & Ingredients */}
                    <div className="space-y-6">
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="w-5 h-5" />
                                    Nutrition Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="summary">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="summary">Summary</TabsTrigger>
                                        <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="summary" className="mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                                                <div className="text-2xl font-bold">{totalNutrition.calories}</div>
                                                <div className="text-sm text-gray-400">Calories</div>
                                            </div>
                                            <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                                                <div className="text-2xl font-bold">{totalNutrition.protein}g</div>
                                                <div className="text-sm text-gray-400">Protein</div>
                                            </div>
                                            <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                                                <div className="text-2xl font-bold">{totalNutrition.fat}g</div>
                                                <div className="text-sm text-gray-400">Fat</div>
                                            </div>
                                            <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                                                <div className="text-2xl font-bold">{totalNutrition.carbs}g</div>
                                                <div className="text-sm text-gray-400">Carbs</div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="ingredients" className="mt-4">
                                        <ScrollArea className="h-[400px]">
                                            <div className="space-y-4">
                                                {ingredients.map((item, index) => (
                                                    <div key={index} className="bg-gray-700/30 p-3 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium">{item.ingredient}</span>
                                                            <Badge variant="outline">{item.measure}</Badge>
                                                        </div>
                                                        {macros[item.ingredient] ? (
                                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                                                                <span>Calories: {macros[item.ingredient].calories} kcal</span>
                                                                <span>Protein: {macros[item.ingredient].protein}g</span>
                                                                <span>Fat: {macros[item.ingredient].fat}g</span>
                                                                <span>Carbs: {macros[item.ingredient].carbs}g</span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-gray-400">Loading nutritional info...</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Ingredients You Have */}
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            Ingredients You Have
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4">
                            <p className="text-gray-400">Here's what you already have:</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {hasIngredients.map((item, index) => (
                                <div key={index} className="bg-gray-700/30 p-3 rounded-lg">
                                    <div className="font-medium mb-1">{item.ingredient}</div>
                                    <Badge variant="outline">{item.measure}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>



                {/* Shopping List Section */}
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            Shopping List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4">
                            <p className="text-gray-400">Here's what you'll need to make this recipe:</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {ingredients.map((item, index) => (
                                <div key={index} className="bg-gray-700/30 p-3 rounded-lg">
                                    <div className="font-medium mb-1">{item.ingredient}</div>
                                    <Badge variant="outline">{item.measure}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>


                {/* Instructions */}
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <ol className="list-decimal list-inside space-y-4">
                                {recipeDetails.strInstructions
                                    .split("\r\n")
                                    .filter((step) => step.trim())
                                    .map((step, index) => (
                                        <li key={index} className="pl-2">
                                            {step.trim()}
                                        </li>
                                    ))}
                            </ol>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default MealDBRecipeDetails

