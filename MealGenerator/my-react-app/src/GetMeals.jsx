"use client"

import { useState, useRef } from "react"
import axios from "axios"

const useFetchMeals = () => {
    const [recipes, setRecipes] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)
    const cache = useRef({})
    const apiKey = import.meta.env.VITE_API_KEY

    const getRecipes = async (ingredients, diet = "", apiParams) => {
        const key = `${ingredients.join(",").toLowerCase()}_${diet}`

        if (cache.current[key]) {
            setRecipes(cache.current[key])
            setLoading(false)
           //console.log("Using cached recipes")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await axios.get("https://api.spoonacular.com/recipes/complexSearch", {
                params: {
                    apiKey,
                    includeIngredients: ingredients.join(","),
                    diet: diet || undefined,
                    addRecipeInformation: true,
                    fillIngredients: true,
                    instructionsRequired: true,
                    number: 20,
                    sort: "min-missing-ingredients",
                    ranking: 2,
                },
            })
            
            const results = response.data.results.map((recipe) => ({
                id: recipe.id,
                title: recipe.title,
                image: recipe.image,
                readyInMinutes: recipe.readyInMinutes,
                servings: recipe.servings,
                dishTypes: recipe.dishTypes,
                summary: recipe.summary,
                usedIngredients:
                    recipe.usedIngredients?.map((ing) => ({
                        id: ing.id,
                        name: ing.name,
                        amount: ing.amount,
                        unit: ing.unit,
                        image: ing.image,
                    })) || [],
                missedIngredients:
                    recipe.missedIngredients?.map((ing) => ({
                        id: ing.id,
                        name: ing.name,
                        amount: ing.amount,
                        unit: ing.unit,
                        image: ing.image,
                    })) || [],
            }))

            cache.current[key] = results
            setRecipes(results)
            
            //console.log("Spooncular recipes:", results.length)
           // console.log("Spooncular Results", results )

        } catch (error) {
            if (error.response?.status === 402) {
                setError("Daily API quota has been reached. Please try again tomorrow.")
            } else {
                setError(error.message || "An error occurred while fetching recipes.")
            }
            console.error("API Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const getCachedRecipes = () => cache.current

    return { recipes, error, loading, getRecipes, getCachedRecipes }
}

export default useFetchMeals

