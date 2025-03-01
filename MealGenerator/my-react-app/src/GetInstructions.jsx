import axios from "axios"

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
        // Fetch both recipe instructions and nutrition information in parallel
        const [instructionResponse, nutritionResponse] = await Promise.all([
            axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
                params: {
                    apiKey,
                    includeNutrition: true,
                },
            }),
            axios.get(`https://api.spoonacular.com/recipes/${id}/nutritionWidget.json`, {
                params: { apiKey },
            }),
        ])

        // Extract relevant data from responses
        const recipeData = instructionResponse.data
        const nutritionData = nutritionResponse.data

        // Structure the response data
        const macrosAndSteps = {
            instructions: recipeData.instructions || "No instructions available.",
            macros: {
                calories: nutritionData.calories || 0,
                protein: nutritionData.protein?.match(/\d+/)?.[0] || 0,
                fat: nutritionData.fat?.match(/\d+/)?.[0] || 0,
                carbs: nutritionData.carbs?.match(/\d+/)?.[0] || 0,
            },
            usedIngredients:
                recipeData.extendedIngredients?.map((ingredient) => ({
                    id: ingredient.id,
                    name: ingredient.name,
                    amount: ingredient.amount,
                    unit: ingredient.unit,
                    image: ingredient.image,
                })) || [],
            missedIngredients: [],
            extendedIngredients: recipeData.extendedIngredients || [],
            summary: recipeData.summary,
            servings: recipeData.servings,
            readyInMinutes: recipeData.readyInMinutes,
            image: recipeData.image,
            dishTypes: recipeData.dishTypes,
        }

        // Cache the structured data
        localStorage.setItem(
            `recipe-${id}`,
            JSON.stringify({
                timestamp: Date.now(),
                data: macrosAndSteps,
            }),
        )

        return macrosAndSteps
    } catch (error) {
        if (error.response?.status === 402) {
            console.error("API quota exceeded")
            throw new Error("Daily API quota has been reached. Please try again tomorrow.")
        }

        if (error.response?.status === 404) {
            console.error("Recipe not found")
            throw new Error("Recipe not found. Please try another recipe.")
        }

        console.error("Error fetching recipe details:", error)
        throw new Error("An error occurred while fetching recipe details. Please try again later.")
    }
}

export default getInstructions

