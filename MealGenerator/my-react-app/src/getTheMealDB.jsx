"use client"

import { useState, useRef } from "react"
import axios from "axios"
const apiKey = import.meta.env.VITE_MEALDB_KEY
const BASE_URL = `https://www.themealdb.com/api/json/v2/${apiKey}/`;
export const useTheMealDB = () => {
    const [MealDBRecipes, setMealDBRecipes] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const cache = useRef({})

    const getMealDBRecipes = async (ingredients) => {
        const mainIngredient = Array.isArray(ingredients) ? ingredients[0] : ingredients
        const key = mainIngredient.toLowerCase().trim()

        // Check cache first
        if (cache.current[key]) {
            setMealDBRecipes(cache.current[key])
            setLoading(false)
            //console.log("Using cached MealDB recipes for:", key)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Construct the URL properly with encoded ingredient
            const url = `${BASE_URL}filter.php?i=${encodeURIComponent(key)}`;
            
            //console.log("Fetching from MealDB:", url)

            const response = await axios.get(url)
            // Handle API-specific null response
            if (!response.data || !response.data.meals) {
                const newError = `No recipes found for ${key}`
                console.log(newError)
                setError(newError)
                setMealDBRecipes([])
                cache.current[key] = [] // Cache empty results to avoid repeated failed calls
                return
            }

            const results = response.data.meals
            
            cache.current[key] = results
            setMealDBRecipes(results)
            
            // console.log("MealDB recipes", results)
            // console.log("MealDB recipes found:", results.length)

        } catch (error) {
            const errorMessage =
                error.response?.status === 403
                    ? "Access to MealDB API was denied. Please check your implementation."
                    : error.message || "Failed to fetch recipes from MealDB"

            console.error("MealDB API Error:", errorMessage)
            setError(errorMessage)
            setMealDBRecipes([])
            cache.current[key] = [] // Cache failed results
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

