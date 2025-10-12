import { useState, useEffect } from "react"
import axios from "axios";


const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5261';

const useRecipeSearch = ({ getRecipes, getMealDBRecipes, getCocktailDBDrinks, slugify }) => {
    
    const [isSearching, setIsSearching] = useState(false)
    const [loadingText, setLoadingText] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [apiLimitReached, setApiLimitReached] = useState(false)
    const [allRecipes, setAllRecipes] = useState([])
    const [searchStats, setSearchStats] = useState({
        totalSearches: 0,
        perfectMatches: 0,
        searchMode:'general',
        dietFilter: null
    })
    
    const searchRecipes = async  ({
                                      ingredients,
                                      selectedDiet,
                                      searchType = "all",
                                      exactMatch = false,
                                      focusSearch = false,
                                      focusIngredient = null,
                                  }) => {
        
        if (ingredients.length === 0) {
            console.log("❌ No ingredients provided, exiting search");
            return;
        }

        setIsSearching(true)
        setLoadingText(exactMatch ? "FINDING EXACT MATCHES..." : "SEARCHING...")
        setErrorMessage("")
        setAllRecipes([]) // Clear previous results
        
        
        try {
            
            const ingredientString = ingredients.join(", ");
            const searchMode = exactMatch ? 'exact' : 'general';

            console.log(`🔍 Enhanced Search:`, {
                ingredients: ingredientString,
                searchMode,
                type: searchType,
                diet: selectedDiet
            });

            const params = new URLSearchParams({
                ingredients: ingredientString,
                searchMode,
                type: searchType,
                ...selectedDiet && { diet: selectedDiet },
                maxResults: '50'
            });


            const response = await axios.get(`${BASE_URL}/enhanced-search?${params}`);
            const data = response.data;

            console.log(`✅ Search Results:`, {
                totalResults: data.totalResults,
                perfectMatches: data.perfectMatches,
                meals: data.meals?.length || 0,
                drinks: data.drinks?.length || 0
            });
            
            const allResults = [...(data.meals || []), ...(data.drinks || [])];
            
            const recipesWithSlugs = allResults.map((recipe) => ({
                ...recipe,
                slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
            }));
            
            setAllRecipes(recipesWithSlugs);
            setSearchStats({
                totalSearches: searchStats.totalSearches + 1,
                perfectMatches: searchStats.perfectMatches + (data.perfectMatches || 0),
                searchMode,
                dietFilter: selectedDiet
            });
            
            if(recipesWithSlugs.length === 0) {
                if (exactMatch) {
                    setErrorMessage("No exact matches found. Try a general search.");
                } else {
                    setErrorMessage("No recipes found. Try adding different ingredients.");
                }
            }
        } catch (error) {
            console.error("❌ Enhanced search error:", error);
            setErrorMessage("Something went wrong while searching.");
            setAllRecipes([]); // Ensure we clear results on error
        } finally {
            setIsSearching(false)
            setLoadingText("")
            console.log("🏁 Search completed");
        }
        
        return; // Exit after enhanced search
        
        // Fallback to original multi-API search if needed
        const cookableOnly = searchType === "cookable"
        const strictMode = exactMatch

        let spooncularResults = []
        let mealDBResults = []
        let cocktailDBResults = []
        let spoonacularError = false
        let otherAPIError = false

        try {
            await Promise.all([
                // Spoonacular API CALL
                (async () => {
                    if (!apiLimitReached) {
                        try {
                            const results = await getRecipes(ingredients, selectedDiet, {
                                cookableOnly,
                                strictMode,
                                focusIngredient,
                            })
                            // Handle different possible return formats
                            if (Array.isArray(results)) {
                                spooncularResults = results;
                            } else if (results && Array.isArray(results.results)) {
                                spooncularResults = results.results;
                            } else if (results && results.data && Array.isArray(results.data)) {
                                spooncularResults = results.data;
                            } else if (results && results.recipes && Array.isArray(results.recipes)) {
                                spooncularResults = results.recipes;
                            } else {
                                spooncularResults = [];
                            }
                            
                        } catch (error) {
                   
                            spoonacularError = true
                            const errorString = String(error)
                            if (
                                error.response?.status === 402 ||
                                error.response?.status === 429 ||
                                errorString.includes("quota") ||
                                errorString.includes("API limit")
                            ) {
                      
                                setApiLimitReached(true)
                            }
                        }
                    } else {
                    }
                })(),

                // MealDB API CALL
                (async () => {
                    try {
                        const results = await getMealDBRecipes(ingredients, selectedDiet)
                        if (Array.isArray(results)) {
                            mealDBResults = results;
                        } else if (results && Array.isArray(results.meals)) {
                            mealDBResults = results.meals;
                        } else if (results && results.data && Array.isArray(results.data)) {
                            mealDBResults = results.data;
                        } else {
                            mealDBResults = [];
                        }

                    } catch (error) {
                        otherAPIError = true
                    }
                })(),

                // Cocktail API CALL
                (async () => {
                    try {
                        const results = await getCocktailDBDrinks(ingredients,selectedDiet)
                       
                        if (Array.isArray(results)) {
                            cocktailDBResults = results;
                        } else if (results && Array.isArray(results.drinks)) {
                            cocktailDBResults = results.drinks;
                        } else if (results && results.data && Array.isArray(results.data)) {
                            cocktailDBResults = results.data;
                        } else {
                            cocktailDBResults = [];
                        }
                    } catch (error) {
                        console.error("❌ CocktailDB error:", error)
                        otherAPIError = true
                    }
                })(),
            ])
            
            // Combine all results
            const allResults = [...spooncularResults, ...mealDBResults, ...cocktailDBResults]

            // Add slugs to all recipes
            const recipesWithSlugs = allResults.map((recipe) => ({
                ...recipe,
                slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
            }))


            // Set the final results
            setAllRecipes(recipesWithSlugs)

            // Handle error messages
            if (spoonacularError && apiLimitReached && (mealDBResults.length > 0 || cocktailDBResults.length > 0)) {
                setErrorMessage("Using fallback recipes (Spoonacular limit reached)")
            } else if (spoonacularError && otherAPIError && allResults.length === 0) {
                setErrorMessage("Failed to fetch recipes from all sources. Please try again.")
            } else if (allResults.length === 0) {
                setErrorMessage("No recipes found. Try adding different ingredients.")
            }

        } catch (error) {
            console.error("❌ Unhandled error in searchRecipes:", error);
            setErrorMessage("Something went wrong while searching.");
            setAllRecipes([]); // Ensure we clear results on error
        } finally {
            setIsSearching(false)
            setLoadingText("")
            console.log("🏁 Search completed");
        }
    }

    const categorySearch = async ({ ingredient }) => {
        
        if (!ingredient || isSearching) {
            console.log("❌ Category search aborted - no ingredient or already searching");
            return;
        }
        
        setIsSearching(true)
        setErrorMessage("")
        setLoadingText("SEARCHING...")
        setAllRecipes([])

        let mealDBResults = [];
        let cocktailResults = [];
        let spoonacularResults = [];
        let requestsCompleted = 0;
        let hasError = false;
        const totalRequests = apiLimitReached ? 2 : 3;

        const updateResults = () => {
            requestsCompleted++

            if (requestsCompleted === totalRequests) {

                const combinedRecipes = [
                    ...spoonacularResults,
                    ...mealDBResults,
                    ...cocktailResults,
                ];

 
                const recipesWithSlugs = combinedRecipes.map((recipe) => ({
                    ...recipe,
                    slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
                }));

                setAllRecipes(recipesWithSlugs);
                setIsSearching(false);
                setLoadingText("");

                if (recipesWithSlugs.length === 0) {
                    setErrorMessage(hasError ? "Error fetching recipes. Please try again." : "No recipes found for this ingredient.");
                }
            }
        };

        // MealDB request
        getMealDBRecipes([ingredient])
            .then((results) => {
                if (Array.isArray(results)) {
                    mealDBResults = results;
                } else if (results && Array.isArray(results.meals)) {
                    mealDBResults = results.meals;
                } else if (results && results.data && Array.isArray(results.data)) {
                    mealDBResults = results.data;
                } else {
                    mealDBResults = [];
                }
            })
            .catch((error) => {
                hasError = true;
            })
            .finally(updateResults);

        // CocktailDB request
        getCocktailDBDrinks([ingredient])
            .then((results) => {
                if (Array.isArray(results)) {
                    cocktailResults = results;
                } else if (results && Array.isArray(results.drinks)) {
                    cocktailResults = results.drinks;
                } else if (results && results.data && Array.isArray(results.data)) {
                    cocktailResults = results.data;
                } else {
                    cocktailResults = [];
                }
            })
            .catch((error) => {
                console.error("❌ Category CocktailDB error:", error);
                hasError = true;
            })
            .finally(updateResults);

        // Spoonacular request (if not at limit)
        if (!apiLimitReached) {
            getRecipes([ingredient])
                .then((results) => {
                    if (Array.isArray(results)) {
                        spoonacularResults = results;
                    } else if (results && Array.isArray(results.results)) {
                        spoonacularResults = results.results;
                    } else if (results && results.data && Array.isArray(results.data)) {
                        spoonacularResults = results.data;
                    } else if (results && results.recipes && Array.isArray(results.recipes)) {
                        spoonacularResults = results.recipes;
                    } else {
                        spoonacularResults = [];
                    }
                })
                .catch((error) => {
                    console.error("❌ Category Spoonacular error:", error);
                    hasError = true;
                    const errorString = String(error);
                    if (errorString.includes("402") || errorString.includes("429") || errorString.includes("quota")) {
                        setApiLimitReached(true);
                    }
                })
                .finally(updateResults);
        } else {
            updateResults(); 
        }
    }

    return {
        isSearching,
        loadingText,
        errorMessage,
        allRecipes,
        searchRecipes,
        categorySearch,
        searchStats,
        apiLimitReached
    }
}

export default useRecipeSearch