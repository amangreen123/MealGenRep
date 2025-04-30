import axios from "axios";
import { convertToGrams } from "@/nutrition.js";

const USDA_API_KEY = import.meta.env.VITE_USDA_KEY;
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1";

const cache = new Map();

const NUTRIENT_IDS = {
    calories: ["1008", "208"], // Energy (kcal) + alternative
    protein: ["1003", "203"],  // Protein + alternative
    fat: ["1004", "204"],      // Total lipid (fat)
    carbs: ["1005", "205"]     // Carbohydrate
};

const extractNutrient = (food, nutrientIds) => {
    // Handle both string and array inputs for nutrientIds
    const idList = Array.isArray(nutrientIds) ? nutrientIds : [nutrientIds];

    if (!food?.foodNutrients || !Array.isArray(food.foodNutrients)) {
        console.warn(`No foodNutrients array in USDA response for ${food?.description || 'unknown food'}`);
        return 0;
    }

    // Try each potential ID in order
    for (const id of idList) {
        // Look for any match with this ID
        const nutrient = food.foodNutrients.find(n => {
            // Check all possible locations for the ID
            return (
                // Common formats in USDA API
                String(n.nutrientId) === String(id) ||
                String(n.nutrientNumber) === String(id) ||
                String(n.nutrient?.id) === String(id) ||
                String(n.nutrient?.number) === String(id) ||
                // Newest USDA API format
                String(n.nutrient?.number) === String(id) ||
                // As object key
                String(n.id) === String(id) ||
                String(n.number) === String(id)
            );
        });

        if (nutrient) {
            // Extract the value, checking all possible locations
            const value = parseFloat(
                nutrient.value ||
                nutrient.amount ||
                nutrient.nutrientAmount ||
                nutrient.nutrient?.value ||
                0
            );

            // Valid nutrient found
            //console.log(`Found nutrient ${id} for ${food.description}: ${value}${nutrient.unitName || 'g'}`);
            return value;
        }
    }

    // No matching nutrient found after trying all IDs
   // console.warn(`None of these nutrients found: [${idList.join(', ')}] for ${food?.description || 'unknown food'}`);
    return 0;
};

export const getUSDAInfo = async (ingredient, userServingSize = null, userServingUnit = null) => {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    //console.log(`Searching USDA for: "${normalizedIngredient}"`);

    if (cache.has(normalizedIngredient)) {
        //console.log(`Using cached data for ${normalizedIngredient}`);
        return cache.get(normalizedIngredient);
    }

    try {
        const searchResponse = await axios.get(`${USDA_API_URL}/foods/search`, {
            params: {
                api_key: USDA_API_KEY,
                query: normalizedIngredient,
                dataType: "Foundation,SR Legacy,Survey (FNDDS),Branded", // Include more data types for better coverage
                pageSize: 5,
                sortBy: "dataType.keyword",
                sortOrder: "asc"
            },
            timeout: 8000 // Increase timeout for slow connections
        });

        if (!searchResponse.data?.foods?.length) {
           // console.warn(`No USDA results for "${normalizedIngredient}"`);
            return null;
        }

        // Find the best match by prioritizing exact name matches first
        let bestMatch = null;

        // First try for an exact match
        bestMatch = searchResponse.data.foods.find(f =>
            f.description.toLowerCase() === normalizedIngredient ||
            f.description.toLowerCase().includes(normalizedIngredient)
        );

        // If no direct match, fall back to first Foundation food
        if (!bestMatch) {
            bestMatch = searchResponse.data.foods.find(f => f.dataType === "Foundation");
        }

        // Last resort: just use the first result
        const food = bestMatch || searchResponse.data.foods[0];

        //console.log("Selected USDA food:", food.description, food.dataType);

        // Extract nutrients with improved function
        const nutrients = {
            calories: extractNutrient(food, NUTRIENT_IDS.calories),
            protein: extractNutrient(food, NUTRIENT_IDS.protein),
            fat: extractNutrient(food, NUTRIENT_IDS.fat),
            carbs: extractNutrient(food, NUTRIENT_IDS.carbs)
        };

        // Validate the nutrients - if all are zero, something is wrong
        if (nutrients.calories === 0 && nutrients.protein === 0 &&
            nutrients.fat === 0 && nutrients.carbs === 0) {
           // console.warn(`All nutrients zero for ${food.description}, likely data issue`);

            // Calculate calories if we have macros but no calories
            if (nutrients.protein > 0 || nutrients.fat > 0 || nutrients.carbs > 0) {
                nutrients.calories = (nutrients.protein * 4) +
                    (nutrients.carbs * 4) +
                    (nutrients.fat * 9);
            }
        }

        // Handle serving size
        let servingSize = food.servingSize || 100;
        let servingUnit = (food.servingSizeUnit || "g").toLowerCase();

        // Override with user values if provided
        if (userServingSize) {
            servingSize = userServingSize;
        }
        if (userServingUnit) {
            servingUnit = userServingUnit;
        }

        const result = {
            ...nutrients,
            fdcId: food.fdcId,
            description: food.description,
            servingSize: servingSize,
            servingUnit: servingUnit,
            source: "USDA"
        };

        cache.set(normalizedIngredient, result);
        return result;

    } catch (error) {
        console.error(`USDA Error for ${ingredient}:`,
            error.response?.data || error.message);
        return null; // This will trigger your AI fallback
    }
};
