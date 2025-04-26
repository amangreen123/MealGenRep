import { getGaladrielResponse } from './getGaladrielResponse';
import { getManualFallback } from './fallbacks';

const NUTRITION_PROMPT = `Provide nutrition facts in this EXACT format:
Calories: [number]
Protein: [number]g
Fat: [number]g
Carbs: [number]g
Serving: [number][g/ml]

STRICT RULES:
1. NO JSON formatting
2. NEVER return all zeros
3. Include ALL values
4. Meat MUST contain protein (>0)
5. Fats/oils MUST contain fat (>0)
6. If uncertain, use these estimates:
   - Protein: 15-30% of calories (4 cal/g)
   - Fat: 20-35% of calories (9 cal/g)
   - Carbs: Remainder (4 cal/g)

EXAMPLE:
Calories: 250
Protein: 26g
Fat: 15g
Carbs: 0g
Serving: 100g`;

export const fetchNutritionData = async (ingredient, measure = '100g') => {
    const query = `Nutrition for ${measure} ${ingredient}`;

    try {
        // Get AI response with retry logic
        const response = await getGaladrielResponse(query, 'nutrition');
        console.log('Raw AI response:', response);

        // Robust text parsing
        const parsed = parseNutritionText(response);

        // Validate and auto-correct values
        const validated = validateNutritionData(parsed, ingredient);

        return {
            ...validated,
            source: 'AI'
        };

    } catch (error) {
        console.error(`NutritionAI error for ${ingredient}:`, error.message);
        const fallback = getManualFallback(ingredient);
        console.warn('Using fallback data:', fallback);
        return fallback;
    }
};

// Robust text parser
function parseNutritionText(text) {
    if (!text) throw new Error('Empty response');

    const extract = (regex, defaultValue = null) => {
        const match = text.match(regex);
        return match ? parseFloat(match[1]) : defaultValue;
    };

    return {
        calories: extract(/Calories?:\s*(\d+)/i),
        protein: extract(/Protein?:\s*(\d+\.?\d*)\s*g/i),
        fat: extract(/Fat?:\s*(\d+\.?\d*)\s*g/i),
        carbs: extract(/Carbs?|Carbohydrates?:\s*(\d+\.?\d*)\s*g/i),
        servingSize: extract(/Serving?|Size?:\s*(\d+)\s*(g|ml)/i, 100),
        servingUnit: text.match(/Serving?|Size?:\s*\d+\s*(g|ml)/i)?.[1] || 'g'
    };
}

// Data validator and normalizer
function validateNutritionData(data, ingredient) {
    // Validate required fields
    if (!data.calories || isNaN(data.calories)) {
        throw new Error('Invalid calorie value');
    }

    // Auto-correct suspicious values
    const result = {
        calories: Math.max(1, data.calories),
        protein: data.protein > 0 ? data.protein : estimateMacro(data.calories, 'protein', ingredient),
        fat: data.fat > 0 ? data.fat : estimateMacro(data.calories, 'fat', ingredient),
        carbs: data.carbs >= 0 ? data.carbs : estimateMacro(data.calories, 'carbs', ingredient),
        servingSize: data.servingSize || 100,
        servingUnit: ['g', 'ml'].includes(data.servingUnit) ? data.servingUnit : 'g'
    };

    // Final sanity check
    if (result.calories > 0 && result.protein === 0 && result.fat === 0 && result.carbs === 0) {
        throw new Error('Invalid nutrition profile');
    }

    return result;
}

// Macro estimation helper
function estimateMacro(calories, macroType, ingredient) {
    const isProteinFood = /chicken|beef|fish|meat|pork|tofu/i.test(ingredient);
    const isFatFood = /oil|butter|avocado|nuts/i.test(ingredient);

    switch (macroType) {
        case 'protein':
            return Math.round(calories * (isProteinFood ? 0.3 : 0.15) / 4);
        case 'fat':
            return Math.round(calories * (isFatFood ? 0.4 : 0.25) / 9);
        case 'carbs':
            return Math.round(calories * 0.55 / 4);
        default:
            return 0;
    }
}