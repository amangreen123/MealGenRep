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
        searchMode: "general",
        dietFilter: null,
    })

    const searchRecipes = async ({
                                     ingredients,
                                     selectedDiet,
                                     searchType = "all",
                                     exactMatch = false,
                                     focusSearch = false,
                                     focusIngredient = null,
                                 }) => {
        if (ingredients.length === 0) {
            console.log("❌ No ingredients provided, exiting search")
            return
        }

        setIsSearching(true)
        setLoadingText(exactMatch ? "FINDING EXACT MATCHES..." : "SEARCHING...")
        setErrorMessage("")
        setAllRecipes([]) // Clear previous results

        try {
            const ingredientString = ingredients.join(", ")
            const searchMode = exactMatch ? "exact" : "general"

            console.log(`🔍 Enhanced Search:`, {
                ingredients: ingredientString,
                searchMode,
                type: searchType,
                diet: selectedDiet,
            })

            const params = new URLSearchParams({
                ingredients: ingredientString,
                searchMode,
                type: searchType,
                ...(selectedDiet && { diet: selectedDiet }),
                maxResults: "50",
            })

            const response = await axios.get(`${BASE_URL}/enhanced-search?${params}`)
            const data = response.data

            console.log(`✅ Search Results:`, {
                totalResults: data.totalResults,
                perfectMatches: data.perfectMatches,
                meals: data.meals?.length || 0,
                drinks: data.drinks?.length || 0,
            })

            const allResults = [...(data.meals || []), ...(data.drinks || [])]

            const recipesWithSlugs = allResults.map((recipe) => ({
                ...recipe,
                slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
            }))

            setAllRecipes(recipesWithSlugs)
            setSearchStats({
                totalSearches: searchStats.totalSearches + 1,
                perfectMatches: searchStats.perfectMatches + (data.perfectMatches || 0),
                searchMode,
                dietFilter: selectedDiet,
                totalResults: data.totalResults || 0,
            })

            if (recipesWithSlugs.length === 0) {
                if (exactMatch) {
                    setErrorMessage("No exact matches found. Try a general search.")
                } else {
                    setErrorMessage("No recipes found. Try adding different ingredients.")
                }
            }
        } catch (error) {
            console.error("❌ Enhanced search error:", error)
            setErrorMessage("Something went wrong while searching.")
            setAllRecipes([]) // Ensure we clear results on error
        } finally {
            setIsSearching(false)
            setLoadingText("")
            console.log("🏁 Search completed")
        }

        return // Exit after enhanced search

        // Fallback to original multi-API search if needed
        const cookableOnly = searchType === "cookable"
        const strictMode = exactMatch

        let spoonacularResults = []
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
                                spoonacularResults = results
                            } else if (results && Array.isArray(results.results)) {
                                spoonacularResults = results.results
                            } else if (results && results.data && Array.isArray(results.data)) {
                                spoonacularResults = results.data
                            } else if (results && results.recipes && Array.isArray(results.recipes)) {
                                spoonacularResults = results.recipes
                            } else {
                                spoonacularResults = []
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
                            mealDBResults = results
                        } else if (results && Array.isArray(results.meals)) {
                            mealDBResults = results.meals
                        } else if (results && results.data && Array.isArray(results.data)) {
                            mealDBResults = results.data
                        } else {
                            mealDBResults = []
                        }
                    } catch (error) {
                        otherAPIError = true
                    }
                })(),

                // Cocktail API CALL
                (async () => {
                    try {
                        const results = await getCocktailDBDrinks(ingredients, selectedDiet)

                        if (Array.isArray(results)) {
                            cocktailDBResults = results
                        } else if (results && Array.isArray(results.drinks)) {
                            cocktailDBResults = results.drinks
                        } else if (results && results.data && Array.isArray(results.data)) {
                            cocktailDBResults = results.data
                        } else {
                            cocktailDBResults = []
                        }
                    } catch (error) {
                        console.error("❌ CocktailDB error:", error)
                        otherAPIError = true
                    }
                })(),
            ])

            // Combine all results
            const allResults = [...spoonacularResults, ...mealDBResults, ...cocktailDBResults]

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
            console.error("❌ Unhandled error in searchRecipes:", error)
            setErrorMessage("Something went wrong while searching.")
            setAllRecipes([]) // Ensure we clear results on error
        } finally {
            setIsSearching(false)
            setLoadingText("")
            console.log("🏁 Search completed")
        }
    }

    const categorySearch = async ({ ingredient }) => {
        if (!ingredient || isSearching) {
            console.log("❌ Category search aborted - no ingredient or already searching")
            return
        }

        setIsSearching(true)
        setErrorMessage("")
        setLoadingText("SEARCHING...")
        setAllRecipes([])

        try {
            console.log(`🔍 Category Search (Enhanced):`, {
                ingredient,
                searchMode: "general",
                type: "all",
            })

            const params = new URLSearchParams({
                ingredients: ingredient,
                searchMode: "general",
                type: "all",
                maxResults: "50",
            })

            const response = await axios.get(`${BASE_URL}/enhanced-search?${params}`)
            const data = response.data

            console.log(`✅ Category Search Results:`, {
                totalResults: data.totalResults,
                perfectMatches: data.perfectMatches,
                meals: data.meals?.length || 0,
                drinks: data.drinks?.length || 0,
            })

            const allResults = [...(data.meals || []), ...(data.drinks || [])]

            const recipesWithSlugs = allResults.map((recipe) => ({
                ...recipe,
                slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
            }))

            setAllRecipes(recipesWithSlugs)
            setSearchStats({
                totalSearches: searchStats.totalSearches + 1,
                perfectMatches: searchStats.perfectMatches + (data.perfectMatches || 0),
                searchMode: "general",
                dietFilter: null,
                totalResults: data.totalResults || 0,
            })

            if (recipesWithSlugs.length === 0) {
                setErrorMessage("No recipes found for this ingredient.")
            }
        } catch (error) {
            console.error("❌ Category search error:", error)
            setErrorMessage("Error fetching recipes. Please try again.")
            setAllRecipes([])
        } finally {
            setIsSearching(false)
            setLoadingText("")
            console.log("🏁 Category search completed")
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
        apiLimitReached,
    }
}

export default useRecipeSearch