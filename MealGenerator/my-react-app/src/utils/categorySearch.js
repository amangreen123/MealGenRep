export async function categorySearch({
                                         selectedCategory,
                                         categoryIngredients,
                                         specificIngredient,
                                         setIngredients,
                                         getMealDBRecipes,
                                         getCocktailDBDrinks,
                                         getRecipes,
                                         slugify,
                                         setApiLimitReached,
                                         setAllRecipes,
                                         setIsSearching,
                                         setErrorMessage,
                                         setLoadingText,
                                     }) {

    const allCategoryIngredients = [
        ...allCategoryIngredients[selectedCategory].mealDB,
        ...categoryIngredients[selectedCategory].spoonacular
    ]
}