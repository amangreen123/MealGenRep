import {useState } from "react"


const useRecipeSearch = ({getRecipes, getMealDBRecipes, getCocktailDBDrinks, slugify}) => {

    const [isSearching, setIsSearching] = useState(false)
    const [loadingText, setLoadingText] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [apiLimitReached, setApiLimitReached] = useState(false)
    const [allRecipes, setAllRecipes] = useState([])
    
    const searchRecipes = async ({ingredients, selectedDiet, cookableOnly = false, strictMode = false, focusSearch = false, focusIngredient = null}) => {
        
        if(ingredients.length === 0) return
        
        setIsSearching(true)
        setLoadingText("SEARCHING...")
        setErrorMessage("")
        
        setAllRecipes([])
        
        let spooncularResults = []
        let mealDBResults = []
        let cocktailDBResults = []
        let spoonacularError = false
        let otherAPIError = false
        
        await Promise.all([
            (async () => {
                if(!apiLimitReached){
                    try{
                        const results = await getRecipes(ingredients, selectedDiet, {
                            cookableOnly,
                            strictMode,
                            focusIngredient,
                        })
                        spooncularResults = Array.isArray(results) ? results : []
                    } catch (error) {
                        console.error("Spoonacular error:", error)
                        spoonacularError = true
                        if(
                            error.response?.status === 402 ||
                            error.response?.status === 429 ||
                            String(error).includes("quota") ||
                            String(error).includes("API limit")
                        ) {
                            setApiLimitReached(true)
                        }
                    }
                }
            })(),
            
            //MealDB API CALL
            (async () => {
                try {
                    const results = await getMealDBRecipes(ingredients)
                   mealDBResults = Array.isArray(results) ? results : []
                } catch (error) {
                    console.error("MealDB error:", error)
                    otherAPIError = true
                }
            })(),

            //Cocktail API CALL
            (async () => {
                try{
                    const results = await getCocktailDBDrinks(ingredients)
                    cocktailDBResults = Array.isArray(results) ? results : []
                } catch (error) {
                    console.error("CocktailDB error:", error)
                    otherAPIError = true
                }
            })(),
        ])
        const allResults = [...spooncularResults,...mealDBResults, ...cocktailDBResults]
        
        const addSlugstoRecipes = allResults.map((recipe) => ({
            ...recipe,
            slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
        }))
        
        setAllRecipes(addSlugstoRecipes)
        
        if(spoonacularError && apiLimitReached && (mealDBResults.length > 0 || cocktailDBResults.length > 0)){
            setErrorMessage("Using fallback recipes (Spoonacular limit reached)")
        } else if (spoonacularError && otherAPIError && allResults.length === 0){
            setErrorMessage("Failed to fetch recipes from all sources. Please try again.")
        }
        
        setIsSearching(false)
        setLoadingText("")
    }
    
    
    const categorySearch = async ({ingredient}) => {

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
            
            if(requestsCompleted === (apiLimitReached ? 2: 3)){
                
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
        searchRecipes,  // renamed from handleSearch
        categorySearch,  // renamed from handleCategorySearch
        apiLimitReached
    }
    
}

export default useRecipeSearch
