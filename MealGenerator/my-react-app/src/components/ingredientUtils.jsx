

/**
 * Converts ingredient quantities to grams based on unit and ingredient type
 * @param {number} quantity - The quantity of the ingredient
 * @param {string} unit - The unit of measurement (cup, tbsp, oz, etc.)
 * @param {string} ingredientName - The name of the ingredient for ingredient-specific conversions
 * @returns {number} - The equivalent weight in grams
 */

export const convertToGrams = (quantity, unit, ingredientName) => {
    // Normalize the unit and ingredient name
    const normalizedUnit = (unit || '').toLowerCase().trim().replace('.', '');
    const normalizedName = (ingredientName || '').toLowerCase().trim();

    // Common conversion factors to grams
    const conversionFactors = {
        // Weight measurements
        'g': 1,
        'gram': 1,
        'grams': 1,
        'kg': 1000,
        'oz': 28.35,
        'ounce': 28.35,
        'lb': 453.59,
        'pound': 453.59,

        // Volume measurements
        'ml': 1,
        'l': 1000,
        'tsp': 5,
        'teaspoon': 5,
        'tbsp': 15,
        'tablespoon': 15,
        'cup': 240,
        'pint': 473,
        'quart': 946,
    };

    // Common ingredient densities (grams per ml)
    const densityFactors = {
        'water': 1,
        'milk': 1.03,
        'oil': 0.92,
        'flour': 0.53,
        'sugar': 0.85,
        'salt': 1.2,
        'butter': 0.96,
    };

    // Special cases
    const specialCases = {
        'egg': 50,
        'large egg': 50,
        'garlic clove': 5,
        'onion': 150,
    };

    // Check for special cases first
    for (const [item, weight] of Object.entries(specialCases)) {
        if (normalizedName.includes(item)) {
            return quantity * weight;
        }
    }

    // Direct weight conversion
    if (conversionFactors[normalizedUnit]) {
        return quantity * conversionFactors[normalizedUnit];
    }

    // Volume conversion with density
    if (['ml', 'l', 'tsp', 'teaspoon', 'tbsp', 'tablespoon', 'cup', 'pint', 'quart'].includes(normalizedUnit)) {
        // Convert to ml first
        const ml = quantity * (conversionFactors[normalizedUnit] || 1);

        // Find density factor
        let densityFactor = 1; // Default to water
        for (const [ingredient, density] of Object.entries(densityFactors)) {
            if (normalizedName.includes(ingredient)) {
                densityFactor = density;
                break;
            }
        }

        return ml * densityFactor;
    }

    // If unit is empty or unknown, make best guess
    console.warn(`Unknown unit '${unit}' for ingredient '${ingredientName}'. Assuming grams.`);
    return quantity;
};

/**
 * Combines nutritional data from multiple sources
 * @param {Object} usdaData - Nutritional data from USDA
 * @param {Object} spoonacularData - Nutritional data from Spoonacular
 * @returns {Object} - Combined nutritional data
 */
export const combineNutritionData = (usdaData, spoonacularData) => {
    // Initialize with zeros
    const combined = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
    };

    let sourceCount = 0;

    // Add USDA data if available
    if (usdaData) {
        combined.calories += usdaData.calories || 0;
        combined.protein += usdaData.protein || 0;
        combined.fat += usdaData.fat || 0;
        combined.carbs += usdaData.carbs || 0;
        sourceCount++;
    }

    // Add Spoonacular data if available
    if (spoonacularData) {
        combined.calories += spoonacularData.calories || 0;
        combined.protein += spoonacularData.protein || 0;
        combined.fat += spoonacularData.fat || 0;
        combined.carbs += spoonacularData.carbs || 0;
        sourceCount++;
    }

    // Average the values if we have data from multiple sources
    if (sourceCount > 0) {
        combined.calories /= sourceCount;
        combined.protein /= sourceCount;
        combined.fat /= sourceCount;
        combined.carbs /= sourceCount;
    }

    return combined;
};