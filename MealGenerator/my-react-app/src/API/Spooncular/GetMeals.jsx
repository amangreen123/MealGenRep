import { useState, useRef } from "react"
import axios from "axios"

const useFetchMeals = () => {
    const [recipes, setRecipes] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isSpoonacularLimited, setIsSpoonacularLimited] = useState(false)
    const cache = useRef({})
    const apiKey = import.meta.env.VITE_API_KEY

    const getRecipes = async (ingredients, diet = "", options = {}) => {
        console.log("✅ Spoonacular API called with:", ingredients);

        const { cookableOnly = false, strictMode = false, focusIngredient = null } = options
        const cacheKey = `${ingredients.join(",").toLowerCase()}_${diet}_${focusIngredient || "all"}`

        if (cache.current[cacheKey]) {
            setRecipes(cache.current[cacheKey])
            return cache.current[cacheKey]
        }

        setLoading(true)
        setError(null)

        try {
            // Base API params
            const params = {
                apiKey,
                includeIngredients: ingredients.join(","),
                diet: diet || undefined,
                addRecipeInformation: true,
                fillIngredients: true,
                instructionsRequired: true,
                number: 30,
                query: focusIngredient || ingredients.join(" "),
                addRecipeNutrition: true,
                sort: "max-used-ingredients"
            }

            // Enhanced sorting logic
            if (cookableOnly) {
                params.sort = strictMode ? "max-used-ingredients" : "min-missing-ingredients"
                params.ranking = strictMode ? 1 : 2
            }

            if (focusIngredient) {
                params.includeIngredients = `${focusIngredient},${ingredients.join(",")}`
                params.sort = "relevance"
            }

            const response = await axios.get("https://api.spoonacular.com/recipes/complexSearch", { params })
            console.log("API Response:", response.data);
            
            // Process results with relevance filtering
            let results = response.data.results
                .map(recipe => ({
                    ...recipe,
                    // Pass the full recipe object and all needed parameters
                    relevanceScore: calculateRelevance(recipe, ingredients, focusIngredient)
                }))
                .sort((a, b) => b.relevanceScore - a.relevanceScore)

            // console.log("API Response:", response.data.results);
            // console.log("Processed Results:", results);
            // console.log("Processed Results:", results);

            if (focusIngredient) {
                const focusLower = focusIngredient.toLowerCase()
                results = results.filter(recipe => {
                    const title = recipe.title?.toLowerCase() || ""
                    const ingredientsText = recipe.extendedIngredients
                        ?.map(i => i.name?.toLowerCase() || "")
                        .join(" ") || ""

                    return title.includes(focusLower) || ingredientsText.includes(focusLower)
                })
            }

            cache.current[cacheKey] = results
            setRecipes(results)
            setIsSpoonacularLimited(false)
            
            return results

        } catch (error) {
            if (error.response?.status === 402 || error.response?.status === 429) {
                setError("API limit reached. Using fallback recipes.")
                setIsSpoonacularLimited(true)
            } else {
                setError(error.message || "Failed to fetch recipes")
            }
            return []
        } finally {
            setLoading(false)
        }
    }

    // Updated relevance calculation
    const calculateRelevance = (recipe, ingredients, focusIngredient) => {
        let score = 0
        const title = recipe.title?.toLowerCase() || ""
        const firstIngredient = recipe.extendedIngredients?.[0]?.name?.toLowerCase() || ""

        // Boost if focus ingredient is in title
        if (focusIngredient && title.includes(focusIngredient.toLowerCase())) {
            score += 50
        }

        // Boost for used ingredients (Spoonacular specific)
        if (recipe.usedIngredients) {
            score += recipe.usedIngredients.length * 10
        }

        // Penalize for missing ingredients (Spoonacular specific)
        if (recipe.missedIngredients) {
            score -= recipe.missedIngredients.length * 5
        }

        // Boost if focus ingredient is first in ingredients
        if (focusIngredient && firstIngredient.includes(focusIngredient.toLowerCase())) {
            score += 30
        }

        return score
    }

    return {
        recipes,
        error,
        loading,
        isSpoonacularLimited,
        getRecipes
    }
}

export default useFetchMeals