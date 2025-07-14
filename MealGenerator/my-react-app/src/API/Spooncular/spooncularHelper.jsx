const getServings = (recipe) => {
    if (recipe.servings) return recipe.servings
    if (recipe.strYield) return recipe.strYield
    return recipe.isDrink ? 1 : 4 // Default values
}


const getCookingTime = (recipe) => {
    if (recipe.readyInMinutes) return `${recipe.readyInMinutes} min`
    if (recipe.strCategory?.toLowerCase().includes("dessert")) return "30 min"
    if (recipe.isDrink) return "5 min"
    return "25 min" // Default value
}


const getDifficultyLevel = (recipe) => {
    if (recipe.readyInMinutes) {
        if (recipe.readyInMinutes <= 20) return "Easy"
        if (recipe.readyInMinutes <= 40) return "Medium"
        return "Hard"
    }

    // Default to medium if no time information
    return "Medium"
}

const getUniqueFeature = (recipe) => {
    if (recipe.isDrink) {
        return recipe.strAlcoholic === "Non alcoholic" ? "Non-Alcoholic" : "Alcoholic"
    } else if (recipe.strArea) {
        return recipe.strArea
    } else if (recipe.diets && recipe.diets.length > 0) {
        return recipe.diets[0]
    } else if (recipe.veryHealthy) {
        return "Healthy"
    } else if (recipe.cheap) {
        return "Budget-Friendly"
    } else if (recipe.veryPopular) {
        return "Popular"
    }
    return null
}