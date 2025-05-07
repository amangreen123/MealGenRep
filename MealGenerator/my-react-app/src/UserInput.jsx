"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { slugify } from "./utils/slugify"
import "@/fonts/fonts.css"

import useFetchMeals from "./GetMeals.jsx"
import useTheMealDB from "./getTheMealDB.jsx"
import useTheCocktailDB from "./GetCocktailDB.jsx"

import { InfoIcon, Search, Plus, Clock, Users, ChefHat, Sparkles } from "lucide-react"

import { getGaladrielResponse } from "@/getGaladrielResponse.jsx"

import {
    GiCarrot,
    GiCheeseWedge,
    GiCupcake,
    GiFishCooked,
    GiFruitBowl,
    GiRoastChicken,
    GiSlicedBread,
    GiSteak,
} from "react-icons/gi"

import MealForgerLogo from "./Images/Meal_Forger.png"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import CookableSearch from "./CookableSearch.jsx"

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

const popularIngredients = [
    {
        name: "Dessert",
        icon: GiCupcake,
        color: "text-yellow-400 group-hover:text-yellow-500",
    },
    {
        name: "Bread",
        icon: GiSlicedBread,
        color: "text-amber-600 group-hover:text-amber-700",
    },
    {
        name: "Vegetables",
        icon: GiCarrot,
        color: "text-green-800 group-hover:text-green-600",
    },
    {
        name: "Beef",
        icon: GiSteak,
        color: "text-red-500 group-hover:text-red-600",
    },
    {
        name: "Fish",
        icon: GiFishCooked,
        color: "text-blue-400 group-hover:text-blue-500",
    },
    {
        name: "Cheese",
        icon: GiCheeseWedge,
        color: "text-yellow-300 group-hover:text-yellow-400",
    },
    {
        name: "Fruit",
        icon: GiFruitBowl,
        color: "text-pink-500 group-hover:text-pink-600",
    },
    {
        name: "Chicken",
        icon: GiRoastChicken,
        color: "text-orange-400 group-hover:text-orange-500",
    },
]

