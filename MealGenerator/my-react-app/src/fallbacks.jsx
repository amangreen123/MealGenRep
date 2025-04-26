export const MANUAL_NUTRITION_FALLBACKS = {
    // Meats (per 100g)
    'chicken': { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
    'beef': { calories: 250, protein: 26, fat: 15, carbs: 0 },
    'pork': { calories: 242, protein: 27, fat: 14, carbs: 0 },
    'fish': { calories: 208, protein: 20, fat: 13, carbs: 0 },
    'salmon': { calories: 208, protein: 20, fat: 13, carbs: 0 },
    'tuna': { calories: 132, protein: 29, fat: 1, carbs: 0 },
    'bacon': { calories: 541, protein: 37, fat: 42, carbs: 1.4 },

    // Carbs (per 100g)
    'rice': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
    'pasta': { calories: 131, protein: 5, fat: 1, carbs: 25 },
    'bread': { calories: 265, protein: 9, fat: 3.2, carbs: 49 },
    'potato': { calories: 77, protein: 2, fat: 0.1, carbs: 17 },
    'flour': { calories: 364, protein: 10, fat: 1, carbs: 76 },

    // Fats/Oils (per 100g/ml)
    'oil': { calories: 884, protein: 0, fat: 100, carbs: 0 },
    'butter': { calories: 717, protein: 0.9, fat: 81, carbs: 0.1 },
    'avocado': { calories: 160, protein: 2, fat: 15, carbs: 9 },

    // Vegetables (per 100g)
    'tomato': { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
    'onion': { calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3 },
    'garlic': { calories: 149, protein: 6.4, fat: 0.5, carbs: 33.1 },
    'carrot': { calories: 41, protein: 0.9, fat: 0.2, carbs: 10 },
    'broccoli': { calories: 34, protein: 2.8, fat: 0.4, carbs: 6.6 },

    // Dairy (per 100g/ml)
    'milk': { calories: 42, protein: 3.4, fat: 1, carbs: 5 },
    'cheese': { calories: 402, protein: 25, fat: 33, carbs: 1.3 },
    'egg': { calories: 143, protein: 13, fat: 10, carbs: 1.1 }
};

export const MEASUREMENT_CONVERSIONS = {
    // Tablespoon/teaspoon conversions for common ingredients
    'oil-tbsp': { calories: 120, protein: 0, fat: 14, carbs: 0, size: 15, unit: 'ml' },
    'butter-tbsp': { calories: 102, protein: 0.1, fat: 12, carbs: 0, size: 14, unit: 'g' },
    'sugar-tbsp': { calories: 48, protein: 0, fat: 0, carbs: 12, size: 12, unit: 'g' },
    'flour-tbsp': { calories: 28, protein: 0.8, fat: 0.1, carbs: 6, size: 8, unit: 'g' },
    'milk-tbsp': { calories: 9, protein: 0.5, fat: 0.2, carbs: 0.7, size: 15, unit: 'ml' }
};

export const getManualFallback = (ingredient, measure = '100g') => {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    const normalizedMeasure = measure.toLowerCase().trim();

    // 1. Check for specific measurement conversions first
    if (normalizedMeasure.includes('tbsp') || normalizedMeasure.includes('tablespoon')) {
        const measurementKey = `${normalizedIngredient.split(' ')[0]}-tbsp`;
        if (MEASUREMENT_CONVERSIONS[measurementKey]) {
            return {
                ...MEASUREMENT_CONVERSIONS[measurementKey],
                source: 'manual-measurement'
            };
        }
    }

    // 2. Try exact match
    if (MANUAL_NUTRITION_FALLBACKS[normalizedIngredient]) {
        return {
            ...MANUAL_NUTRITION_FALLBACKS[normalizedIngredient],
            servingSize: 100,
            servingUnit: 'g',
            source: 'manual-exact'
        };
    }

    // 3. Try partial matches (e.g., "skinless chicken breast" → "chicken")
    for (const [key, values] of Object.entries(MANUAL_NUTRITION_FALLBACKS)) {
        if (normalizedIngredient.includes(key)) {
            return {
                ...values,
                servingSize: 100,
                servingUnit: 'g',
                source: 'manual-partial'
            };
        }
    }

    // 4. Smart estimation based on ingredient type
    if (/oil|butter|fat/.test(normalizedIngredient)) {
        return {
            calories: 800,
            protein: 0,
            fat: 90,
            carbs: 0,
            servingSize: 100,
            servingUnit: 'g',
            source: 'estimated-fat'
        };
    }

    if (/meat|chicken|beef|pork|fish/.test(normalizedIngredient)) {
        return {
            calories: 200,
            protein: 25,
            fat: 10,
            carbs: 0,
            servingSize: 100,
            servingUnit: 'g',
            source: 'estimated-protein'
        };
    }

    if (/vegetable|leaf|greens/.test(normalizedIngredient)) {
        return {
            calories: 35,
            protein: 2,
            fat: 0.5,
            carbs: 7,
            servingSize: 100,
            servingUnit: 'g',
            source: 'estimated-vegetable'
        };
    }

    // 5. Final generic fallback
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