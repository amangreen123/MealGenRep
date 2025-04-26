import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { ChevronLeft, Globe2, UtensilsCrossed, Scale, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import GetMealDBRecipeDetails from "@/GetMealDBRecipeDetails.jsx"
import { getUSDAInfo } from "@/GetUSDAInfo.jsx"
import RecipeNavigator from "@/RecipeNavigator.jsx"
import { convertToGrams } from "@/nutrition.js"
import { batchGaladrielResponse, getGaladrielResponse} from "@/getGaladrielResponse.jsx"

// Helper functions for nutrition processing
function areAllNutrientsZero(data) {
    if (!data) return true
    return (
        (data.calories === 0 || isNaN(data.calories)) &&
        (data.protein === 0 || isNaN(data.protein)) &&
        (data.fat === 0 || isNaN(data.fat)) &&
        (data.carbs === 0 || isNaN(data.carbs))
    )
}

function normalizeNutritionData(response) {
    try {
        if (typeof response !== 'string') {
            // If it's somehow already an object, just use it directly
            return response;
        }

        // Parse text format using regex
        const calories = parseFloat(response.match(/Calories:\s*(\d+(?:\.\d+)?)/i)?.[1] || 0);
        const protein = parseFloat(response.match(/Protein:\s*(\d+(?:\.\d+)?)/i)?.[1] || 0);
        const fat = parseFloat(response.match(/Fat:\s*(\d+(?:\.\d+)?)/i)?.[1] || 0);
        const carbs = parseFloat(response.match(/Carbs:\s*(\d+(?:\.\d+)?)/i)?.[1] || 0);
        const servingMatch = response.match(/Serving:\s*(\d+)\s*([a-z]+)/i);

        return {
            calories: calories,
            protein: protein,
            fat: fat,
            carbs: carbs,
            servingSize: servingMatch ? parseFloat(servingMatch[1]) : 100,
            servingUnit: servingMatch ? servingMatch[2] : 'g',
            source: 'AI'
        };
    } catch (e) {
        console.error('Failed to normalize nutrition data:', e);
        return getManualFallback();
    }
}

function validateNutritionValues(values) {
    const MAX_VALUES = {
        calories: 2000,  // per ingredient
        protein: 200,
        fat: 200,
        carbs: 200
    };

    return {
        calories: Math.min(values.calories, MAX_VALUES.calories),
        protein: Math.min(values.protein, MAX_VALUES.protein),
        fat: Math.min(values.fat, MAX_VALUES.fat),
        carbs: Math.min(values.carbs, MAX_VALUES.carbs)
    };
}

function getManualFallback(ingredient = '') {
    const MANUAL_FALLBACKS = {
        'garlic': { calories: 149, protein: 6.4, fat: 0.5, carbs: 33.1, servingSize: 100, servingUnit: 'g' },
        'olive oil': { calories: 884, protein: 0, fat: 100, carbs: 0, servingSize: 100, servingUnit: 'g' },
        'chicken': { calories: 239, protein: 27, fat: 14, carbs: 0, servingSize: 100, servingUnit: 'g' },
        'tomato': { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, servingSize: 100, servingUnit: 'g' },
        'onion': { calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3, servingSize: 100, servingUnit: 'g' }
    }

    const normalizedIngredient = ingredient.toLowerCase().trim()
    return MANUAL_FALLBACKS[normalizedIngredient] || {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        servingSize: 100,
        servingUnit: 'g',
        source: 'fallback'
    }
}

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
    const { state } = useLocation()
    const previousPath = state?.previousPath || '/'
    const userIngredients = state?.userIngredients || []

    const handleBackClick = () => {
        navigate(previousPath)
    }

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

    const compareIngredients = (recipeIngredients, userIngredients) => {
        const userIngredientsNormalized = userIngredients.map(ingredient =>
            ingredient.toLowerCase().trim()
        )
        const hasIngredients = recipeIngredients.filter(item =>
            userIngredientsNormalized.includes(item.ingredient.toLowerCase().trim())
        )
        const missingIngredients = recipeIngredients.filter(item =>
            !userIngredientsNormalized.includes(item.ingredient.toLowerCase().trim())
        )
        return { hasIngredients, missingIngredients }
    }
    

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

                    const nutritionPromises = ingredients.map(async (item) => {
                        try {
                            //console.log(`Processing: ${item.ingredient} (${item.measure})`)

                            // 1. Try USDA API first
                            let macroData = await getUSDAInfo(item.ingredient)
                            const grams = convertToGrams(item.measure) || 0
                            console.log('Initial USDA data:', macroData)

                            // 2. Enhanced fallback system
                            if (!macroData || areAllNutrientsZero(macroData)) {
                                console.warn(`Falling back to AI for ${item.ingredient}`)

                                const measureInfo = item.measure ? ` (${item.measure})` : ''
                                const aiPrompt = `Provide COMPLETE nutrition facts for ${item.ingredient}${measureInfo} as VALID JSON: {
                  "cal":number, "pro":number, "fat":number, "carb":number,
                  "size":number, "unit":"g"|"ml", "source":"string"
                }`

                                try {
                                    const aiResponse = await getGaladrielResponse(aiPrompt, "nutrition")
                                    console.log('Raw AI response:', aiResponse)
                                    macroData = normalizeNutritionData(aiResponse)

                                    if (areAllNutrientsZero(macroData)) {
                                        console.warn('AI returned zeros - using manual fallback')
                                        macroData = getManualFallback(item.ingredient)
                                    }
                                } catch (aiError) {
                                    console.error('AI fallback failed:', aiError)
                                    macroData = getManualFallback(item.ingredient)
                                }
                            }

                            // 3. Calculate ratios with validation
                            const servingSize = macroData.servingSize || 100
                            let ratio = grams > 0 ? (grams / servingSize) : 0

                            if (ratio > 100 || ratio < 0.01) {
                                console.warn(`Unrealistic ratio ${ratio} for ${item.ingredient}, using 1`)
                                ratio = 1
                            }

                            console.log('Final nutrition for', item.ingredient, {
                                ...macroData,
                                calculated: {
                                    calories: macroData.calories * ratio,
                                    protein: macroData.protein * ratio,
                                    fat: macroData.fat * ratio,
                                    carbs: macroData.carbs * ratio
                                }
                            })

                            return {
                                ingredient: item.ingredient,
                                measure: item.measure,
                                macroData,
                                ratio
                            }

                        } catch (error) {
                            console.error(`Error processing ${item.ingredient}:`, error)
                            return {
                                ingredient: item.ingredient,
                                measure: item.measure,
                                macroData: getManualFallback(item.ingredient),
                                ratio: 0
                            }
                        }
                    })

                    const nutritionResults = await Promise.all(nutritionPromises);
                    const macrosData = {};
                    let totalCals = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0;

                    nutritionResults.forEach(result => {
                        const { ingredient, macroData, ratio } = result;
                        macrosData[ingredient] = macroData;

                        const protein = (macroData.protein || 0) * ratio;
                        const fat = (macroData.fat || 0) * ratio;
                        const carbs = (macroData.carbs || 0) * ratio;

                        totalProtein += protein;
                        totalFat += fat;
                        totalCarbs += carbs;
                        totalCals += macroData.calories > 0
                            ? macroData.calories * ratio
                            : (protein * 4) + (carbs * 4) + (fat * 9);
                    });

                    const calculatedCals = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);

                    if (Math.abs(totalCals - calculatedCals) > 100) {
                        console.warn(`Recalculating calories from macros. 
                         API: ${totalCals} vs Calculated: ${calculatedCals}`);
                        totalCals = calculatedCals;
                    }

                    setMacros(macrosData)

                    if (totalCals <= 0 && totalProtein <= 0 && totalFat <= 0 && totalCarbs <= 0) {
                        console.warn("No valid nutrition data found");
                        setTotalNutrition({calories: 'N/A', protein: 'N/A', fat: 'N/A', carbs: 'N/A' });
                        
                    } else {
                        setTotalNutrition({
                            calories: Math.round(totalCals),
                            protein: Math.round(totalProtein),
                            fat: Math.round(totalFat),
                            carbs: Math.round(totalCarbs)
                        });
                    }

                } else {
                    setError("Recipe details not found.")
                }
            } catch (error) {
                setError(error.message || "Error fetching recipe details")
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
                <Button variant="outline" onClick={handleBackClick} className="mb-4">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Recipes
                </Button>
                {state?.allRecipes?.length > 1 && (
                    <RecipeNavigator allRecipes={state?.allRecipes || []} currentRecipe={recipeDetails} />
                )}
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
                                                {ingredients.map((item, index) => {
                                                    const macroData = macros[item.ingredient] || {
                                                        calories: 0,
                                                        protein: 0,
                                                        fat: 0,
                                                        carbs: 0,
                                                        servingSize: 100,
                                                        servingUnit: "g"
                                                    };
                                                    const grams = convertToGrams(item.measure) || 0;
                                                    const ratio = grams / (macroData.servingSize || 100);

                                                    return (
                                                        <div key={index} className="bg-gray-700/30 p-3 rounded-lg">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-medium">{item.ingredient}</span>
                                                                <Badge variant="outline">{item.measure}</Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                                                                <span>Calories: {macroData.calories ? Math.round(macroData.calories * ratio) : 'N/A'} kcal</span>
                                                                <span>Protein: {macroData.protein ? (macroData.protein * ratio).toFixed(1) : 'N/A'}g</span>
                                                                <span>Fat: {macroData.fat ? (macroData.fat * ratio).toFixed(1) : 'N/A'}g</span>
                                                                <span>Carbs: {macroData.carbs ? (macroData.carbs * ratio).toFixed(1) : 'N/A'}g</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
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
                            <p className="text-gray-400">Here's what you'll need to buy:</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {missingIngredients.map((item, index) => (
                                <div key={index} className="bg-gray-700/30 p-3 rounded-lg">
                                    <div className="font-medium mb-1">{item.ingredient}</div>
                                    <Badge variant="outline">{item.measure}</Badge>
                                </div>
                            ))}
                        </div>
                        {missingIngredients.length === 0 && (
                            <div className="text-center py-4 text-gray-400">
                                You have all ingredients for this recipe!
                            </div>
                        )}
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
                {state?.allRecipes?.length > 1 && (
                    <RecipeNavigator allRecipes={state?.allRecipes || []} currentRecipe={recipeDetails} />
                )}
            </div>
            {/*<Button variant="destructive" onClick={clearNutritionCache}>*/}
            {/*    Clear Nutrition Cache*/}
            {/*</Button>*/}
        </div>
    )
}

export default MealDBRecipeDetails

