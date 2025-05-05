"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { slugify } from "./utils/slugify"
import "@/fonts/fonts.css"

import useFetchMeals from "./GetMeals.jsx"
import useTheMealDB from "./getTheMealDB.jsx"
import useTheCocktailDB from "./GetCocktailDB.jsx"

import { ChevronLeft, ChevronRight, InfoIcon, Search, Plus, Sparkles } from "lucide-react"

import { batchGaladrielResponse, getGaladrielResponse } from "@/getGaladrielResponse.jsx"

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
import { BiDrink } from "react-icons/bi"

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
        size: "w-16 h-16",
    },
    {
        name: "Bread",
        icon: GiSlicedBread,
        color: "text-amber-600 group-hover:text-amber-700",
        size: "w-16 h-16",
    },
    {
        name: "Vegetables",
        icon: GiCarrot,
        color: "text-green-800 group-hover:text-green-600",
        size: "w-16 h-16",
    },
    {
        name: "Beef",
        icon: GiSteak,
        color: "text-red-500 group-hover:text-red-600",
        size: "w-16 h-16",
    },
    {
        name: "Fish",
        icon: GiFishCooked,
        color: "text-blue-400 group-hover:text-blue-500",
        size: "w-16 h-16",
    },
    {
        name: "Cheese",
        icon: GiCheeseWedge,
        color: "text-yellow-300 group-hover:text-yellow-400",
        size: "w-16 h-16",
    },
    {
        name: "Fruit",
        icon: GiFruitBowl,
        color: "text-pink-500 group-hover:text-pink-600",
        size: "w-16 h-16",
    },
    {
        name: "Chicken",
        icon: GiRoastChicken,
        color: "text-orange-400 group-hover:text-orange-500",
        size: "w-16 h-16",
    },
]

const stripHtml = (html) => {
    if (!html) {
        return ""
    }
    return html.replace(/<\/?[^>]+(>|$)/g, "")
}

