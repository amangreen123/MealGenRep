import { useState } from "react"

const useRecipeSearch = ({ getRecipes, getMealDBRecipes, getCocktailDBDrinks, slugify }) => {
    const [isSearching, setIsSearching] = useState(false)
    const [loadingText, setLoadingText] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [apiLimitReached, setApiLimitReached] = useState(false)
    const [allRecipes, setAllRecipes] = useState([])

    const searchRecipes = async ({ ingredients, selectedDiet, cookableOnly = false, strictMode = false, focusSearch = false, focusIngredient = null }) => {
        console.log("🔍 SEARCH STARTED with:", { ingredients, selectedDiet, cookableOnly, strictMode });

        if (ingredients.length === 0) return

        setIsSearching(true)
        setLoadingText("SEARCHING...")
        setErrorMessage("")
        setAllRecipes([])

        let spooncularResults = []
        let mealDBResults = []
        let cocktailDBResults = []
        let spoonacularError = false
        let otherAPIError = false

        try {
            await Promise.all([
                (async () => {
                    if (!apiLimitReached) {
                        try {
                            console.log("📡 Calling Spoonacular API...");
                            const results = await getRecipes(ingredients, selectedDiet, {
                                cookableOnly,
                                strictMode,
                                focusIngredient,
                            })
                            console.log("✅ Spoonacular raw results:", results);
                            spooncularResults = Array.isArray(results) ? results : []
                            console.log("✅ Spoonacular processed results:", spooncularResults);
                        } catch (error) {
                            console.error("❌ Spoonacular error:", error)
                            spoonacularError = true
                            if (
                                error.response?.status === 402 ||
                                error.response?.status === 429 ||
                                String(error).includes("quota") ||
                                String(error).includes("API limit")
                            ) {
                                setApiLimitReached(true)
                            }
                        }
                    } else {
                        console.log("⚠️ Spoonacular API limit reached, skipping");
                    }
                })(),

                // MealDB API CALL
                (async () => {
                    try {
                        console.log("📡 Calling MealDB API...");
                        const results = await getMealDBRecipes(ingredients)
                        console.log("✅ MealDB raw results:", results);
                        mealDBResults = Array.isArray(results) ? results : []
                        console.log("✅ MealDB processed results:", mealDBResults);
                    } catch (error) {
                        console.error("❌ MealDB error:", error)
                        otherAPIError = true
                    }
                })(),

                // Cocktail API CALL
                (async () => {
                    try {
                        console.log("📡 Calling CocktailDB API...");
                        const results = await getCocktailDBDrinks(ingredients)
                        console.log("✅ CocktailDB raw results:", results);
                        cocktailDBResults = Array.isArray(results) ? results : []
                        console.log("✅ CocktailDB processed results:", cocktailDBResults);
                    } catch (error) {
                        console.error("❌ CocktailDB error:", error)
                        otherAPIError = true
                    }
                })(),
            ])

            console.log("🔄 Combining results...");
            const allResults = [...spooncularResults, ...mealDBResults, ...cocktailDBResults]
            console.log("📊 Combined results count:", allResults.length);
            console.log("📊 Combined results data:", allResults);

            console.log("📦 Detailed breakdown:", {
                spooncularResults: spooncularResults.length,
                mealDBResults: mealDBResults.length,
                cocktailDBResults: cocktailDBResults.length,
                totalResults: allResults.length,
            });

            const addSlugstoRecipes = allResults.map((recipe) => ({
                ...recipe,
                slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
            }))

            console.log("🏷️ Recipes with slugs:", addSlugstoRecipes);
            setAllRecipes(addSlugstoRecipes)

            if (spoonacularError && apiLimitReached && (mealDBResults.length > 0 || cocktailDBResults.length > 0)) {
                setErrorMessage("Using fallback recipes (Spoonacular limit reached)")
            } else if (spoonacularError && otherAPIError && allResults.length === 0) {
                setErrorMessage("Failed to fetch recipes from all sources. Please try again.")
            }

        } catch (error) {
            console.error("❌ Unhandled error in searchRecipes:", error); // Fixed: was 'err', now 'error'
            setErrorMessage("Something went wrong while searching.");
        } finally {
            setIsSearching(false)
            setLoadingText("")
            console.log("🎯 Search completed. Final allRecipes state should be:", allRecipes);
        }
    } // Fixed: Added missing closing brace for searchRecipes function

    const categorySearch = async ({ ingredient }) => {
        if (!ingredient || isSearching) return;

        setIsSearching(true)
        setApiLimitReached(false)
        setErrorMessage("")
        setLoadingText("SEARCHING...")
        setAllRecipes([])

        let mealDBResults = [];
        let cocktailResults = [];
        let spoonacularResults = [];
        let requestsCompleted = 0;
        let hasError = false;

        const updateResults = () => {
            requestsCompleted++

            if (requestsCompleted === (apiLimitReached ? 2 : 3)) {
                const combinedrecipes = [
                    ...spoonacularResults,
                    ...mealDBResults,
                    ...cocktailResults,
                ];

                const recipesWithSlugs = combinedrecipes.map((recipe) => ({
                    ...recipe,
                    slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
                }));

                setAllRecipes(recipesWithSlugs);
                setIsSearching(false);
                setLoadingText("");

                if (recipesWithSlugs.length === 0 && hasError) {
                    setErrorMessage("No recipes found. Please try a different ingredient.");
                }
            }
        };

        getMealDBRecipes([ingredient])
            .then((results) => {
                mealDBResults = Array.isArray(results) ? results : [];
            })
            .catch((error) => {
                console.error("MealDB error:", error);
                hasError = true;
            })
            .finally(updateResults);

        getCocktailDBDrinks([ingredient])
            .then((results) => {
                cocktailResults = Array.isArray(results) ? results : [];
            })
            .catch((error) => {
                console.error("CocktailDB error:", error);
                hasError = true;
            })
            .finally(updateResults);

        if (!apiLimitReached) {
            getRecipes([ingredient])
                .then((results) => {
                    spoonacularResults = Array.isArray(results) ? results : [];
                })
                .catch((error) => {
                    console.error("Spoonacular error:", error);
                    hasError = true;
                    const msg = String(error);
                    if (msg.includes("402") || msg.includes("429") || msg.includes("quota")) {
                        setApiLimitReached(true);
                    }
                })
                .finally(updateResults);
        } else {
            updateResults(); // simulate third request completed
        }
    }

    return {
        isSearching,
        loadingText,
        errorMessage,
        allRecipes,
        searchRecipes,
        categorySearch,
        apiLimitReached
    }
}

export default useRecipeSearch