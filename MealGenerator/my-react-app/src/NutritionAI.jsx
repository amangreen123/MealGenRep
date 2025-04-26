import {getManualFallback} from "@/fallbacks.jsx";
import {getGaladrielResponse} from "@/getGaladrielResponse.jsx";

export const NUTRITION_PROMPT = `Provide ACCURATE nutrition facts with STRICT validation:

1. Zero-calorie items:
   - WATER, COFFEE, TEA (plain): Must be 0 calories, 0g protein, 0g fat, 0g carbs
   - SPICES, HERBS, SALT, PEPPER (in typical amounts): Must be ≤5 calories per serving
   - LEMON/LIME JUICE (1 tbsp): Must be ≤5 calories

2. Macronutrient constraints:
   - PROTEIN FOODS (meats, fish, poultry): Must have protein ≥ fat (in grams)
   - FATTY FISH (salmon, mackerel): Exception to above rule, can have fat > protein
   - OILS, BUTTER, GHEE: Must have ≥95% calories from fat, 0g protein, 0g carbs (trace allowed)
   - PURE CARBS (sugar, corn starch): Must have ≥95% calories from carbs, 0g protein, 0g fat

3. Calories must match macronutrients:
   - Protein: 4 calories per gram (±0.5 cal/g tolerance)
   - Carbohydrates: 4 calories per gram (±0.5 cal/g tolerance)
   - Fat: 9 calories per gram (±0.5 cal/g tolerance)
   - TOTAL CALORIES must equal sum of calories from protein, carbs, and fat (±10 cal tolerance)

4. Serving size constraints:
   - Specify realistic serving sizes (e.g., 3-8oz for meats, 1-2 tbsp for oils)
   - All values must be per specified serving (not per 100g unless explicitly stated)
   - Include both volume (cups, tbsp) AND weight (g, oz) when applicable

5. Maximum limits per serving:
   - Calories: 1200 (flag if >800 for single ingredients)
   - Protein: 100g (flag if >50g for single ingredients)
   - Fat: 100g (flag if >40g for single ingredients)
   - Carbs: 100g (flag if >60g for single ingredients)

6. Data validation:
   - REJECT negative values for any nutrient
   - FLAG unrealistic nutrient density (e.g., vegetables with >30% protein)
   - FLAG outliers based on USDA database typical values (±30% tolerance)
   - EXPLAIN any unusual or unexpected values

7. Return data in this EXACT format:

Calories: [number]
Protein: [number]g
Fat: [number]g
Carbs: [number]g
Fiber: [number]g (if applicable)
    Sugar: [number]g (if applicable)
    Serving: [number][unit] ([number]g)
    `


export const fetchNutritionData = async (ingredient, measure = '100g') => {
    const query = `Nutrition for ${measure} ${ingredient}`;

    try {
        // Get AI response with retry logic
        const response = await getGaladrielResponse(query, 'nutrition');
        console.log('RAW AI RESPONSE:', response);
        
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
        const fallback = getManualFallback(ingredient, measure);
        console.warn('Using fallback data:', fallback);
        return fallback;
    }
};

// More robust text parser
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