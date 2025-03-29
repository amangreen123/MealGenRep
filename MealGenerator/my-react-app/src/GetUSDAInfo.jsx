import axios from "axios"

const USDA_API_KEY = import.meta.env.VITE_USDA_KEY;
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1"
const cache = new Map()

export const getUSDAInfo = async (ingredient, userServingSize = null, userServingUnit = null) => {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    const cacheKey = userServingSize ? `${normalizedIngredient}-${userServingSize}${userServingUnit || ''}` : normalizedIngredient;

    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const searchResponse = await axios.get(`${USDA_API_URL}/foods/search`, {
            params: {
                api_key: USDA_API_KEY,
                query: normalizedIngredient,
                dataType: "Foundation, SR Legacy, Branded, Survey (FNDDS)",
                pageSize: 5,
            },
        });

        if (!searchResponse.data.foods || searchResponse.data.foods.length === 0) {
            console.warn(`No USDA data found for: ${ingredient}`);
            return null;
        }

        const food = searchResponse.data.foods[0];
        const extractNutrient = (nutrientNumber) =>
            food.foodNutrients.find((n) => n.nutrientNumber === nutrientNumber)?.value || null;

        // Get default serving info and convert to grams
        const defaultServingSize = food.servingSize || 100;
        const defaultServingUnit = (food.servingSizeUnit || "g").toLowerCase();
        let defaultServingSizeInGrams = defaultServingUnit === 'g'
            ? defaultServingSize
            : convertToGrams(`${defaultServingSize} ${defaultServingUnit}`);

        // Handle user-provided serving info
        let targetServingSizeInGrams = defaultServingSizeInGrams;
        if (userServingSize !== null) {
            targetServingSizeInGrams = convertToGrams(
                userServingUnit ? `${userServingSize} ${userServingUnit}` : userServingSize.toString()
            );
        }

        const scale = targetServingSizeInGrams / defaultServingSizeInGrams;

        const nutrients = {
            fdcId: food.fdcId,
            description: food.description,
            foodCategory: food.foodCategory,
            calories: extractNutrient("208") * scale,
            protein: extractNutrient("203") * scale,
            fat: extractNutrient("204") * scale,
            carbs: extractNutrient("205") * scale,
            servingSize: targetServingSizeInGrams,
            servingUnit: "g", // Always use grams after conversion
        };

        // Validate nutrients
        Object.entries(nutrients).forEach(([key, value]) => {
            if (value === null && key !== "servingSize" && key !== "servingUnit") {
                console.warn(`Missing nutrient data for ${key} in ${ingredient}.`);
            }
        });

        cache.set(cacheKey, nutrients);
        return nutrients;
    } catch (error) {
        console.error(`Error fetching USDA data for ${ingredient}:`, error);
        return null;
    }
};



