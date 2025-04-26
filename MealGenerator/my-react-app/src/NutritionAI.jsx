import {getGaladrielResponse} from './getGaladrielResponse';
import { getManualFallback } from './fallbacks';

const NUTRITION_PROMPT = `Provide COMPLETE nutrition facts in this EXACT JSON format:
{
  "cal":number,     // calories (0-5000)
  "pro":number,     // protein in grams (0-200)
  "fat":number,     // fat in grams (0-200)
  "carb":number,    // carbs in grams (0-200)
  "size":number,    // reference size (1-10000)
  "unit":"g"|"ml",  // measurement unit
  "source":"string" // data source
}`;

export const fetchNutritionData = async (ingredient, measure = '100g') => {
    const query = `Nutrition for ${measure} ${ingredient}`;

    try {
        const response = await getGaladrielResponse(query, 'nutrition');

        // Parse and validate response
        let data;
        try {
            data = typeof response === 'string' ? JSON.parse(response) : response;

            // If calories exist but macros are zero, estimate macros
            if (data.cal > 0 && (data.pro === 0 && data.fat === 0 && data.carb === 0)) {
                console.warn('Estimating macros from calories for', ingredient);
                data.pro = Math.round(data.cal * 0.15 / 4);  // 15% protein (4 cal/g)
                data.fat = Math.round(data.cal * 0.3 / 9);   // 30% fat (9 cal/g)
                data.carb = Math.round(data.cal * 0.55 / 4); // 55% carbs (4 cal/g)
            }
        } catch (e) {
            console.warn('Failed to parse nutrition response:', e);
            return getManualFallback(ingredient);
        }

        return {
            calories: data.cal || 0,
            protein: data.pro || 0,
            fat: data.fat || 0,
            carbs: data.carb || 0,
            servingSize: data.size || 100,
            servingUnit: data.unit || 'g',
            source: data.source || 'AI'
        };

    } catch (error) {
        console.error('Nutrition API error:', error);
        return getManualFallback(ingredient);
    }
};
