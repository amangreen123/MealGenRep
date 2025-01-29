import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import useFetchMeals from "./getMeals.jsx";

import {
    ChefHat,
    Search,
    Egg,
    CroissantIcon as Bread,
    Carrot,
    Beef,
    Fish,
    ChevronsUpIcon as Cheese,
    Apple,
    Milk,
} from "lucide-react";
import RecipeBuilder from "@/RecipeBuilder.jsx";

const popularIngredients = [
    { name: "Eggs", icon: Egg },
    { name: "Bread", icon: Bread },
    { name: "Vegetables", icon: Carrot },
    { name: "Beef", icon: Beef },
    { name: "Fish", icon: Fish },
    { name: "Cheese", icon: Cheese },
    { name: "Fruit", icon: Apple },
    { name: "Milk", icon: Milk },
];

const UserInput = () => {
    const [inputString, setInputString] = useState("");
    const [ingredients, setIngredients] = useState([]);
    const { recipes, error, loading, getRecipes } = useFetchMeals();
    const navigate = useNavigate();

    const handleInputChange = ({ target: { value } }) => {
        setInputString(value);
    };

    const handleAddIngredient = async () => {
        const newIngredients = inputString
            .split(" ")
            .map((item) => item.trim())
            .filter((item) => item !== "");

        const uniqueIngredients = newIngredients.filter(
            (newIngr) => !ingredients.some((existingIngr) => existingIngr.toLowerCase() === newIngr.toLowerCase())
        );

        if (uniqueIngredients.length === 0) {
            alert("No new ingredients to add or all ingredients already exist");
            return;
        }

        setIngredients([...ingredients, ...uniqueIngredients]);
        setInputString("");
    };

    const handleSearch = () => {
        if (ingredients.length > 0) {
            getRecipes(ingredients);
        }
    };

    const handleQuickSearch = (ingredient) => {
        getRecipes([ingredient]);
    };

    const clickHandler = (recipe) => {
        navigate(`/${recipe.id}`, { state: { recipe } });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-center mb-8">Meal Planner</h1>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-6 h-6" />
                                Look for Recipes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Enter ingredients (space separated)"
                                    value={inputString}
                                    onChange={handleInputChange}
                                    className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleAddIngredient}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Add Ingredients
                                    </Button>
                                    <Button
                                        onClick={handleSearch}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex-1"
                                    >
                                        Generate Recipes
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-xl font-semibold mb-2">Recipes</h3>
                                {loading && <p className="text-gray-400">Waiting for recipes...</p>}
                                {error && <p className="text-red-500">Error: Unable to fetch recipes. Please try again later.</p>}
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {recipes.map((recipe) => (
                                        <Card
                                            key={recipe.id}
                                            className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
                                            onClick={() => clickHandler(recipe)}
                                        >
                                            <CardHeader>
                                                <CardTitle>{recipe.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <img
                                                    src={recipe.image || "/placeholder.svg"}
                                                    alt={recipe.title}
                                                    className="w-full h-48 object-cover rounded-md"
                                                />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <RecipeBuilder />

                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ChefHat className="w-6 h-6" />
                                Current Ingredients
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5">
                                {ingredients.map((ingredient, index) => (
                                    <li key={index}>{ingredient}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                </div>
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ChefHat className="w-6 h-6" />
                            Quick Recipe Search
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {popularIngredients.map((item) => (
                                <Button
                                    key={item.name}
                                    variant="outline"
                                    onClick={() => handleQuickSearch(item.name)}
                                    className="w-20 h-20 flex flex-col items-center justify-center p-2"
                                >
                                    <item.icon className="w-8 h-8 mb-1" />
                                    <span className="text-xs text-center">{item.name}</span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserInput;