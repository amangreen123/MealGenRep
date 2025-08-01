import { useEffect, useState } from "react"
import {slugify} from "@/utils/slugify.js";

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
    
    
    const categorySearch = async ({selectedCategory, categoryIngredients, specificIngredient, setIngredients }) => {
        
        if(isSearching){
            return
        }
        
        setIsSearching(true)
        setApiLimitReached(false)
        setErrorMessage("")
        setLoadingText("SEARCHING...")
        
        
        setAllRecipes([])

        let searchQuery = specificIngredient || selectedCategory
        
        if(!specificIngredient && categoryIngredients[selectedCategory]) {
            
            const allCategoryIngredients = [
                ...allCategoryIngredients[selectedCategory].mealDB,
                ...categoryIngredients[selectedCategory].spoonacular
            ]
            
            const randomIndex = Math.floor(Math.random() * allCategoryIngredients.length)
            searchQuery = allCategoryIngredients[randomIndex]
        }

        setIngredients([searchQuery])
        localStorage.setItem("mealForgerIngredients", JSON.stringify([searchQuery]))
        
        try {
            let requestsCompleted = 0
            const totalRequests = apiLimitReached ? 2 : 3 // Spoonacular, MealDB, CocktailDB (if not limited)
            let mealDBRecipes = []
            let spoonacularRecipes = []
            let cocktailResults = []
            let hasError = false

            
            const updateResults = () => {
                requestsCompleted++
                
                if(requestsCompleted === totalRequests){

                    const combinedRecipes = [
                        ...(Array.isArray(mealDBRecipes) ? mealDBRecipes : []),
                        ...(Array.isArray(spoonacularRecipes) ? spoonacularRecipes : []),
                        ...(Array.isArray(cocktailResults) ? cocktailResults : []),
                    ]
                    
                    const recipesWithSlugs = combinedRecipes.map((recipes) => ({
                        ...recipes,
                            slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),

                    }))
                    
                    setAllRecipes(recipesWithSlugs)
                    setIsSearching(false)
                    setLoadingText("")
                    
                    if(combinedRecipes.length === 0 && hasError) {
                        setErrorMessage("No recipes found. Please try a different ingredient.")
                    }
                }
            }
            
            getMealDBRecipes([searchQuery])
                .then((results) => {
                    mealDBRecipes = Array.isArray(results) ? results : []
                })
                .catch((error)=>{
                    console.error("MealDB error:", error)
                    hasError = true
                })
                .finally(updateResults)

            getCocktailDBDrinks([searchQuery])
                .then((results) => {
                    cocktailResults = Array.isArray(results) ? results : []
                })
                .catch((error) => {
                    console.error("CocktailDB error:", error)
                    hasError = true
                })
                .finally(updateResults)

            // 3. Spoonacular API call - only if not limited
            if (!apiLimitReached) {
                getRecipes([searchQuery], selectedDiet)
                    .then((results) => {
                        spoonacularRecipes = Array.isArray(results) ? results : []
                    })
                    .catch((error) => {
                        console.error("Spoonacular error:", error)
                        hasError = true
                        const errorMsg = String(error)
                        if (errorMsg.includes("402") || errorMsg.includes("429") || errorMsg.includes("quota")) {
                            setApiLimitReached(true)
                        }
                    })
                    .finally(updateResults)
            } else {
                // If API is limited, still increment the counter
                updateResults()
            }
        } catch (error) {
            console.error("Error during quick search:", error)
            setErrorMessage("An unexpected error occurred.")
            setIsSearching(false)
            setLoadingText("")
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