const Pagination = ({ recipesPerPage, totalRecipes, paginate, currentPage }) => {
    const pageNumbers = []
    const totalPages = Math.ceil(totalRecipes / recipesPerPage)

    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
    }

    return (
        <nav className="flex justify-center mt-4">
            <ul className="flex space-x-2">
                <li>
                    <Button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="icon"
                        className="rounded-full hover:bg-[#ce7c1c]/20 hover:border-[#ce7c1c] transition-all duration-300"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </li>
                {pageNumbers.map((number) => (
                    <li key={number}>
                        <Button
                            onClick={() => paginate(number)}
                            variant={currentPage === number ? "default" : "outline"}
                            className={`rounded-full transition-all duration-300 ${
                                currentPage === number
                                    ? "bg-[#ce7c1c] hover:bg-[#ce7c1c]/90"
                                    : "hover:bg-[#ce7c1c]/20 hover:border-[#ce7c1c]"
                            }`}
                        >
                            {number}
                        </Button>
                    </li>
                ))}
                <li>
                    <Button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="icon"
                        className="rounded-full hover:bg-[#ce7c1c]/20 hover:border-[#ce7c1c] transition-all duration-300"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </li>
            </ul>
        </nav>
    )
}

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
    const [currentPage, setCurrentPage] = useState(1)
    const recipesPerPage = 5
    const navigate = useNavigate()
    const [recipeType, setRecipeType] = useState("all")

    const [showInput, setShowInput] = useState(true)
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [cookableOnly, setCookableOnly] = useState(false)
    const [strictMode, setStrictMode] = useState(false)
    const [focusSearch, setFocusSearch] = useState(false)
    const [isSpoonacularLimited, setIsSpoonacularLimited] = useState(false)
    const [focusIngredient, setFocusIngredient] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [loadingText, setLoadingText] = useState("")
    const [randomRecipes, setRandomRecipes] = useState([])
    const [loadingRandomRecipes, setLoadingRandomRecipes] = useState(true)
    const apiKey = import.meta.env.VITE_MEALDB_KEY

    // Fetch random recipes on initial load
    useEffect(() => {
        const fetchRandomRecipes = async () => {
            try {
                setLoadingRandomRecipes(true)
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

    const paginate = (pageNumber) => setCurrentPage(pageNumber)

    const { currentRecipes, indexOfFirstRecipe, indexOfLastRecipe } = useMemo(() => {
        const indexOfLastRecipe = currentPage * recipesPerPage
        const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage
        const currentRecipes = allRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe)

        return { currentRecipes, indexOfFirstRecipe, indexOfLastRecipe }
    }, [allRecipes, currentPage, recipesPerPage])
    

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
        setFocusSearch(focusSearch)
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
                            setIsSpoonacularLimited(true)
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
        setCurrentPage(1)

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
                        setIsSpoonacularLimited(true)
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
            setCurrentPage(1)
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

    useEffect(() => {
        if (errorMessage) {
            setShowInput(false)
            const timer = setTimeout(() => {
                setShowInput(true)
                setErrorMessage("")
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [errorMessage])

    // Load saved ingredients from localStorage on component mount
    useEffect(() => {
        const savedIngredients = localStorage.getItem("mealForgerIngredients")
        if (savedIngredients) {
            try {
                const parsedIngredients = JSON.parse(savedIngredients)
                if (Array.isArray(parsedIngredients) && parsedIngredients.length > 0) {
                    setIngredients(parsedIngredients)
                }
            } catch (error) {
                console.error("Error parsing saved ingredients:", error)
            }
        }
    }, [])

    const RecipeCard = ({ recipe, onClick }) => (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors rounded-3xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl">
                    <CardContent className="p-4">
                        <img
                            src={recipe.image || recipe.strMealThumb || recipe.strDrinkThumb || "/placeholder.svg"}
                            alt={recipe.title || recipe.strMeal || recipe.strDrink}
                            className="w-full h-32 object-cover rounded-2xl mb-3"
                        />
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-gray-300 text-sm line-clamp-2">
                                {recipe.title || recipe.strMeal || recipe.strDrink}
                            </h4>
                            {recipe.isDrink && (
                                <div className="flex items-center">
                                    <BiDrink className="text-blue-400 h-5 w-5" />
                                    {recipe.strAlcoholic === "Non alcoholic" || recipe.strAlcoholic === "Non Alcoholic" ? (
                                        <span className="text-xs text-green-400 ml-1">Non-Alc</span>
                                    ) : (
                                        <span className="text-xs text-purple-400 ml-1">Alcoholic</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </DialogTrigger>

            <DialogContent className="bg-gray-800 text-white rounded-3xl border-2 border-[#ce7c1c]">
                <DialogTitle className="font-medium text-gray-300 text-lg flex items-center">
                    {recipe.title || recipe.strMeal || recipe.strDrink}
                    {recipe.isDrink && (
                        <div className="flex items-center ml-2">
                            <BiDrink className="text-blue-400 h-5 w-5" />
                            {recipe.strAlcoholic === "Non alcoholic" || recipe.strAlcoholic === "Non Alcoholic" ? (
                                <span className="text-xs text-green-400 ml-1">Non-Alcoholic</span>
                            ) : (
                                <span className="text-xs text-purple-400 ml-1">Alcoholic</span>
                            )}
                        </div>
                    )}
                </DialogTitle>
                <DialogDescription asChild>
                    <div className="text-white font-bold">
                        <div className="space-y-4">
                            <div className="relative w-full pb-[56.25%] overflow-hidden rounded-2xl">
                                <img
                                    src={recipe.image || recipe.strMealThumb || recipe.strDrinkThumb || "/placeholder.svg"}
                                    alt={recipe.title || recipe.strMeal || recipe.strDrink}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                            <p className="mb-4">{stripHtml(recipe.summary) || "No summary available."}</p>
                            <Button
                                onClick={() => onClick(recipe)}
                                className="w-full font-bold bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 rounded-full py-6 transform hover:scale-105 transition-all duration-300"
                            >
                                View Full Recipe
                            </Button>
                        </div>
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    )

    return (
        <div className="full-height-container bg-[#131415] text-[#f5efe4]">
            {/* Header */}
            <div className="w-full max-w-7xl mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <img
                            src={MealForgerLogo || "/placeholder.svg"}
                            alt="Meal Forger Logo"
                            className="h-24 transform hover:scale-105 transition-all duration-300"
                        />
                    </div>
                    <div className="relative w-full max-w-md mx-auto">
                        <div className="relative w-full">
                            <Input
                                type="text"
                                placeholder="Enter an ingredient ....."
                                className="w-full bg-transparent border-2 border-gray-600 rounded-full py-3 px-5 text-white pl-12 pr-12 focus:border-[#ce7c1c] transition-all duration-300"
                                value={inputString}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 bg-[#ce7c1c]/20 p-2 rounded-full">
                                <Search className="h-4 w-4 text-[#ce7c1c]" />
                            </div>
                            <Button
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white p-0 text-lg font-medium grid place-items-center transition-all duration-300 transform hover:scale-110"
                                onClick={handleAddIngredient}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        className="border-2 border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/20 px-8 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        FILTERS
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="w-full max-w-7xl mx-auto px-6">
                    <CookableSearch
                        onSearch={handleSearch}
                        ingredients={ingredients}
                        selectedDiet={selectedDiet}
                        isSearching={isSearching}
                        focusIngredient={focusIngredient}
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 px-6 py-6 flex-grow">
                {/* Left Column - MY PANTRY */}
                <div className="flex flex-col w-full md:w-1/3 mb-6 md:mb-0">
                    <h2 className="section-heading font-title">
                        <span className="text-accent">MY</span> PANTRY
                    </h2>
                    <div className="border-2 border-gray-700 rounded-3xl p-6 mb-6 min-h-[200px] md:min-h-[300px] bg-gray-900/50 flex-grow shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
                        {ingredients.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-gray-500 font-terminal">
                                    YOU HAVE NOT ADDED
                                    <br />
                                    ANY INGREDIENTS
                                </div>
                            </div>
                        ) : (
                            ingredients.map((item, index) => (
                                <div
                                    key={index}
                                    className="mb-3 text-xl flex justify-between items-center font-terminal text-text p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors duration-200"
                                >
                                    {item}
                                    <button
                                        onClick={() => handleRemoveIngredient(item)}
                                        className="text-accent hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-full p-1 transition-all duration-200"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4">
                        <h3 className="section-heading font-title">
                            <span className="text-text">QUICK</span> <span className="text-accent">ADD</span>
                        </h3>
                        <div className="border-2 border-gray-700 rounded-3xl p-6 bg-gray-900/50 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
                            <div className="grid grid-cols-4 gap-4">
                                {popularIngredients.map((item, index) => (
                                    <Button
                                        key={index}
                                        className={`flex flex-col items-center justify-center h-20 bg-transparent border-2 border-white hover:border-[#ce7c1c] hover:bg-gray-800 rounded-2xl cursor-pointer group transition-all duration-300 transform hover:scale-105`}
                                        onClick={() => handleQuickSearch(item.name)}
                                    >
                                        <item.icon className={`text-2xl ${item.color} mb-1 transition-colors duration-300`} />
                                        <span className="text-xs font-terminal text-white group-hover:text-[#ce7c1c] transition-colors duration-300">
                      {item.name}
                    </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Column - RECIPES */}
                <div className="flex flex-col w-full md:w-1/3 mb-6 md:mb-0">
                    <h2 className="section-heading font-title">
                        <span className="text-accent">RECIPES</span>
                    </h2>
                    <div className="border-2 border-gray-700 rounded-3xl p-6 mb-4 bg-gray-900/50 flex flex-col flex-grow min-h-[400px] md:min-h-[600px] shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Sparkles className="h-16 w-16 mb-6 text-[#ce7c1c] animate-pulse" />
                                <div className="text-xl font-terminal text-[#ce7c1c]">{loadingText || "SEARCHING..."}</div>
                            </div>
                        ) : ingredients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 font-terminal">
                                <img
                                    src={MealForgerLogo || "/placeholder.svg"}
                                    alt="Meal Forger Logo"
                                    className="h-16 mb-6 animate-pulse"
                                />
                                <div>
                                    YOU HAVE NOTHING
                                    <br />
                                    IN YOUR PANTRY!
                                    <br />
                                    <br />
                                    TRY ADDING INGREDIENTS
                                    <br />
                                    .....
                                </div>
                            </div>
                        ) : allRecipes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 font-terminal">
                                <Sparkles className="h-16 w-16 mb-6 text-[#ce7c1c]/50 animate-pulse" />
                                <div>
                                    NO RECIPES FOUND
                                    <br />
                                    WITH YOUR INGREDIENTS
                                    <br />
                                    <br />
                                    TRY ADDING MORE INGREDIENTS
                                    <br />
                                    .....
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow overflow-auto recipe-scroll">
                                {currentRecipes.map((recipe) => (
                                    <div
                                        key={recipe.id || recipe.idMeal || recipe.idDrink}
                                        className="mb-4 bg-[#1e1e1e] rounded-2xl overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-lg"
                                        onClick={() => clickHandler(recipe)}
                                    >
                                        <div className="flex">
                                            <div className="w-1/3">
                                                <img
                                                    src={recipe.image || recipe.strMealThumb || recipe.strDrinkThumb || "/placeholder.svg"}
                                                    alt={recipe.title || recipe.strMeal || recipe.strDrink}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="w-2/3 p-4 flex items-center justify-between">
                                                <div className="text-lg font-terminal text-text">
                                                    {recipe.title || recipe.strMeal || recipe.strDrink}
                                                </div>
                                                {recipe.isDrink && (
                                                    <div className="flex items-center ml-2">
                                                        <BiDrink className="text-blue-400 h-5 w-5" />
                                                        {recipe.strAlcoholic === "Non alcoholic" || recipe.strAlcoholic === "Non Alcoholic" ? (
                                                            <span className="text-xs text-green-400 ml-1">Non-Alc</span>
                                                        ) : (
                                                            <span className="text-xs text-purple-400 ml-1">Alcoholic</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {allRecipes.length > recipesPerPage && (
                            <div className="mt-4">
                                <Pagination
                                    recipesPerPage={recipesPerPage}
                                    totalRecipes={allRecipes.length}
                                    paginate={paginate}
                                    currentPage={currentPage}
                                />
                            </div>
                        )}

                        <div className="mt-6">
                            <Button
                                className="border-2 border-[#ce7c1c] bg-[#ce7c1c]/10 hover:bg-[#ce7c1c]/30 text-[#ce7c1c] px-8 py-4 font-terminal rounded-full cursor-pointer w-full text-xl font-bold shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/30 transform hover:scale-105 transition-all duration-300"
                                onClick={() => handleSearch({ cookableOnly: false, strictMode: false })}
                                disabled={isSearching || ingredients.length === 0}
                            >
                                {isSearching ? "Generating..." : "Generate"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column - MY DIET */}
                <div className="flex flex-col w-full md:w-1/3">
                    <h2 className="section-heading font-title">
                        <span className="text-accent">MY</span> DIET
                    </h2>
                    <div className="flex flex-col space-y-6 py-4 flex-grow">
                        {["KETOGENIC", "PALEO", "GLUTEN FREE", "VEGAN", "VEGETARIAN"].map((diet, index) => {
                            const dietValue = diet.toLowerCase().replace(" ", "-")
                            return (
                                <Button
                                    key={index}
                                    className={`w-full py-5 font-title diet-button border-2 ${
                                        selectedDiet === dietValue
                                            ? "bg-[#ce7c1c] text-white font-bold shadow-lg shadow-[#ce7c1c]/30"
                                            : "border-[#ce7c1c] bg-transparent hover:bg-[#ce7c1c]/20 text-white font-bold"
                                    } rounded-3xl cursor-pointer text-xl transform hover:scale-[1.02] transition-all duration-300`}
                                    onClick={() => setSelectedDiet(selectedDiet === dietValue ? null : dietValue)}
                                >
                                    {diet}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Popular Recipes Section - Only shown for first-time users */}
            {randomRecipes.length > 0 && (
                <div className="w-full max-w-7xl mx-auto px-6 py-8">
                    <h2 className="text-3xl font-title mb-6 text-center">
                        <span className="text-[#ce7c1c]">POPULAR</span> RECIPES
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {randomRecipes.slice(0, 6).map((recipe) => (
                            <Card
                                key={recipe.idMeal}
                                className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors rounded-3xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
                                onClick={() => handleRandomRecipeClick(recipe)}
                            >
                                <CardContent className="p-0">
                                    <div className="relative">
                                        <img
                                            src={recipe.strMealThumb || "/placeholder.svg"}
                                            alt={recipe.strMeal}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                            <h3 className="text-white font-terminal text-lg">{recipe.strMeal}</h3>
                                            <div className="flex items-center mt-1">
                                                <span className="text-sm text-gray-300 font-terminal">{recipe.strCategory}</span>
                                                <span className="mx-2 text-gray-500">•</span>
                                                <span className="text-sm text-gray-300 font-terminal">{recipe.strArea}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

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
                    <Alert className="bg-red-950 border-red-800 text-white rounded-xl shadow-lg animate-bounce">
                        <InfoIcon className="h-4 w-4 text-red-300" />
                        <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    )
}

export default UserInput
