import { slugify } from "./slugify"

/**
 * Generates a route for a recipe based on its type and ID
 * @param {Object} recipe - The recipe object
 * @returns {string} - The route path
 */
export function getRecipeRoute(recipe) {
  if (!recipe) return "/"

  if (recipe.idDrink) {
    return `/drink/${slugify(recipe.strDrink)}-${recipe.idDrink}`
  } else if (recipe.idMeal) {
    return `/mealdb-recipe/${slugify(recipe.strMeal)}-${recipe.idMeal}`
  } else if (recipe.id) {
    return `/recipe/${slugify(recipe.title)}-${recipe.id}`
  }

  return "/"
}

/**
 * Prepares recipe state for navigation
 * @param {Object} recipe - The recipe object
 * @param {Array} userIngredients - User's ingredients
 * @param {Array} allRecipes - All available recipes
 * @param {string} currentPath - Current path
 * @returns {Object} - The state object for navigation
 */
export function prepareRecipeState(recipe, userIngredients = [], allRecipes = [], currentPath = "/") {
  if (recipe.idDrink) {
    return {
      drink: recipe,
      userIngredients,
      allRecipes,
      previousPath: currentPath,
    }
  } else if (recipe.idMeal) {
    return {
      meal: recipe,
      userIngredients,
      allRecipes,
      previousPath: currentPath,
    }
  } else {
    return {
      recipe,
      userIngredients,
      allRecipes,
      previousPath: currentPath,
    }
  }
}
