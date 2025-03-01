"use client"

import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { ChevronLeft, Clock, Users, Utensils, Scale, Globe2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import getInstructions from "./GetInstructions.jsx"


const IngredientDetail = ({ ingredient, usdaNutrients }) => {

    const nutrientData = usdaNutrients[ingredient.name]

    return (
        <div className="bg-gray-700/30 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{ingredient.name}</span>
                <Badge variant="outline">
                    {ingredient.amount} {ingredient.unit}
                </Badge>
            </div>
            {nutrientData ? (
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                    <span>Calories: {nutrientData.calories} kcal</span>
                    <span>Protein: {nutrientData.protein}g</span>
                    <span>Fat: {nutrientData.fat}g</span>
                    <span>Carbs: {nutrientData.carbs}g</span>
                </div>
            ) : (
                <div className="text-sm text-gray-400">Nutritional info not available</div>
            )}
        </div>
    )
}


const NutritionTabs = ({ recipe, recipeDetails }) => {
    const { macros, usdaNutrients } = recipeDetails
    const allIngredients = [...(recipe.usedIngredients || []), ...(recipe.missedIngredients || [])]

    return (
        <Tabs defaultValue="summary">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{Math.round(macros.calories)}</div>
                        <div className="text-sm text-gray-400">Calories</div>
                    </div>
                    <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{Math.round(macros.protein)}g</div>
                        <div className="text-sm text-gray-400">Protein</div>
                    </div>
                    <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{Math.round(macros.fat)}g</div>
                        <div className="text-sm text-gray-400">Fat</div>
                    </div>
                    <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{Math.round(macros.carbs)}g</div>
                        <div className="text-sm text-gray-400">Carbs</div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="ingredients" className="mt-4">
                <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                        {allIngredients.map((ingredient, index) => (
                            <IngredientDetail
                                key={index}
                                ingredient={ingredient}
                                usdaNutrients={usdaNutrients}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
    )
}

const RecipeDetails = () => {
    const { state } = useLocation()
    const recipe = state?.recipe

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

    if (!recipe) return <RecipeNotFound />
    if (loading) return <LoadingState />
    if (error) return <ErrorState error={error} />

    const { instructions, macros } = recipeDetails || {}

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <BackButton />
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left column */}
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold">{recipe.title}</h1>
                        <img
                            src={recipe.image || "/placeholder.svg"}
                            alt={recipe.title}
                            className="w-full aspect-video object-cover rounded-lg shadow-lg"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-4">
                                <Clock className="w-5 h-5 text-gray-400"/>
                                <div>
                                    <div className="text-sm text-gray-400">Cook Time</div>
                                    <div className="font-medium">{recipe.readyInMinutes || "N/A"} mins</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-4">
                                <Users className="w-5 h-5 text-gray-400"/>
                                <div>
                                    <div className="text-sm text-gray-400">Servings</div>
                                    <div className="font-medium">{recipe.servings || "N/A"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="w-5 h-5"/>
                                    Nutrition Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <NutritionTabs recipe={recipe} recipeDetails={recipeDetails}/>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {instructions && (
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px]">
                                <ol className="list-decimal list-inside space-y-4">
                                {instructions
                                        .replace(/<[^>]*>/g, '')
                                        .split('.')
                                        .filter(step => step.trim())
                                        .map((step, index) => (
                                            <li key={index} className="pl-2">
                                                {step.trim()}
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

const LoadingState = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-10 w-24" />
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="w-full aspect-video rounded-lg" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-20 rounded-lg" />
                        <Skeleton className="h-20 rounded-lg" />
                    </div>
                </div>
                <Skeleton className="h-[400px] rounded-lg" />
            </div>
            <Skeleton className="h-[300px] rounded-lg" />
        </div>
    </div>
)

const RecipeNotFound = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
            <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-center mb-4">Recipe not found</h1>
                <p className="text-center text-gray-400 mb-6">
                    The recipe you're looking for doesn't exist or has been removed.
                </p>
                <BackButton className="w-full" />
            </CardContent>
        </Card>
    </div>
)

const ErrorState = ({ error }) => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
            <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-center mb-4">Error</h1>
                <p className="text-center text-red-500 mb-6">{error}</p>
                <BackButton className="w-full" />
            </CardContent>
        </Card>
    </div>
)

const BackButton = ({ className = "" }) => (
    <Button variant="outline" onClick={() => window.history.back()} className={className}>
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back to Recipes
    </Button>
)

export default RecipeDetails