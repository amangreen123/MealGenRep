"use client";

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import GetMealDBRecipeDetails from "@/GetMealDBRecipeDetails.jsx";

const MealDBIngredientList = ({ meal, title }) => {

    const getIngredients = (meal) => {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== "") {
                ingredients.push({ ingredient, measure });
            }
        }
        return ingredients;
    };

    const ingredients = getIngredients(meal);

    return (
        <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{title || "Ingredients"}</CardTitle>
            </CardHeader>
            <CardContent>
                {ingredients.length > 0 ? (
                    <ul className="space-y-2">
                        {ingredients.map((item, index) => (
                            <li key={index} className="flex items-center">
                                <Badge variant="outline" className="mr-2">
                                    {item.measure}
                                </Badge>
                                {item.ingredient}
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

const MealDBRecipeDetails = () => {
    const { id } = useParams(); // Extract id from URL
    const [loading, setLoading] = useState(true);
    const [recipeDetails, setRecipeDetails] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Use useNavigate for navigation

    useEffect(() => {
        const fetchRecipeData = async () => {
            console.log("Calling GetMealDBRecipeDetails with ID:", id); // CHECK IF THIS RUNS
            if (!id) {
                setError("Invalid recipe ID.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await GetMealDBRecipeDetails(id);
                console.log("API Response Data:", data); // CHECK THE API RESPONSE
                if (data && data.meals && data.meals.length > 0) {
                    setRecipeDetails(data.meals[0]);
                } else {
                    setError("Recipe details not found.");
                }
            } catch (error) {
                setError(error.message || "An error occurred while fetching recipe details");
            } finally {
                setLoading(false);
            }
        };

        fetchRecipeData();
    }, [id]); // React to changes in `id` (URL parameter)

    const handleBack = () => {
        navigate(-1); // Navigate back
    };

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState error={error} />;
    }

    if (!recipeDetails) {
        return <RecipeNotFound />; // If recipeDetails is null, show RecipeNotFound
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <BackButton onClick={handleBack} />
                <div className="grid md:grid-cols-2 gap-6">
                    <RecipeMainInfo recipe={recipeDetails} />
                    <MealDBIngredientList meal={recipeDetails} />
                </div>
                <InstructionsCard instructions={recipeDetails.strInstructions} />
            </div>
        </div>
    );
};

const RecipeNotFound = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
            <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-center mb-4">Recipe not found</h1>
                <p className="text-center text-gray-400">
                    The recipe you're looking for doesn't exist or has been removed.
                </p>
                <BackButton className="w-full mt-4" />
            </CardContent>
        </Card>
    </div>
);

const LoadingState = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-center mb-4">Loading Recipe Details</h1>
                <p className="text-center text-gray-400">Please wait while we fetch the recipe information...</p>
            </CardContent>
        </Card>
    </div>
);

const ErrorState = ({ error }) => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 w-full max-w-md">
            <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-center mb-4">Error</h1>
                <p className="text-center text-red-500">{error}</p>
                <BackButton className="w-full mt-4" />
            </CardContent>
        </Card>
    </div>
);

const BackButton = ({ className = "mb-4", onClick }) => (
    <Button variant="outline" onClick={onClick} className={className}>
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back to Recipes
    </Button>
);

const RecipeMainInfo = ({ recipe }) => (
    <div>
        {recipe ? (
            <>
                <h1 className="text-3xl font-bold mb-4">{recipe.strMeal}</h1>
                <img
                    src={recipe.strMealThumb || "/placeholder.svg"}
                    alt={recipe.strMeal}
                    className="w-full h-64 object-cover rounded-lg shadow-lg mb-4"
                />
                <div className="flex space-x-4 mb-4">
                    <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        <span>Prep time: N/A</span>
                    </div>
                    <div className="flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        <span>Servings: N/A</span>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">Category</h2>
                    <p>{recipe.strCategory}</p>
                </div>
                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Area</h2>
                    <p>{recipe.strArea}</p>
                </div>
            </>
        ) : (
            <p>Loading recipe information...</p>
        )}
    </div>
);

const InstructionsCard = ({ instructions }) => {
    const cleanInstructions = instructions
        ? instructions.split("\r\n").filter((step) => step.trim() !== "")
        : [];

    return (
        <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] w-full pr-4">
                    <ol className="list-decimal list-inside space-y-2">
                        {cleanInstructions.map((step, index) => (
                            <li key={index} className="pl-2">
                                {step.trim()}
                            </li>
                        ))}
                    </ol>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default MealDBRecipeDetails;
