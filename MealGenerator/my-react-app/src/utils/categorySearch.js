const categoryIngredients = {
    Dessert: {
        mealDB: ["Chocolate", "Honey", "Vanilla"],
        spoonacular: ["Cocoa Powder", "Custard", "Whipped Cream"],
    },
    Bread: {
        mealDB: ["Baguette", "Ciabatta", "Pita"],
        spoonacular: ["Whole Wheat Bread", "Rye Bread", "Sourdough Bread"],
    },
    Vegetables: {
        mealDB: ["Carrot", "Broccoli", "Zucchini"],
        spoonacular: ["Spinach", "Kale", "Bell Pepper"],
    },
    Beef: {
        mealDB: ["Beef", "Beef Brisket", "Beef Fillet"],
        spoonacular: ["Ground Beef", "Sirloin Steak", "Beef Ribs"],
    },
    Fish: {
        mealDB: ["Salmon", "Tuna", "Cod"],
        spoonacular: ["Haddock", "Mackerel", "Tilapia"],
    },
    Cheese: {
        mealDB: ["Cheddar Cheese", "Mozzarella Cheese", "Feta Cheese"],
        spoonacular: ["Parmesan Cheese", "Gorgonzola Cheese", "Goat Cheese"],
    },
    Fruit: {
        mealDB: ["Apple", "Banana", "Strawberries"],
        spoonacular: ["Mango", "Peach", "Pineapple"],
    },
    Chicken: {
        mealDB: ["Chicken", "Chicken Breast", "Chicken Thighs"],
        spoonacular: ["Chicken Wings", "Rotisserie Chicken", "Chicken Drumsticks"],
    },
}

export const getCategoryIngredient = (specificIngredient, selectedCategory) => {
    if (specificIngredient && specificIngredient !== selectedCategory) {
        return specificIngredient
    }

    if (!selectedCategory || !categoryIngredients[selectedCategory]) {
        return selectedCategory || "Unknown"
    }

    // Choose randomly between mealDB and spoonacular ingredients
    const chosenSource = Math.random() < 0.5 ? "mealDB" : "spoonacular"
    const ingredients = categoryIngredients[selectedCategory][chosenSource]

    if (ingredients && ingredients.length > 0) {
        const randomIndex = Math.floor(Math.random() * ingredients.length)
        return ingredients[randomIndex]
    }

    // Fallback to the other source if the chosen one is empty
    const fallbackSource = chosenSource === "mealDB" ? "spoonacular" : "mealDB"
    const fallbackIngredients = categoryIngredients[selectedCategory][fallbackSource]

    if (fallbackIngredients && fallbackIngredients.length > 0) {
        const randomIndex = Math.floor(Math.random() * fallbackIngredients.length)
        return fallbackIngredients[randomIndex]
    }

    return selectedCategory
}
