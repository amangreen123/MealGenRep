import axios from "axios"
import {getGaladrielResponse} from "@/getGaladrielResponse.jsx";
import {convertToGrams} from "@/nutrition.js";

const USDA_API_KEY = import.meta.env.VITE_USDA_KEY;
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1"
const cache = new Map()


const extractNutrient = (food, nutrientNumber) => {
    const nutrient = food.foodNutrients?.find(n => n.nutrientNumber === nutrientNumber);
    return nutrient ? parseFloat(nutrient.value) : null;
}


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

        let nutrients = null;
        
        if(searchResponse.data.foods?.length > 0){
            const food = searchResponse.data.foods[0];
            
            const defaultServingSize = food.servingSize || 100;
            const defaultServingUnit = (food.servingSizeUnit || "g").toLowerCase();
            
            let scale = 1;
            
            if(userServingSize !== null){
                const userServingInGrams = convertToGrams(userServingUnit ? `${userServingSize} ${userServingUnit}` : userServingSize.toString());
                const defaultServingInGrams = convertToGrams(`${defaultServingSize} ${defaultServingUnit}`);
                scale = userServingInGrams / defaultServingInGrams;
            }

            nutrients = {
                fdcId: food.fdcId,
                description: food.description,
                foodCategory: food.foodCategory,
                calories: extractNutrient(food, "208") * scale,
                protein: extractNutrient(food, "203") * scale,
                fat: extractNutrient(food, "204") * scale,
                carbs: extractNutrient(food, "205") * scale,
                servingSize: defaultServingSize * scale,
                servingUnit: "g",
                source: "USDA"
            };
        } else {
            const aiResponse = await getGaladrielResponse(
                `Provide nutrition facts for ${normalizedIngredient} per 100g in JSON format: {cal, pro, fat, carb, size, unit}`,
                "nutrition"
            );

            try {
                const aiData = JSON.parse(aiResponse);
                nutrients = {
                    description: normalizedIngredient,
                    calories: aiData.cal ?? 0,
                    protein: aiData.pro ?? 0,
                    fat: aiData.fat ?? 0,
                    carbs: aiData.carb ?? 0,
                    servingSize: aiData.size ?? 100,
                    servingUnit: aiData.unit ?? "g",
                    source: "AI"
                };
            } catch (e) {
                console.warn(`❌ Failed to parse AI nutrition for ${normalizedIngredient}:`, aiResponse);
                nutrients = {
                    description: normalizedIngredient,
                    calories: 0,
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                    servingSize: 100,
                    servingUnit: "g",
                    source: "error"
                };
            }
        }
        
        if (nutrients) {
            cache.set(cacheKey,nutrients)
            return nutrients;
        }
        
        return null;
        
    } catch (error) {
        console.error(`Error fetching USDA data for ${ingredient}:`, error);
        return null;
    }
};



