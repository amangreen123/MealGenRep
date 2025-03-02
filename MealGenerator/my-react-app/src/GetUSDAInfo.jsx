import axios from "axios"

const USDA_API_KEY = import.meta.env.VITE_USDA_KEY;
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1"

// Cache object to store USDA responses
const cache = new Map()

export const getUSDAInfo = async (ingredient) => {
    // Check cache first
    if (cache.has(ingredient)) {
        return cache.get(ingredient)
    }

    try {
        // Search for the ingredient
        const searchResponse = await axios.get(`${USDA_API_URL}/foods/search`, {
            params: {
                api_key: USDA_API_KEY,
                query: ingredient,
                dataType: "Foundation, SR Legacy, Branded, Survey (FNDDS)",
                pageSize: 1, // Get only the most relevant result
            },
        })

        if (!searchResponse.data.foods || searchResponse.data.foods.length === 0) {
            console.log(`No USDA data found for: ${ingredient}`)
            return null
        }

        const food = searchResponse.data.foods[0]

        // Extract relevant nutritional information
        const nutrients = {
            calories: food.foodNutrients.find((n) => n.nutrientName === "Energy")?.value || 0,
            protein: food.foodNutrients.find((n) => n.nutrientName === "Protein")?.value || 0,
            fat: food.foodNutrients.find((n) => n.nutrientName === "Total lipid (fat)")?.value || 0,
            carbs: food.foodNutrients.find((n) => n.nutrientName === "Carbohydrate, by difference")?.value || 0,
            servingSize: food.servingSize || 100,
            servingUnit: food.servingSizeUnit || "g",
        }

        // Cache the result
        cache.set(ingredient, nutrients)

        return nutrients
    } catch (error) {
        console.error(`Error fetching USDA data for ${ingredient}:`, error)
        return null
    }
}