const UserInput = () => {
    const [inputString, setInputString] = useState("")
    const [ingredients, setIngredients] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedDiet, setSelectedDiet] = useState(null)
    const [errorMessage, setErrorMessage] = useState("")
    const { recipes, error, getRecipes } = useFetchMeals()
    const [apiLimitReached, setApiLimitReached] = useState(false)
    const { getMealDBRecipes, MealDBRecipes, loading } = useTheMealDB()
    const { CocktailDBDrinks, getCocktailDBDrinks } = useTheCocktailDB()
    const [allRecipes, setAllRecipes] = useState([])
    const navigate = useNavigate()
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [loadingText, setLoadingText] = useState("")
    const [randomRecipes, setRandomRecipes] = useState([])
    const [loadingRandomRecipes, setLoadingRandomRecipes] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [focusIngredient, setFocusIngredient] = useState("")

    // Fetch random recipes on initial load
    useEffect(() => {
        const fetchRandomRecipes = async () => {
            try {
                setLoadingRandomRecipes(true)
                const apiKey = import.meta.env.VITE_MEALDB_KEY || "1" // Use environment variable or default to free API
                const response = await fetch(`https://www.themealdb.com/api/json/v2/${apiKey}/randomselection.php`)
                const data = await response.json()

                if (data && data.meals) {
                    // Add slugs to the random recipes
                    const recipesWithSlugs = data.meals.map((recipe) => ({
                        ...recipe,
                        slug: slugify(recipe.strMeal),
                        idMeal: recipe.idMeal,
                    }))
                    setRandomRecipes(recipesWithSlugs)
                }
            } catch (error) {
                console.error("Error fetching random recipes:", error)
            } finally {
                setLoadingRandomRecipes(false)
            }
        }

        fetchRandomRecipes()
    }, [])

    useEffect(() => {
        setApiLimitReached(false)
    }, [])

    useEffect(() => {
        if (
            error &&
            (error.includes("API limit") || error.includes("quota") || error.includes("402") || error.includes("429"))
        ) {
            setApiLimitReached(true)
        }
    }, [error])

    useEffect(() => {
        const mealDBRecipesArray = Array.isArray(MealDBRecipes) ? MealDBRecipes : []
        const cocktailDBRecipesArray = Array.isArray(CocktailDBDrinks)
            ? CocktailDBDrinks.map((drink) => ({
                ...drink,
                isDrink: true,
                strMealThumb: drink.strDrinkThumb,
                strMeal: drink.strDrink,
                idMeal: drink.idDrink,
            }))
            : []
        const spoonacularRecipesArray = Array.isArray(recipes) ? recipes : []

        const addSlug = (recipe) => ({
            ...recipe,
            slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
        })

        setAllRecipes([
            ...spoonacularRecipesArray.map(addSlug),
            ...mealDBRecipesArray.map(addSlug),
            ...cocktailDBRecipesArray.map(addSlug),
        ])
    }, [MealDBRecipes, CocktailDBDrinks, recipes])

    const handleInputChange = ({ target: { value } }) => {
        setInputString(value)
    }

    const handleAddIngredient = async () => {
        if (inputString.trim() === "") {
            setErrorMessage("Please enter valid ingredients.")
            return
        }

        // Parse ingredients first to determine singular or plural message
        const ingredientsArray = inputString
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)

        // Set custom loading message based on number of ingredients
        const isMultipleIngredients = ingredientsArray.length > 1
        const loadingMessage = isMultipleIngredients ? "ADDING INGREDIENTS..." : "ADDING INGREDIENT..."

        setIsSearching(true)
        setErrorMessage("")
        setLoadingText(loadingMessage) // Store loading message in state

        try {
            const duplicates = []
            const validationErrors = []
            const newIngredients = []

            const existingLower = ingredients.map((i) => i.toLowerCase())
            const uniqueInputs = [...new Set(ingredientsArray)]

            for (const ingredient of uniqueInputs) {
                const lowerIngredient = ingredient.toLowerCase()

                if (existingLower.includes(lowerIngredient)) {
                    duplicates.push(ingredient)
                    continue
                }

                const result = await getGaladrielResponse(ingredient, "validate")

                if (result.startsWith("Error:")) {
                    validationErrors.push(result)
                } else {
                    if (!existingLower.includes(result.toLowerCase())) {
                        newIngredients.push(result)
                    } else {
                        duplicates.push(ingredient)
                    }
                }
            }

            if (newIngredients.length > 0) {
                setIngredients((prev) => [...prev, ...newIngredients])

                // Save ingredients to localStorage for returning users
                const updatedIngredients = [...ingredients, ...newIngredients]
                localStorage.setItem("mealForgerIngredients", JSON.stringify(updatedIngredients))
            }

            const errorParts = []
            if (duplicates.length > 0) {
                errorParts.push(`Already added: ${duplicates.join(", ")}`)
            }
            if (validationErrors.length > 0) {
                errorParts.push(`Invalid: ${validationErrors.join(", ")}`)
            }

            if (errorParts.length > 0) {
                setErrorMessage(errorParts.join(". "))
            }
        } catch (error) {
            setErrorMessage("Failed to validate ingredients. Please try again.")
        } finally {
            setIsSearching(false)
            setInputString("")
            setLoadingText("") // Clear loading text when done
        }
    }

    const handleRemoveIngredient = (ingredientToRemove) => {
        const updatedIngredients = ingredients.filter((ingredient) => ingredient !== ingredientToRemove)
        setIngredients(updatedIngredients)

        // Update localStorage
        localStorage.setItem("mealForgerIngredients", JSON.stringify(updatedIngredients))
    }

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleAddIngredient()
        }
    }

    const handleSearch = async ({
                                    cookableOnly = false,
                                    strictMode = false,
                                    focusSearch = false,
                                    focusIngredient = null,
                                }) => {
        if (ingredients.length === 0) return

        setIsSearching(true)
        setLoadingText("GENERATING...") // Set the loading text to GENERATING
        setErrorMessage("") // Clear previous errors
        setFocusIngredient(focusIngredient || "")
        setShowFilters(false) // Hide filters after search

        // Clear existing recipes to prevent the flicker effect
        setAllRecipes([])

        // Track all our results
        let spoonacularResults = []
        let mealDBResults = []
        let cocktailResults = []
        let spoonacularError = false
        let otherAPIError = false

        // Try all APIs in parallel but handle errors individually
        await Promise.all([
            // 1. Spoonacular API call with explicit error handling
            (async () => {
                if (!apiLimitReached) {
                    try {
                        const results = await getRecipes(ingredients, selectedDiet, {
                            cookableOnly,
                            strictMode,
                            focusIngredient,
                        })
                        spoonacularResults = Array.isArray(results) ? results : []
                    } catch (error) {
                        console.error("Spoonacular error:", error)
                        spoonacularError = true
                        // Mark API as limited if rate limit error
                        if (
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

            // 2. MealDB API call
            (async () => {
                try {
                    const results = await getMealDBRecipes(ingredients)
                    mealDBResults = Array.isArray(results) ? results : []
                } catch (error) {
                    console.error("MealDB error:", error)
                    otherAPIError = true
                }
            })(),

            // 3. CocktailDB API call
            (async () => {
                try {
                    const results = await getCocktailDBDrinks(ingredients)
                    cocktailResults = Array.isArray(results) ? results : []
                } catch (error) {
                    console.error("CocktailDB error:", error)
                    otherAPIError = true
                }
            })(),
        ])

        // Combine all results, ensuring each array is valid
        const allResults = [...spoonacularResults, ...mealDBResults, ...cocktailResults]

        // Add slugs to all recipes
        const resultsWithSlugs = allResults.map((recipe) => ({
            ...recipe,
            slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
        }))

        // Set state with all valid results
        setAllRecipes(resultsWithSlugs)

        // Handle error messages but don't block displaying results
        if (spoonacularError && apiLimitReached && (mealDBResults.length > 0 || cocktailResults.length > 0)) {
            // Spoonacular failed but we have fallback results
            setErrorMessage("Using fallback recipes (Spoonacular limit reached)")
        } else if (spoonacularError && otherAPIError && allResults.length === 0) {
            // All APIs failed and we have no results
            setErrorMessage("Failed to fetch recipes from all sources. Please try again.")
        }

        setIsSearching(false)
        setLoadingText("") // Clear loading text when done
    }

    const handleQuickSearch = (category) => {
        setSelectedCategory(category)
        setCategoryDialogOpen(true)
    }

    const handleCategorySearch = async (specificIngredient) => {
        setCategoryDialogOpen(false)
        setIsSearching(true)
        setApiLimitReached(false)
        setErrorMessage("")
        setLoadingText("SEARCHING...")

        let searchQuery = specificIngredient || selectedCategory

        if (!specificIngredient && categoryIngredients[selectedCategory]) {
            const chosenFood = Math.random() < 0.5
            if (chosenFood && categoryIngredients[selectedCategory].mealDB.length > 0) {
                const randomIndex = Math.floor(Math.random() * categoryIngredients[selectedCategory].mealDB.length)
                searchQuery = categoryIngredients[selectedCategory].mealDB[randomIndex]
            } else if (categoryIngredients[selectedCategory].spoonacular.length > 0) {
                const randomIndex = Math.floor(Math.random() * categoryIngredients[selectedCategory].spoonacular.length)
                searchQuery = categoryIngredients[selectedCategory].spoonacular[randomIndex]
            }
        }

        setIngredients([searchQuery])

        // Save to localStorage
        localStorage.setItem("mealForgerIngredients", JSON.stringify([searchQuery]))

        try {
            let mealDBRecipes = []
            let spoonacularRecipes = []
            let cocktailResults = []

            // Only try Spoonacular if not limited
            if (!apiLimitReached) {
                try {
                    spoonacularRecipes = await getRecipes([searchQuery], selectedDiet)
                } catch (error) {
                    const errorMsg = String(error)
                    if (errorMsg.includes("402") || errorMsg.includes("429") || errorMsg.includes("quota")) {
                        setApiLimitReached(true)
                    }
                }
            }

            // Always try MealDB and CocktailDB
            try {
                ;[mealDBRecipes, cocktailResults] = await Promise.all([
                    getMealDBRecipes([searchQuery]),
                    getCocktailDBDrinks([searchQuery]),
                ])
            } catch (error) {
                console.error("API error:", error)
            }

            const combinedRecipes = [
                ...(Array.isArray(mealDBRecipes) ? mealDBRecipes : []),
                ...(Array.isArray(spoonacularRecipes) ? spoonacularRecipes : []),
                ...(Array.isArray(cocktailResults) ? cocktailResults : []),
            ]

            // Add slugs to all recipes
            const recipesWithSlugs = combinedRecipes.map((recipe) => ({
                ...recipe,
                slug: slugify(recipe.strMeal || recipe.strDrink || recipe.title || "recipe"),
            }))

            setAllRecipes(recipesWithSlugs)
        } catch (error) {
            console.error("Error during quick search:", error)
            setErrorMessage("An unexpected error occurred.")
        } finally {
            setIsSearching(false)
            setLoadingText("")
        }
    }

    const clickHandler = (recipe) => {
        const currentPath = window.location.pathname
        const recipeName = recipe.strDrink || recipe.strMeal || recipe.title || "recipe"
        const recipeSlug = recipe.slug || slugify(recipeName)

        // Store the recipe ID in the state object
        if (recipe.isDrink) {
            navigate(`/drink/${recipeSlug}`, {
                state: {
                    drink: recipe,
                    userIngredients: ingredients,
                    allRecipes: allRecipes,
                    previousPath: currentPath,
                    // Store the ID explicitly
                    recipeId: recipe.idDrink,
                },
            })
        } else if (recipe.idMeal) {
            navigate(`/mealdb-recipe/${recipeSlug}`, {
                state: {
                    meal: recipe,
                    userIngredients: ingredients,
                    allRecipes: allRecipes,
                    previousPath: currentPath,
                    // Store the ID explicitly
                    recipeId: recipe.idMeal,
                },
            })
        } else {
            navigate(`/recipe/${recipeSlug}`, {
                state: {
                    recipe,
                    userIngredients: ingredients,
                    allRecipes: allRecipes,
                    previousPath: currentPath,
                    // Store the ID explicitly
                    recipeId: recipe.id,
                },
            })
        }
    }

    const handleRandomRecipeClick = (recipe) => {
        const currentPath = window.location.pathname
        const recipeSlug = recipe.slug || slugify(recipe.strMeal)

        navigate(`/mealdb-recipe/${recipeSlug}`, {
            state: {
                meal: recipe,
                userIngredients: ingredients,
                allRecipes: randomRecipes,
                previousPath: currentPath,
                // Store the ID explicitly
                recipeId: recipe.idMeal,
            },
        })
    }

    // Load saved ingredients from localStorage on component mount
    useEffect(() => {
        const savedIngredients = localStorage.getItem("mealForgerIngredients")
        if (savedIngredients) {
            try {
                const parsedIngredients = JSON.parse(savedIngredients)
                if (Array.isArray(parsedIngredients) && parsedIngredients.length > 0) {
                    setIngredients(parsedIngredients)
                    // Automatically search for recipes with the loaded ingredients
                    setTimeout(() => {
                        handleSearch({ cookableOnly: false, strictMode: false })
                    }, 500)
                }
            } catch (error) {
                console.error("Error parsing saved ingredients:", error)
            }
        }
    }, [])

    const getDifficultyLevel = (recipe) => {
        if (recipe.readyInMinutes) {
            if (recipe.readyInMinutes <= 20) return "Easy"
            if (recipe.readyInMinutes <= 40) return "Medium"
            return "Hard"
        }

        // Default to medium if no time information
        return "Medium"
    }

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

    // Get unique feature for recipe
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

    return (
        <div className="flex flex-col min-h-screen bg-[#131415] text-[#f5efe4]">
            {/* Header */}
            <header className="py-4 md:py-6">
                <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col items-center">
                    <img src={MealForgerLogo || "/placeholder.svg"} alt="Meal Forger" className="h-20 mb-6" />

                    <div className="relative w-full max-w-2xl mb-6">
                        <Input
                            type="text"
                            placeholder="Enter an ingredient ....."
                            className="w-full bg-transparent border-2 border-gray-600 rounded-full py-4 px-5 text-white pl-14 pr-14 focus:border-[#ce7c1c] transition-all duration-300 text-lg"
                            value={inputString}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 bg-[#ce7c1c]/20 p-2 rounded-full">
                            <Search className="h-5 w-5 text-[#ce7c1c]" />
                        </div>
                        <Button
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white p-0 text-lg font-medium grid place-items-center transition-all duration-300 transform hover:scale-110"
                            onClick={handleAddIngredient}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        className="border-2 border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/20 px-8 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 mb-6"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        FILTERS
                    </Button>

                    {showFilters && (
                        <div className="w-full max-w-2xl mb-6">
                            <CookableSearch
                                onSearch={handleSearch}
                                ingredients={ingredients}
                                selectedDiet={selectedDiet}
                                isSearching={isSearching}
                                focusIngredient={focusIngredient}
                            />
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-grow">
                <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-16">
                    {" "}
                    {/* Added pb-16 for extra padding at bottom */}
                    <h1 className="text-3xl font-bold mb-6 text-center font-title">
                        <span className="text-[#ce7c1c]">Discover</span> Recipes With What You Have
                    </h1>
                    {/* Popular Recipes - Horizontal Scrolling */}
                    {randomRecipes.length > 0 && (
                        <div className="mb-8">
                            <div className="flex flex-col items-center mb-4">
                                <h2 className="text-2xl font-bold font-title text-center mb-2">
                                    <span className="text-[#ce7c1c]">POPULAR</span> RECIPES
                                </h2>
                            </div>

                            <div
                                id="popular-recipes-scroll"
                                className="flex overflow-x-auto pb-4 space-x-4 scrollbar-thin scrollbar-thumb-[#ce7c1c] scrollbar-track-gray-800 -mx-2 px-2 justify-center"
                                style={{ scrollbarWidth: "thin" }}
                            >
                                {randomRecipes.map((recipe) => (
                                    <Card
                                        key={recipe.idMeal}
                                        className="flex-shrink-0 w-[220px] overflow-hidden border-2 border-gray-700 bg-gray-900/50 rounded-2xl hover:shadow-lg hover:shadow-[#ce7c1c]/20 transition-all duration-300 cursor-pointer"
                                        onClick={() => handleRandomRecipeClick(recipe)}
                                    >
                                        <div className="p-3">
                                            <div className="mb-2">
                                                <img
                                                    src={recipe.strMealThumb || "/placeholder.svg"}
                                                    alt={recipe.strMeal}
                                                    className="w-full h-32 object-cover rounded-xl"
                                                />
                                            </div>
                                            <h3 className="text-sm font-bold mb-1 font-title line-clamp-1 text-center">{recipe.strMeal}</h3>
                                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                                {recipe.strCategory && (
                                                    <div className="flex items-center">
                                                        <ChefHat className="h-3 w-3 mr-1 text-[#ce7c1c]" />
                                                        <span className="font-terminal text-xs">{recipe.strCategory}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                        {/* Left Column - QUICK ADD */}
                        <div className="col-span-1 md:col-span-3 space-y-6">
                            <div className="flex flex-col w-full">
                                <h3 className="text-2xl font-bold mb-5 font-title text-center">
                                    <span className="text-white">QUICK</span> <span className="text-[#ce7c1c]">ADD</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    {popularIngredients.map((item, index) => (
                                        <Button
                                            key={index}
                                            className={`flex flex-col items-center justify-center h-16 bg-transparent border border-white hover:border-[#ce7c1c] hover:bg-gray-800 rounded-xl cursor-pointer group transition-all duration-300 transform hover:scale-105 p-1`}
                                            onClick={() => handleQuickSearch(item.name)}
                                        >
                                            <item.icon className={`text-xl ${item.color} mb-1 transition-colors duration-300`} />
                                            <span className="text-sm font-terminal text-white group-hover:text-[#ce7c1c] transition-colors duration-300">
                        {item.name}
                      </span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - MY PANTRY and RECIPES */}
                        <div className="col-span-1 md:col-span-6 space-y-6">
                            {/* MY PANTRY */}
                            <div className="bg-gray-900/50 rounded-3xl border-2 border-gray-700 p-4 md:p-6 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300 mb-6">
                                <h2 className="text-2xl font-bold mb-5 font-title text-center">
                                    <span className="text-[#ce7c1c]">MY</span> <span className="text-white">PANTRY</span>
                                </h2>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {ingredients.length === 0 ? (
                                        <div className="text-center py-6 w-full">
                                            <p className="text-gray-400 font-terminal mb-2">No ingredients added yet.</p>
                                            <p className="text-gray-400 font-terminal">Add ingredients to discover recipes you can make!</p>
                                        </div>
                                    ) : (
                                        ingredients.map((item, index) => (
                                            <div key={index} className="flex items-center bg-gray-800 rounded-full px-3 py-1">
                                                <span className="mr-2 font-terminal text-sm">{item}</span>
                                                <button
                                                    onClick={() => handleRemoveIngredient(item)}
                                                    className="text-[#ce7c1c] hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-full p-1 transition-all duration-200"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* RECIPES */}
                            <div className="bg-gray-900/50 rounded-3xl border-2 border-gray-700 p-4 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300 flex flex-col">
                                <h2 className="text-2xl font-bold mb-5 font-title text-center">
                                    <span className="text-[#ce7c1c]">RE</span>
                                    <span className="text-white">CIPES</span>
                                </h2>

                                {isSearching ? (
                                    <div className="flex flex-col items-center justify-center py-12 flex-grow">
                                        <Sparkles className="h-16 w-16 mb-6 text-[#ce7c1c] animate-pulse" />
                                        <p className="text-gray-400 font-terminal">{loadingText || "Finding recipes..."}</p>
                                    </div>
                                ) : ingredients.length === 0 ? (
                                    <div className="text-center py-12 flex-grow">
                                        <p className="text-gray-400 font-terminal mb-4">No recipes to display</p>
                                    </div>
                                ) : allRecipes.length === 0 ? (
                                    <div className="text-center py-12 flex-grow">
                                        <p className="text-gray-400 font-terminal">
                                            No recipes found with your ingredients. Try adding more!
                                        </p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[350px] pr-2 mb-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            {allRecipes.map((recipe) => {
                                                const title = recipe.title || recipe.strMeal || recipe.strDrink
                                                const image = recipe.image || recipe.strMealThumb || recipe.strDrinkThumb
                                                const cookTime = getCookingTime(recipe)
                                                const servings = getServings(recipe)
                                                const uniqueFeature = getUniqueFeature(recipe)

                                                return (
                                                    <Card
                                                        key={recipe.id || recipe.idMeal || recipe.idDrink}
                                                        className="overflow-hidden border border-gray-700 bg-gray-900/50 rounded-xl hover:shadow-md hover:shadow-[#ce7c1c]/20 transition-all duration-300 cursor-pointer mb-3"
                                                        onClick={() => clickHandler(recipe)}
                                                    >
                                                        <div className="p-3 md:p-4">
                                                            <div className="flex">
                                                                <div className="w-1/3">
                                                                    <img
                                                                        src={image || "/placeholder.svg"}
                                                                        alt={title}
                                                                        className="w-full h-24 object-cover rounded-lg"
                                                                    />
                                                                </div>
                                                                <div className="w-2/3 pl-3">
                                                                    <h3 className="text-sm font-bold mb-1 font-title line-clamp-2">{title}</h3>
                                                                    <div className="flex flex-wrap items-center gap-1 text-xs text-gray-400">
                                                                        <div className="flex items-center">
                                                                            <Clock className="h-3 w-3 mr-1 text-[#ce7c1c]" />
                                                                            <span className="font-terminal text-xs">{cookTime}</span>
                                                                        </div>
                                                                        <span className="mx-1 text-[#ce7c1c]">•</span>
                                                                        <div className="flex items-center">
                                                                            <Users className="h-3 w-3 mr-1 text-[#ce7c1c]" />
                                                                            <span className="font-terminal text-xs">{servings}</span>
                                                                        </div>

                                                                        {uniqueFeature && (
                                                                            <>
                                                                                <span className="mx-1 text-[#ce7c1c]">•</span>
                                                                                <span className="font-terminal text-xs bg-[#ce7c1c]/20 px-2 py-0.5 rounded-full">
                                          {uniqueFeature}
                                        </span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    </ScrollArea>
                                )}

                                {/* Generate Button inside the recipes section */}
                                <Button
                                    className="w-full border-2 border-[#ce7c1c] bg-[#ce7c1c]/10 hover:bg-[#ce7c1c]/30 text-[#ce7c1c] px-6 py-3 font-terminal rounded-full cursor-pointer text-lg font-bold shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/30 transform hover:scale-105 transition-all duration-300 mt-auto"
                                    onClick={() => handleSearch({ cookableOnly: false, strictMode: false })}
                                    disabled={isSearching || ingredients.length === 0}
                                >
                                    {isSearching ? "Generating..." : "Generate Recipes"}
                                </Button>

                                {errorMessage && <div className="text-red-500 text-center mt-4 font-terminal">{errorMessage}</div>}
                            </div>
                        </div>

                        {/* Right Column - MY DIET */}
                        <div className="col-span-1 md:col-span-3 space-y-6">
                            <div className="flex flex-col w-full">
                                <h2 className="text-2xl font-bold mb-5 font-title text-center">
                                    <span className="text-[#ce7c1c]">MY</span> <span className="text-white">DIET</span>
                                </h2>
                                <div className="flex flex-col space-y-3 md:space-y-4">
                                    {["KETOGENIC", "PALEO", "GLUTEN FREE", "VEGAN", "VEGETARIAN"].map((diet, index) => {
                                        const dietValue = diet.toLowerCase().replace(" ", "-")
                                        return (
                                            <Button
                                                key={index}
                                                className={`py-3 font-title diet-button border-2 ${
                                                    selectedDiet === dietValue
                                                        ? "bg-[#ce7c1c] text-white font-bold shadow-lg shadow-[#ce7c1c]/30"
                                                        : "border-[#ce7c1c] bg-transparent hover:bg-[#ce7c1c]/20 text-white font-bold"
                                                } rounded-3xl cursor-pointer text-lg transform hover:scale-[1.02] transition-all duration-300`}
                                                onClick={() => setSelectedDiet(selectedDiet === dietValue ? null : dietValue)}
                                            >
                                                {diet}
                                            </Button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Category Selection Dialog */}
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="bg-[#1e1e1e] border-2 border-[#ce7c1c] text-white max-w-md rounded-3xl shadow-2xl">
                    <DialogTitle className="text-center text-xl font-title mb-2 text-[#ce7c1c]">
                        {selectedCategory} Recipes
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-300 mb-6 font-terminal">
                        Would you like to search for a specific {selectedCategory} ingredient or let us choose for you?
                    </DialogDescription>

                    <div className="space-y-4">
                        {/* Surprise Me Button */}
                        <Button
                            variant="default"
                            onClick={() => handleCategorySearch(selectedCategory)}
                            className="w-full py-6 text-lg font-terminal font-bold bg-[#ce7c1c] hover:bg-[#ce7c1c]/80 rounded-full transform hover:scale-105 transition-all duration-300"
                        >
                            Surprise Me
                        </Button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-700" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-3 bg-[#1e1e1e] text-sm text-gray-400 uppercase">OR CHOOSE SPECIFIC</span>
                            </div>
                        </div>

                        {/* Ingredient Grid */}
                        {selectedCategory && categoryIngredients[selectedCategory] && (
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ...categoryIngredients[selectedCategory].mealDB,
                                    ...categoryIngredients[selectedCategory].spoonacular,
                                ].map((ingredient) => (
                                    <Button
                                        key={ingredient}
                                        variant="outline"
                                        onClick={() => handleCategorySearch(ingredient)}
                                        className="py-4 font-terminal hover:bg-[#ce7c1c]/20 border-[#ce7c1c] text-white rounded-xl transform hover:scale-105 transition-all duration-300"
                                    >
                                        {ingredient}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Error Message */}
            {errorMessage && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                    <Alert className="bg-red-950 border-red-800 text-white rounded-xl shadow-lg">
                        <InfoIcon className="h-4 w-4 text-red-300" />
                        <AlertDescription className="font-medium font-terminal">{errorMessage}</AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    )
}

export default UserInput
