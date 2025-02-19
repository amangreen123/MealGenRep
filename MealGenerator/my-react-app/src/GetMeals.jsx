import { useState, useRef } from "react";
import axios from "axios";

export const useFetchMeals = () => {
    const [recipes, setRecipes] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const cache = useRef({}); // Store the data in cache
    const apiKey = import.meta.env.VITE_API_KEY;

    const getRecipes = async (ingredients, diet = null) => {
        const key = ingredients.join(',').toLowerCase() + (diet ? `:${diet.toLowerCase()}` : '');

        if (cache.current[key]) {
            setRecipes(cache.current[key]);
            setLoading(false);
            console.log("Using Cached Recipes for Key:", key, cache.current[key]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                'https://api.spoonacular.com/recipes/complexSearch',
                {
                    params: {
                        includeIngredients: ingredients.join(','),
                        diet: diet ? diet.toLowerCase() : undefined, // Add diet filter if provided
                        apiKey,
                        sort: "min-missing-ingredients", // Sort by recipes with the least missing ingredients
                        fillIngredients: true, // Include missing ingredients in the response
                        addRecipeInformation: true, // Include recipe information in the response
                    },
                }
            );

            const results = response.data.results;

            cache.current[key] = results;
            setRecipes(results);
            //console.log('Food Data', results);

        } catch (error) {
            setError(error.message || "An error occurred while fetching recipes.");
        } finally {
            setLoading(false);
        }
    };

    const getCachedRecipes = () => cache.current;

    return { recipes, error, loading, getRecipes, getCachedRecipes };
};

export default useFetchMeals;