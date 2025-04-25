export const convertToGrams = (measure) => {
    if (!measure) return 100;

    const cleaned = measure.toString().trim().toLowerCase();

    const densityFactors = {
        'oil': 0.92,    // ml→g
        'honey': 1.42,
        'flour': 0.57,
        'sugar': 0.85,
        'water': 1.00,
        'milk': 1.03,
    };

    const conversions = {
        'mg': 0.001, 'milligram': 0.001, 'milligrams': 0.001,
        'g': 1, 'gram': 1, 'grams': 1,
        'kg': 1000, 'kilogram': 1000, 'kilograms': 1000,
        'oz': 28.35, 'ounce': 28.35, 'ounces': 28.35,
        'lb': 453.6, 'pound': 453.6, 'pounds': 453.6,
        'ml': 1, 'milliliter': 1, 'milliliters': 1, 'cc': 1,
        'l': 1000, 'liter': 1000, 'liters': 1000,
        'tsp': 5, 'teaspoon': 5, 'teaspoons': 5,
        'tbsp': 15, 'tablespoon': 15, 'tablespoons': 15,
        'fl oz': 30, 'fluid ounce': 30, 'fluid ounces': 30,
        'cup': 240, 'cups': 240,
        'pint': 473, 'pints': 473,
        'quart': 946, 'quarts': 946,
        'gallon': 3785, 'gallons': 3785,
        'egg': 50, 'large egg': 50, 'eggs': 50,
        'banana': 120, 'medium banana': 120, 'bananas': 120,
        'apple': 150, 'medium apple': 150, 'apples': 150,
        'small': 80, 'medium': 120, 'large': 180,
        'slice': 20, 'slices': 20, 'sliced': 100,
        'chopped': 120, 'diced': 100, 'minced': 50,
        'clove': 5, 'head': 500, 'bunch': 100,
        'leaf': 0.5, 'pinch': 0.3, 'dash': 0.6,
        'to taste': 1, 'some': 5, 'a little': 2,
        'portion': 100, 'serving': 100, 'unit': 100,
        'piece': 100, 'whole': 100, 'item': 100
    };

    if (/^\d+(\.\d+)?$/.test(cleaned)) {
        return parseFloat(cleaned);
    }

    if (!/\d/.test(cleaned)) {
        return conversions[cleaned] || 100;
    }

    const match = cleaned.match(/^([\d./]+)\s*([a-zA-Z ]+)$/);
    if (!match) return 100;

    let [_, numStr, unit] = match;
    unit = unit.trim();

    let num;
    if (numStr.includes('/')) {
        const [numerator, denominator] = numStr.split('/');
        num = parseFloat(numerator) / parseFloat(denominator);
    } else {
        num = parseFloat(numStr);
    }

    if (isNaN(num)) return 100;

    const matchedUnit = Object.keys(conversions).find(key =>
        unit.includes(key) || key.includes(unit.split(' ')[0])
    );

    if (!matchedUnit) {
        console.warn(`No unit found for ${unit} in ${cleaned}`);
        return 100;
    }

    let grams = num * conversions[matchedUnit];
    
    const ingredientType = Object.keys(densityFactors).find(type => unit.includes(type));
    if (ingredientType) {
        grams *= densityFactors[ingredientType];
    }

    return grams;
};
