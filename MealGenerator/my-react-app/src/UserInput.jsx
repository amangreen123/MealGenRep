import React, {useState, useRef} from 'react';
import {useNavigate} from "react-router-dom";
import usefetchMeals from "./getMeals.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const UserInput = () => {

    const [inputString, setInputString] = useState('');
    const [ingredients, setIngredients] = useState([])
    const [recipeId, setRecipeId] = useState('')
    const {recipes, error, loading, getRecipes,getCachedRecipes} = usefetchMeals();
    const inputRef = useRef(null);

    const navigate = useNavigate();

    const handleInputChange = ({target: {value}}) => {
        setInputString(value)
    }

    const handleAddIngredient = () => {

        const newIngredients = inputString
            .split(',')
            .map(item => item.trim())
            .filter(item => item !== '');

        const uniqueIngredients = newIngredients.filter(
                newIngr => !ingredients.some(
                existingIngr => existingIngr.toLowerCase() === newIngr.toLowerCase()
                )
        );

        if(uniqueIngredients.length === 0){
            alert('No new ingredients to add or all ingredients already exist');
            return;
        }

        //const value = inputRef.current.value.trim();
        // if (ingredients.some(ingredient => ingredient.toLowerCase() === value)) {
        //     alert('This ingredient is already in the list');
        //     return;
        // }
        //
        // if (!value) {
        //     alert('Please enter an ingredient');
        //     return;
        // }
        //setIngredients([...ingredients, value]);
        //inputRef.current.value = '';

        setIngredients([...ingredients, ...uniqueIngredients]);
        setInputString('');
    }

    const handleSearch = () => {
        if(ingredients.length  > 0){
            getRecipes(ingredients);
        }
    };

    const clickHandler = (recipe) => {
        navigate(`/${recipe.id}`, { state: { recipe } });
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Meal Generator</h1>

                <div className="flex space-x-2">
                    <Input
                        type="text"
                        value={inputString}
                        onChange={handleInputChange}
                        placeholder="Enter ingredients"
                        className="flex-grow"
                    />
                    <Button onClick={handleAddIngredient}>Add Ingredient</Button>
                    <Button onClick={handleSearch}>Search Recipes</Button>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Current Ingredients</h3>
                    <ul className="list-disc pl-5">
                        {ingredients.map((ingredient, index) => (
                            <li key={index}>{ingredient}</li>
                        ))}
                    </ul>
                </div>

                {loading && <p className="text-gray-400">Awaiting Input</p>}
                {error && <p className="text-red-500">Error: Unable to fetch recipes. Please try again later.</p>}

                <div>
                    <h3 className="text-xl font-semibold mb-2">Recipes</h3>
                    <div className="space-y-4">
                        {recipes.map((recipe) => (
                            <Card key={recipe.id} className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => clickHandler(recipe)}>
                                <CardHeader>
                                    <CardTitle>{recipe.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* Add more recipe details here */}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default UserInput;
