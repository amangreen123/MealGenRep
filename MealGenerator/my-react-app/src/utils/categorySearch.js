export function getCategoryIngredient(categoryIngredients, selectedCategory, specificIngredient = null ){
    
    if(!selectedCategory || !categoryIngredients[selectedCategory]) return null;
    
    const {mealDB = [], spoonacular = []} = categoryIngredients[selectedCategory];
    const allCategoryIngredients = [...mealDB, ...spoonacular];
    
    if(specificIngredient) return specificIngredient;
    
    const randomIndex = Math.floor(Math.random() * allCategoryIngredients.length);
    
    return allCategoryIngredients[randomIndex] || null;
}