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

const extractNutrient = (food, nutrientNumber) => {
    // More robust nutrient extraction
    const nutrient = food.foodNutrients?.find(n =>
        n.nutrientId === nutrientNumber ||
        n.nutrientNumber === nutrientNumber ||
        n.nutrient?.id === nutrientNumber
    );

    if (!nutrient) {
        console.warn(`Nutrient ${nutrientNumber} not found for ${food.description}`);
        return 0;
    }

    const value = parseFloat(nutrient.value || nutrient.amount || 0);
    console.log(`Found nutrient ${nutrientNumber}:`, value); // Debug log
    return value;
};

export const getUSDAInfo = async (ingredient, userServingSize = null, userServingUnit = null) => {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    // console.log(`Searching USDA for: "${normalizedIngredient}"`); // Debug log

    if (cache.has(normalizedIngredient)) {
        console.log(`Using cached data for ${normalizedIngredient}`);
        return cache.get(normalizedIngredient);
    }


    try {
        const searchResponse = await axios.get(`${USDA_API_URL}/foods/search`, {
            params: {
                api_key: USDA_API_KEY,
                query: normalizedIngredient,
                dataType: "Foundation,SR Legacy", // More focused data types
                pageSize: 5,
                sortBy: "dataType.keyword", // Prioritize better data sources
                sortOrder: "asc"
            },
        });

        console.log("USDA Search Results:", searchResponse.data.foods); // Debug log

        if (!searchResponse.data.foods?.length) {
            console.warn(`No USDA results for "${normalizedIngredient}"`);
            return null;
        }

        // Find the best match (prioritize Foundation foods)
        const food = searchResponse.data.foods.find(f =>
            f.dataType === "Foundation" ||
            f.description.toLowerCase().includes(normalizedIngredient)
        ) || searchResponse.data.foods[0];

        //console.log("Selected food:", food.description, food.dataType); // Debug log

        // Extract nutrients with better fallbacks
        const nutrients = {
            calories: extractNutrient(food, NUTRIENT_IDS.calories) ||
                extractNutrient(food, "208") || // Alternative energy ID
                0,
            protein: extractNutrient(food, NUTRIENT_IDS.protein) || 0,
            fat: extractNutrient(food, NUTRIENT_IDS.fat) || 0,
            carbs: extractNutrient(food, NUTRIENT_IDS.carbs) || 0
        };

        //console.log("Extracted nutrients:", nutrients); // Debug log

        // Rest of your serving size calculations...
       const result =  {
            ...nutrients,
            fdcId: food.fdcId,
            description: food.description,
            servingSize: food.servingSize || 100,
            servingUnit: (food.servingSizeUnit || "g").toLowerCase(),
            source: "USDA"
        };
       
       cache.set(normalizedIngredient, result)
        return result

    } catch (error) {
        console.error(`USDA Error for ${ingredient}:`, error.response?.data || error.message);
        return null;
    }
};
