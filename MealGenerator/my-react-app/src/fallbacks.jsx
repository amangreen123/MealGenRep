export const MANUAL_NUTRITION_FALLBACKS = {
    // Common ingredients with average values per 100g
    'chicken breast': { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
    'ground beef': { calories: 250, protein: 26, fat: 15, carbs: 0 },
    'salmon': { calories: 208, protein: 20, fat: 13, carbs: 0 },
    'rice': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
    'pasta': { calories: 131, protein: 5, fat: 1, carbs: 25 },
    'olive oil': { calories: 884, protein: 0, fat: 100, carbs: 0 },
    'tomato': { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
    'onion': { calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3 },
    'garlic': { calories: 149, protein: 6.4, fat: 0.5, carbs: 33.1 },
    'potato': { calories: 77, protein: 2, fat: 0.1, carbs: 17 }
};

export const getManualFallback = (ingredient) => {
    const normalizedIngredient = ingredient.toLowerCase().trim();

    // Try exact match first
    if (MANUAL_NUTRITION_FALLBACKS[normalizedIngredient]) {
        return {
            ...MANUAL_NUTRITION_FALLBACKS[normalizedIngredient],
            servingSize: 100,
            servingUnit: 'g',
            source: 'manual-fallback'
        };
    }

    if (measure.includes('tbsp') && normalizedIngredient === 'olive oil') {
        return {
            calories: 120,
            protein: 0,
            fat: 14,
            carbs: 0,
            servingSize: 15, // 1 tbsp ≈ 15ml
            servingUnit: 'ml',
            source: 'manual-fallback-tbsp'
        };
    }

    // Try partial matches (e.g., "boneless chicken breast" → "chicken breast")
    for (const [key, values] of Object.entries(MANUAL_NUTRITION_FALLBACKS)) {
        if (normalizedIngredient.includes(key)) {
            return {
                ...values,
                servingSize: 100,
                servingUnit: 'g',
                source: 'manual-fallback-partial'
            };
        }
    }

    // Generic fallback for unknown ingredients
    return {
        calories: 100,
        protein: 5,
        fat: 2,
        carbs: 10,
        servingSize: 100,
        servingUnit: 'g',
        source: 'generic-fallback'
    };
};