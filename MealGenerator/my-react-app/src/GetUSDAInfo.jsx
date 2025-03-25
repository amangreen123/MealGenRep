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

        console.log(`✅ USDA Data for ${ingredient}:`, food);

        // Extract relevant nutritional information
        const extractNutrient = (nutrientNumber) => food.foodNutrients.find((n) => n.nutrientNumber === nutrientNumber)?.value || 0;
        
        const nutrients = {
            calories: extractNutrient("208"), // Energy (kcal)
            protein: extractNutrient("203"), // Protein
            fat: extractNutrient("204"), // Total lipid (fat)
            carbs: extractNutrient("205"), // Carbohydrate, by difference
            servingSize: 100, // Assume per 100g for consistency
            servingUnit: "g",
        };

        // Cache the result
        cache.set(ingredient, nutrients)

        return nutrients
    } catch (error) {
        console.error(`Error fetching USDA data for ${ingredient}:`, error)
        return null
    }
}



