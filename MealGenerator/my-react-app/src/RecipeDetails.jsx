"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronLeft, Clock, Users, Scale, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import getInstructions from "./GetInstructions.jsx"
import RecipeNavigator from "@/RecipeNavigator.jsx"

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
                            <IngredientDetail key={index} ingredient={ingredient} usdaNutrients={usdaNutrients} />
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
    )
}

const RecipeDetails = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const previousPath = state?.previousPath || '/';
    const recipe = state?.recipe;

    const [loading, setLoading] = useState(true);
    const [recipeDetails, setRecipeDetails] = useState(null);
    const [error, setError] = useState(null);

    const handleBackClick = () => {
        navigate(previousPath);
    };

    useEffect(() => {
        const fetchRecipeData = async () => {
            if (!recipe) return;
            try {
                setLoading(true);
                const data = await getInstructions(recipe.id);
                setRecipeDetails(data);
            } catch (error) {
                setError(error.message || "An error occurred while fetching recipe details");
            } finally {
                setLoading(false);
            }
        };

        fetchRecipeData();
    }, [recipe]);

    if (!recipe) return <RecipeNotFound navigate={navigate} />;
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} navigate={navigate} previousPath={previousPath} />;

    const { instructions, macros } = recipeDetails || {};

    // BackButton component defined inside RecipeDetails to access navigate and previousPath
    const BackButton = ({ className = "" }) => (
        <Button variant="outline" onClick={handleBackClick} className={className}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Recipes
        </Button>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <BackButton />
                {state?.allRecipes?.length > 1 && (
                    <RecipeNavigator allRecipes={state?.allRecipes || []} currentRecipe={recipe} />
                )}
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
                                <Clock className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-sm text-gray-400">Cook Time</div>
                                    <div className="font-medium">{recipe.readyInMinutes || "N/A"} mins</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-4">
                                <Users className="w-5 h-5 text-gray-400" />
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
                                    <Scale className="w-5 h-5" />
                                    Nutrition Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <NutritionTabs recipe={recipe} recipeDetails={recipeDetails} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Ingredient You Have Section */}
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Ingredients You Have
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4">
                            <p className="text-gray-400">Here's what you have:</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {recipe.usedIngredients.map((ingredient, index) => (
                                <div key={index} className="bg-gray-700/30 p-3 rounded-lg">
                                    <div className="font-medium mb-1">{ingredient.name}</div>
                                    <Badge variant="outline">
                                        {ingredient.amount} {ingredient.unit}
                                    </Badge>
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
                            {recipe.missedIngredients.map((ingredient, index) => (
                                <div key={index} className="bg-gray-700/30 p-3 rounded-lg">
                                    <div className="font-medium mb-1">{ingredient.name}</div>
                                    <Badge variant="outline">
                                        {ingredient.amount} {ingredient.unit}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {instructions && (
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px]">
                                <ol className="list-decimal list-inside space-y-4">
                                    {instructions
                                        .replace(/<[^>]*>/g, "")
                                        .split(".")
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
                )}
                {state?.allRecipes?.length > 1 && (
                    <RecipeNavigator allRecipes={state?.allRecipes || []} currentRecipe={recipe} />
                )}
            </div>
        </div>
    );
};

const LoadingState = () => (
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
);

const RecipeNotFound = ({ navigate }) => {
    const handleBackClick = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
            <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
                <CardContent className="p-6">
                    <h1 className="text-2xl font-bold text-center mb-4">Recipe not found</h1>
                    <p className="text-center text-gray-400 mb-6">
                        The recipe you're looking for doesn't exist or has been removed.
                    </p>
                    <Button variant="outline" onClick={handleBackClick} className="w-full">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to Recipes
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

const ErrorState = ({ error, navigate, previousPath }) => {
    const handleBackClick = () => {
        navigate(previousPath || '/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
            <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
                <CardContent className="p-6">
                    <h1 className="text-2xl font-bold text-center mb-4">Error</h1>
                    <p className="text-center text-red-500 mb-6">{error}</p>
                    <Button variant="outline" onClick={handleBackClick} className="w-full">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to Recipes
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default RecipeDetails;