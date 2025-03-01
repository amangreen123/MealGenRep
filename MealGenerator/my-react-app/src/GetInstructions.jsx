import axios from "axios"
import { getUSDAInfo } from "@/GetUSDAInfo.jsx"

export const getInstructions = async (id) => {
    const apiKey = import.meta.env.VITE_API_KEY
    const cachedData = localStorage.getItem(`recipe-${id}`)

    if (cachedData) {
        const parsedData = JSON.parse(cachedData)
        const cacheTime = parsedData.timestamp
        const currentTime = Date.now()
        const cacheDuration = 60 * 60 * 1000 // 1 hour

        if (currentTime - cacheTime < cacheDuration) {
            console.log("Using cached recipe data")
            return parsedData.data
        }
    }

    try {
        // Fetch recipe data
        const [instructionResponse, macrosResponse] = await Promise.all([
            axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
                params: { apiKey },
            }),
            axios.get(`https://api.spoonacular.com/recipes/${id}/nutritionWidget.json`, {
                params: { apiKey },
            }),
        ])

        // Get all ingredients
        const allIngredients = [
            ...(instructionResponse.data.extendedIngredients || []),
            ...(instructionResponse.data.usedIngredients || []),
            ...(instructionResponse.data.missedIngredients || []),
        ]

        // Fetch USDA data for each ingredient
        const usdaNutrients = {}
        let totalMacros = {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0
        }

        for (const ingredient of allIngredients) {

            if (ingredient.name) {

                const normalizeName = (name) => name.toLowerCase().trim();
                const key = normalizeName(ingredient.name);

                const usdaData = await getUSDAInfo(ingredient.name)
                console.log("USDA data for", ingredient.name, usdaData)

                if (usdaData) {

                    usdaNutrients[ingredient.name] = {
                        calories: usdaData.calories,
                        protein: usdaData.protein,
                        fat: usdaData.fat,
                        carbs: usdaData.carbs,
                    }
                    console.log(`Stored USDA data for: ${ingredient.name}`, usdaNutrients[ingredient.name])

                    // Add to total macros
                    totalMacros.calories += usdaNutrients[ingredient.name].calories
                    totalMacros.protein += usdaNutrients[ingredient.name].protein
                    totalMacros.fat += usdaNutrients[ingredient.name].fat
                    totalMacros.carbs += usdaNutrients[ingredient.name].carbs
                }
            }
        }

        const recipeData = {
            instructions: instructionResponse.data.instructions,
            macros: totalMacros,
            usedIngredients: instructionResponse.data.usedIngredients || [],
            missedIngredients: instructionResponse.data.missedIngredients || [],
            usdaNutrients,
            extendedIngredients: instructionResponse.data.extendedIngredients || [],
        }

        localStorage.setItem(
            `recipe-${id}`,
            JSON.stringify({
                timestamp: Date.now(),
                data: recipeData,
            })
        )

        return recipeData
    } catch (error) {
        if (error.response?.status === 402) {
            console.error("API limit reached. Please try again later.")
            throw new Error("API limit reached. Please try again later.")
        }
        console.error("Error fetching recipe details:", error)
        throw new Error("An error occurred while fetching recipe details.")
    }
}

export default getInstructions