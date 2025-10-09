"use client"

import { useState, useRef } from "react"
import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5261';

export const useTheMealDB = () => {
    const [MealDBRecipes, setMealDBRecipes] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const cache = useRef({})

    const getMealDBRecipes = async (ingredients, diet = "") => {
        // Handle array or string input
        const ingredientString = Array.isArray(ingredients)
            ? ingredients.join(',')
            : ingredients;

        const cacheKey = `${ingredientString}-${diet}`.toLowerCase();

        // Check cache first
        if (cache.current[cacheKey]) {
            setMealDBRecipes(cache.current[cacheKey])
            setLoading(false)
            return cache.current[cacheKey];
        }

        setLoading(true)
        setError(null)

        try {
            // Use your backend endpoint
            const url = `${BASE_URL}/general-recipes-search?ingredients=${encodeURIComponent(ingredientString)}&diet=${encodeURIComponent(diet)}`;

            console.log("Fetching recipes from:", url)

            const response = await axios.get(url)

            if (!response.data || !response.data.meals) {
                console.log(`No recipes found for ${ingredientString}`)
                setError(`No recipes found`)
                setMealDBRecipes([])
                cache.current[cacheKey] = []
                return []
            }

            const results = response.data.meals

            cache.current[cacheKey] = results
            setMealDBRecipes(results)

            console.log("Recipes found:", results.length)

            return results

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Failed to fetch recipes"
            console.error("Recipe API Error:", errorMessage)
            setError(errorMessage)
            setMealDBRecipes([])
            cache.current[cacheKey] = []
            return []
        } finally {
            setLoading(false)
        }
    }

    const getCachedDBRecipes = () => cache.current

    return {
        MealDBRecipes,
        error,
        loading,
        getMealDBRecipes,
        getCachedDBRecipes,
    }
}

export default useTheMealDB