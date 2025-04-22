"use client"

import { useEffect, useState } from "react"
import {useLocation, useNavigate, useParams} from "react-router-dom"
import {ChevronLeft, Clock, Globe2, Scale, ShoppingCart} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import getDrinkDetails from "./getDrinkDetails.jsx"
import { getUSDAInfo } from "./GetUSDAInfo.jsx"
import RecipeNavigator from "./RecipeNavigator.jsx";

import {convertToGrams} from "@/nutrition.js";
import { clearNutritionCache } from "@/getGaladrielResponse.jsx";

const DrinkIngredientDetails = ({ ingredient, measure, usdaNutrients }) => {
   
    const drinkData = usdaNutrients[ingredient]
    
    return (
        <div className="bg-gray-700/30 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{ingredient}</span>
                <Badge variant="outline">{measure}</Badge>
            </div>
            {drinkData ? (
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                    <span>Calories: {drinkData.calories} kcal</span>
                    <span>Protein: {drinkData.protein}g</span>
                    <span>Fat: {drinkData.fat}g</span>
                    <span>Carbs: {drinkData.carbs}g</span>
                </div>
            ) : (
                <div className="text-sm text-gray-400">Nutritional info not available</div>
            )}
        </div>
    )
}

const DrinkDetails = () => {
    
    const { id } = useParams()
    const location = useLocation()
    const state = location.state
    const userIngredients = state?.userIngredients || [];
    const previousPath = state?.previousPath || '/';
    const recipe = state?.recipe;

    //console.log("DrinkDetails - allRecipes:", recipe);
    //console.log("DrinkDetails - currentRecipe:", currentDrink);

    // console.log("URL Params ID:", id);
    // console.log("State Data:", state);

    const [loading, setLoading] = useState(true)
    const [drinkDetails, setDrinkDetails] = useState(null)
    const [ingredients, setIngredients] = useState([])
    const [macros, setMacros] = useState({})
    const [totalNutrition, setTotalNutrition] = useState({
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
    })
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    //console.log("State", location.state)

    const getIngredients = (drink) => {
        const ingredients = []
        for (let i = 1; i <= 15; i++) {
            const ingredient = drink[`strIngredient${i}`]
            const measure = drink[`strMeasure${i}`]
            if (ingredient && ingredient.trim() !== "") {
                ingredients.push({ ingredient, measure: measure || "To taste" })
            }
        }
        return ingredients
    }

    const compareIngredients = (recipeIngredients, userIngredients) => {
        // Normalize user ingredients to lowercase and trim
        const userIngredientsNormalized = userIngredients.map(ingredient =>
            ingredient.toLowerCase().trim()
        );

        // Filter ingredients the user has
        const hasIngredients = recipeIngredients.filter(item =>
            userIngredientsNormalized.includes(item.ingredient.toLowerCase().trim())
        );

        // Filter ingredients the user is missing - IMPORTANT: ingredients should only be in one list
        const missingIngredients = recipeIngredients.filter(item =>
            !userIngredientsNormalized.includes(item.ingredient.toLowerCase().trim())
        );

        return { hasIngredients, missingIngredients };
    };
    

    useEffect(() => {
        const fetchDrinkData = async () => {
            const drinkId = id || (state?.drink?.idDrink);

            if (!drinkId) {
                setError("Invalid drink ID.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await getDrinkDetails(id);

                if (data?.drinks?.[0]) {
                    const drinkData = data.drinks[0];
                    setDrinkDetails(drinkData);
                    const ingredientsList = getIngredients(drinkData);
                    setIngredients(ingredientsList);

                    // Batch process ingredients
                    const nutritionPromises = ingredientsList.map(async (item) => {
                        try {
                            let macroData = await getUSDAInfo(item.ingredient);

                            // AI fallback for missing data
                            if (!macroData) {
                                // const aiResponse = await getGaladrielResponse(
                                //     `Provide nutrition for ${item.ingredient} (alcoholic: ${drinkData.strAlcoholic === "Alcoholic"}): ${item.measure} in JSON`,
                                //     " nutrition"
                                // );
                                const aiResponse = await getGaladrielResponse(
                                    `Provide nutrition facts for ${item.ingredient} per 100${item.measure.toLowerCase().includes('ml') ? 'ml' : 'g'} in JSON format: {cal, pro, fat, carb, size, unit}`,
                                    "nutrition"
                                );
                                try {
                                    macroData = JSON.parse(aiResponse);
                                    macroData.source = "AI";
                                } catch (e) {
                                    console.warn("Failed to parse AI drink nutrition", e);
                                }
                            }

                            return {
                                ingredient: item.ingredient,
                                measure: item.measure,
                                macroData: macroData || {
                                    calories: 0,
                                    protein: 0,
                                    fat: 0,
                                    carbs: 0,
                                    servingSize: 100,
                                    source: "unknown"
                                },
                                isAlcoholic: drinkData.strAlcoholic === "Alcoholic"
                            };
                        } catch (error) {
                            //console.error(`Error processing ${item.ingredient}:`, error);
                            return {
                                ingredient: item.ingredient,
                                measure: item.measure,
                                macroData: {
                                    calories: 0,
                                    protein: 0,
                                    fat: 0,
                                    carbs: 0,
                                    servingSize: 100,
                                    source: "error"
                                },
                                isAlcoholic: drinkData.strAlcoholic === "Alcoholic"
                            };
                        }
                    });

                    const nutritionResults = await Promise.all(nutritionPromises);
                    const macrosData = {};
                    let totalCals = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0, totalAlcohol = 0;

                    nutritionResults.forEach(result => {
                        const { ingredient, measure, macroData, isAlcoholic } = result;
                        macrosData[ingredient] = macroData;

                        const grams = convertToGrams(measure) || 0;
                        const servingSize = macroData.servingSize || 100;
                        const ratio = grams / servingSize;

                        totalProtein += (macroData.protein || 0) * ratio;
                        totalFat += (macroData.fat || 0) * ratio;
                        totalCarbs += (macroData.carbs || 0) * ratio;

                        // Alcohol: calories that exceed the known macros
                        if (isAlcoholic) {
                            const expectedMacroCals =
                                (macroData.protein || 0) * 4 +
                                (macroData.carbs || 0) * 4 +
                                (macroData.fat || 0) * 9;

                            const actualCals = (macroData.calories || 0) * ratio;
                            const alcoholCals = actualCals - expectedMacroCals;

                            if (alcoholCals > 10) {
                                const alcoholGrams = alcoholCals / 7;
                                totalAlcohol += alcoholGrams;
                                macrosData[ingredient].alcohol = alcoholGrams;
                            }
                        }

                        totalCals += (macroData.calories || 0) * ratio;
                    });

                    // Final calculations
                    const calculatedCals = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9) + (totalAlcohol * 7);

                    setMacros(macrosData);
                    setTotalNutrition({
                        calories: Math.round(totalCals > 0 ? totalCals : calculatedCals),
                        protein: Math.round(totalProtein),
                        fat: Math.round(totalFat),
                        carbs: Math.round(totalCarbs),
                        alcohol: Math.round(totalAlcohol)
                    });
                    
                } else {
                    setError("Drink details not found.");
                }
            } catch (error) {
                setError(error.message || "An error occurred while fetching drink details");
            } finally {
                setLoading(false);
            }
        }
        fetchDrinkData()
        
    }, [id,state])



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
                        <p className="mt-4 text-gray-400">Loading drink details...</p>
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
                            Back to Menu
                        </Button>
                        {state?.allRecipes?.length > 1 && (
                            <RecipeNavigator allRecipes={state?.allRecipes || []} currentRecipe={recipe} />
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!drinkDetails) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
                <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
                    <CardContent className="p-6">
                        <h1 className="text-2xl font-bold text-center mb-4">Drink not found</h1>
                        <p className="text-center text-gray-400 mb-6">
                            The drink you're looking for doesn't exist or has been removed.
                        </p>
                        <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back to Menu
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!state) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
                <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
                    <CardContent className="p-6">
                        <h1 className="text-2xl font-bold text-center mb-4">No State Data</h1>
                        <p className="text-center text-gray-400 mb-6">
                            Please navigate back and try again.
                        </p>
                        <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back to Menu
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { hasIngredients, missingIngredients } = compareIngredients(ingredients, userIngredients)

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Menu
                </Button>
                {location.state?.allRecipes?.length > 1 && (
                    <RecipeNavigator
                        allRecipes={location.state?.allRecipes || []}
                        currentRecipe={drinkDetails}
                    />
                )}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Drink Info */}
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold">{drinkDetails.strDrink}</h1>
                        <img
                            src={drinkDetails.strDrinkThumb || "/placeholder.svg"}
                            alt={drinkDetails.strDrink}
                            className="w-full aspect-video object-cover rounded-lg shadow-lg"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-4">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-sm text-gray-400">Type</div>
                                    <div className="font-medium">{drinkDetails.strAlcoholic || "Non-Alcoholic"}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-4">
                                <Globe2 className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-sm text-gray-400">Category</div>
                                    <div className="font-medium">{drinkDetails.strCategory || "Uncategorized"}</div>
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
                                            {totalNutrition.alcohol > 0 && (
                                                <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                                                    <div className="text-2xl font-bold">{totalNutrition.alcohol}g</div>
                                                    <div className="text-sm text-gray-400">Alcohol</div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="ingredients" className="mt-4">
                                        <ScrollArea className="h-[400px]">
                                            <div className="space-y-4">
                                                {ingredients.map((item, index) => (
                                                    <DrinkIngredientDetails
                                                        key={index}
                                                        ingredient={item.ingredient}
                                                        measure={item.measure}
                                                        usdaNutrients={macros}
                                                    />
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>


                {/* Current Ingredients */}
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

                {/* Shopping Cart */}
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
                            <div className="space-y-4">
                                {drinkDetails.strInstructions
                                    .split(". ")
                                    .filter((step) => step.trim())
                                    .map((step, index) => (
                                        <div key={index} className="pl-2">
                                            {index + 1}. {step.trim()}
                                        </div>
                                    ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                {location.state?.allRecipes?.length > 1 && (
                    <RecipeNavigator
                        allRecipes={location.state?.allRecipes || []}
                        currentRecipe={drinkDetails}
                    />
                )}
            </div>
            {/*<Button variant="destructive" onClick={clearNutritionCache}>*/}
            {/*    Clear Nutrition Cache*/}
            {/*</Button>*/}
        </div>
    )
}

export default DrinkDetails

