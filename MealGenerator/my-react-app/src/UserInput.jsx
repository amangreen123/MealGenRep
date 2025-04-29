"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AI_CONFIG } from "@/ai.js"
import "@/fonts/fonts.css"

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import useFetchMeals from "./GetMeals.jsx"
import useTheMealDB from "./getTheMealDB.jsx"
import useTheCocktailDB from "./GetCocktailDB.jsx"

import { ChevronLeft, ChevronRight, InfoIcon } from "lucide-react"

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

const debugCache = () => {
    const cachedSummaries = JSON.parse(localStorage.getItem("recipeSummaries")) || {}
    return Object.keys(cachedSummaries).length
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
                    <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </li>
                {pageNumbers.map((number) => (
                    <li key={number}>
                        <Button onClick={() => paginate(number)} variant={currentPage === number ? "default" : "outline"}>
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

        setAllRecipes([...spoonacularRecipesArray, ...mealDBRecipesArray, ...cocktailDBRecipesArray])
    }, [MealDBRecipes, CocktailDBDrinks, recipes])

    const paginate = (pageNumber) => setCurrentPage(pageNumber)

    const { currentRecipes, indexOfFirstRecipe, indexOfLastRecipe } = useMemo(() => {
        const indexOfLastRecipe = currentPage * recipesPerPage
        const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage
        const currentRecipes = allRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe)

        return { currentRecipes, indexOfFirstRecipe, indexOfLastRecipe }
    }, [allRecipes, currentPage, recipesPerPage])

    useEffect(() => {
        if (currentRecipes.length > 0) {
            const recipeNeedingSummaries = currentRecipes.filter((recipe) => {
                const dishName = recipe.strMeal || recipe.strDrink || recipe.title
                return dishName && !recipe.summary
            })

            if (recipeNeedingSummaries.length > 0) {
                generateSummaries(recipeNeedingSummaries)
            }
        }
    }, [currentPage, allRecipes.length])

    const generateSummaries = async (recipes) => {
        const cachedSummaries = JSON.parse(localStorage.getItem("recipeSummaries")) || {}
        const uncachedRecipes = recipes.filter((recipe) => !recipe.summary)

        if (uncachedRecipes.length === 0) return

        const generateSummariesIndividually = async (recipesToProcess) => {
            const updates = {}
            for (const recipe of recipesToProcess) {
                const dishName = recipe.strMeal || recipe.strDrink || recipe.title
                if (!dishName) continue

                if (cachedSummaries[dishName]) {
                    updates[dishName] = cachedSummaries[dishName]
                } else {
                    try {
                        const summary = await getGaladrielResponse(`Describe ${dishName} in 2 sentences`, "summary")
                        updates[dishName] = summary
                        cachedSummaries[dishName] = summary
                    } catch (error) {
                        console.error(`Error generating summary for ${dishName}:`, error)
                        updates[dishName] = "Description unavailable"
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                // Update both localStorage and state
                localStorage.setItem("recipeSummaries", JSON.stringify(cachedSummaries))

                setAllRecipes((prevRecipes) => {
                    return prevRecipes.map((recipe) => {
                        const dishName = recipe.strMeal || recipe.strDrink || recipe.title
                        return updates[dishName] ? { ...recipe, summary: updates[dishName] } : recipe
                    })
                })
            }
        }

        if (uncachedRecipes.length >= AI_CONFIG.BATCH_THRESHOLD) {
            try {
                const dishNames = uncachedRecipes.map((r) => r.strMeal || r.strDrink || r.title).filter(Boolean)
                const batchResult = await batchGaladrielResponse(dishNames, "summary")
                const summaries = batchResult.split("\n")

                const summaryMap = {}
                uncachedRecipes.forEach((recipe, index) => {
                    const dishName = recipe.strMeal || recipe.strDrink || recipe.title
                    if (dishName && index < summaries.length) {
                        summaryMap[dishName] = summaries[index]
                        cachedSummaries[dishName] = summaries[index]
                    }
                })

                // Update both localStorage and state
                localStorage.setItem("recipeSummaries", JSON.stringify(cachedSummaries))

                setAllRecipes((prevRecipes) => {
                    return prevRecipes.map((recipe) => {
                        const dishName = recipe.strMeal || recipe.strDrink || recipe.title
                        return summaryMap[dishName] ? { ...recipe, summary: summaryMap[dishName] } : recipe
                    })
                })
            } catch (error) {
                console.error("Batch summary failed:", error)
                await generateSummariesIndividually(uncachedRecipes)
            }
        } else {
            await generateSummariesIndividually(uncachedRecipes)
        }
    }

    useEffect(() => {
        if (allRecipes.length > 0) {
            const recipesNeedingSummaries = allRecipes.filter((recipe) => {
                const dishName = recipe.strMeal || recipe.strDrink || recipe.title
                return dishName && !recipe.summary
            })

            if (recipesNeedingSummaries.length > 0) {
                generateSummaries(recipesNeedingSummaries)
            }
        }
    }, [allRecipes])

    const handleInputChange = ({ target: { value } }) => {
        setInputString(value)
    }

    const handleAddIngredient = async () => {
        if (inputString.trim() === "") {
            setErrorMessage("Please enter valid ingredients.")
            return
        }

        setIsSearching(true)
        setErrorMessage("")

        try {
            const ingredientsArray = inputString
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)

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
        }
    }

    const handleRemoveIngredient = (ingredientToRemove) => {
        setIngredients(ingredients.filter((ingredient) => ingredient !== ingredientToRemove))
    }

    const clearValidationCache = () => {
        localStorage.removeItem("ai-validation-cache")
    }

    const handleClearValidationCache = () => {
        clearValidationCache()
        Object.keys(localStorage)
            .filter((key) => key.includes("ai-"))
            .forEach((key) => localStorage.removeItem(key))
        alert("Validation cache has been cleared. Please try adding ingredients again.")
    }

    const handleSearch = async ({
                                    cookableOnly = false,
                                    strictMode = false,
                                    focusSearch = false,
                                    focusIngredient = null,
                                }) => {
        if (ingredients.length === 0) return

        setIsSearching(true)
        setApiLimitReached(false)
        setFocusSearch(focusSearch)
        setFocusIngredient(focusIngredient || "")
        setErrorMessage("") // Clear previous errors
        setShowFilters(false) // Hide filters after search

        try {
            let spoonacularResults = []
            let mealDBResults = []
            let cocktailResults = []

            // Spoonacular call with explicit error handling
            if (!apiLimitReached) {
                try {
                    spoonacularResults =
                        (await getRecipes(ingredients, selectedDiet, {
                            cookableOnly,
                            strictMode,
                            focusIngredient,
                        })) || []
                } catch (spoonError) {
                    console.error("Spoonacular error:", spoonError)
                    if (spoonError.response?.status === 402 || spoonError.response?.status === 429) {
                        setApiLimitReached(true)
                    }
                    // Don't set general error - fall through to other APIs
                }
            }

            // Other API calls
            try {
                ;[mealDBResults, cocktailResults] = await Promise.all([
                    getMealDBRecipes(ingredients),
                    getCocktailDBDrinks(ingredients),
                ])
            } catch (otherError) {
                console.error("Other API error:", otherError)
                // Only show error if ALL APIs failed
                if (spoonacularResults.length === 0) {
                    setErrorMessage("Failed to fetch recipes from all sources")
                }
            }

            const allRecipes = [...spoonacularResults, ...(mealDBResults || []), ...(cocktailResults || [])]

            setAllRecipes(allRecipes)
            setCurrentPage(1)

            // Show warning if only fallback recipes available
            if (apiLimitReached && allRecipes.length > 0) {
                setErrorMessage("Using fallback recipes (Spoonacular limit reached)")
            }
        } catch (error) {
            console.error("Search error:", error)
            // Only show error if we got ZERO results
            if (allRecipes.length === 0) {
                setErrorMessage("Failed to fetch recipes. Please try again.")
            }
        } finally {
            setIsSearching(false)
        }
    }

    // Helper to extract ingredients from any recipe format
    const getRecipeIngredients = (recipe) => {
        // Add debug logging
        console.log("Getting ingredients for:", recipe.title || recipe.strMeal || recipe.strDrink)

        if (recipe.strMeal && recipe.strIngredient1) {
            // TheMealDB format
            const ingredients = Array.from({ length: 20 }, (_, i) => recipe[`strIngredient${i + 1}`] || "").filter(
                (ing) => ing && ing.trim(),
            )
            console.log(`Found ${ingredients.length} TheMealDB ingredients`)
            return ingredients
        } else if (recipe.extendedIngredients) {
            // Spoonacular format
            const ingredients = recipe.extendedIngredients
                .map((ing) => ing.name || ing.original || "")
                .filter((ing) => ing && ing.trim())
            console.log(`Found ${ingredients.length} Spoonacular ingredients`)
            return ingredients
        } else if (recipe.strDrink && recipe.strIngredient1) {
            // CocktailDB format - correctly identified by strDrink + strIngredient1
            const ingredients = Array.from({ length: 15 }, (_, i) => recipe[`strIngredient${i + 1}`] || "").filter(
                (ing) => ing && ing.trim(),
            )
            console.log(`Found ${ingredients.length} CocktailDB ingredients`)
            return ingredients
        }

        // If we can't identify the format, log the issue
        console.warn("Unknown recipe format:", recipe)
        return []
    }

    const getBaseIngredient = (ingredient) => {
        if (!ingredient) return ""

        const lowerIngredient = ingredient.toLowerCase()
        if (lowerIngredient.includes("chicken breast")) return "chicken"
        if (lowerIngredient.includes("salmon fillet")) return "salmon"
        if (lowerIngredient.includes("ground beef")) return "beef"
        if (lowerIngredient.includes("cheddar cheese")) return "cheddar"
        if (lowerIngredient.includes("apple")) return "apple"
        if (lowerIngredient.includes("carrot")) return "carrot"

        return ingredient
    }

    const handleQuickSearch = (category) => {
        setSelectedCategory(category)
        setCategoryDialogOpen(true)
        // Remove any focus search setting from here
    }

    // Modify the handleCategorySearch function to implement focus search
    const handleCategorySearch = async (specificIngredient) => {
        setCategoryDialogOpen(false)
        setIsSearching(true)
        setApiLimitReached(false)
        setErrorMessage("")

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

        try {
            let mealDBRecipes = []
            let spoonacularRecipes = []

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

            // Always try MealDB
            try {
                mealDBRecipes = await getMealDBRecipes([searchQuery])
            } catch (error) {
                console.error("MealDB error:", error)
            }

            const combinedRecipes = [
                ...(Array.isArray(mealDBRecipes) ? mealDBRecipes : []),
                ...(Array.isArray(spoonacularRecipes) ? spoonacularRecipes : []),
            ]
            setAllRecipes(combinedRecipes)
            setCurrentPage(1)
        } catch (error) {
            console.error("Error during quick search:", error)
            setErrorMessage("An unexpected error occurred.")
        } finally {
            setIsSearching(false)
        }
    }

    const RecipeCard = ({ recipe, onClick }) => (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors">
                    <CardContent className="p-4">
                        <img
                            src={recipe.image || recipe.strMealThumb || recipe.strDrinkThumb || "/placeholder.svg"}
                            alt={recipe.title || recipe.strMeal || recipe.strDrink}
                            className="w-full h-32 object-cover rounded-md mb-2"
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
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </DialogTrigger>

            <DialogContent className="bg-gray-800 text-white">
                <DialogTitle className="font-medium text-gray-300 text-lg flex items-center">
                    {recipe.title || recipe.strMeal || recipe.strDrink}
                    {recipe.isDrink && (
                        <div className="flex items-center ml-2">
                            <BiDrink className="text-blue-400 h-5 w-5" />
                            {recipe.strAlcoholic === "Non alcoholic" || recipe.strAlcoholic === "Non Alcoholic" ? (
                                <span className="text-xs text-green-400 ml-1">Non-Alcoholic</span>
                            ) : null}
                        </div>
                    )}
                </DialogTitle>
                <DialogDescription asChild>
                    <div className="text-white font-bold">
                        <div className="space-y-4">
                            <div className="relative w-full pb-[56.25%] overflow-hidden rounded-md">
                                <img
                                    src={recipe.image || recipe.strMealThumb || recipe.strDrinkThumb || "/placeholder.svg"}
                                    alt={recipe.title || recipe.strMeal || recipe.strDrink}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                            <p className="mb-4">{stripHtml(recipe.summary) || "No summary available."}</p>
                            <Button onClick={onClick} className="w-full font-bold">
                                View Full Recipe
                            </Button>
                        </div>
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    )

    const clickHandler = (recipe) => {
        const currentPath = window.location.pathname

        if (recipe.isDrink) {
            navigate(`/drink/${recipe.idDrink}`, {
                state: {
                    drink: recipe,
                    userIngredients: ingredients,
                    allRecipes: allRecipes,
                    previousPath: currentPath,
                },
            })
        } else if (recipe.idMeal) {
            navigate(`/mealdb-recipe/${recipe.idMeal}`, {
                state: {
                    meal: recipe,
                    userIngredients: ingredients,
                    allRecipes: allRecipes,
                    previousPath: currentPath,
                },
            })
        } else {
            navigate(`/recipe/${recipe.id}`, {
                state: {
                    recipe,
                    userIngredients: ingredients,
                    allRecipes: allRecipes,
                    previousPath: currentPath,
                },
            })
        }
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

    // Add a function to clear focus search
    const clearFocusSearch = () => {
        setFocusSearch(false)
        setFocusIngredient("")
    }

    return (
        <div className="full-height-container bg-[#131415] text-[#f5efe4]">
            {/* Header */}
            <div className="w-full max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <img src={MealForgerLogo || "/placeholder.svg"} alt="Meal Forger Logo" className="h-24" />
                    </div>
                    <div className="relative w-full max-w-md mx-auto">
                        <div className="relative w-full">
                            <Input
                                type="text"
                                placeholder="Enter an ingredient ....."
                                className="w-full bg-transparent border border-gray-600 rounded-full py-2 px-4 text-white pl-10 pr-10"
                                value={inputString}
                                onChange={handleInputChange}
                                onKeyPress={(e) => e.key === "Enter" && handleAddIngredient()}
                            />
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                            <Button
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white p-0 text-lg font-medium grid place-items-center transition-colors"
                                onClick={handleAddIngredient}
                            >
                                +
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center mt-4">
                    <Button
                        variant="outline"
                        className="border border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/20 px-8 py-2 rounded-md"
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
            <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 px-6 py-4 flex-grow">
                {/* Left Column - MY PANTRY */}
                <div className="flex flex-col w-full md:w-1/3 mb-6 md:mb-0">
                    <h2 className="section-heading font-title">
                        <span className="text-accent">MY</span> PANTRY
                    </h2>
                    <div className="border border-gray-700 rounded-2xl p-4 mb-4 min-h-[200px] md:min-h-[300px] bg-gray-900/50 flex-grow">
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
                                <div key={index} className="mb-2 text-xl flex justify-between items-center font-terminal text-text">
                                    {item}
                                    <button onClick={() => handleRemoveIngredient(item)} className="text-accent hover:text-white">
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
                        <div className="border border-gray-700 rounded-2xl p-6 bg-gray-900/50">
                            <div className="grid grid-cols-4 gap-4">
                                {popularIngredients.map((item, index) => (
                                    <Button
                                        key={index}
                                        className={`flex flex-col items-center justify-center h-20 bg-transparent border border-white hover:bg-gray-800 rounded-2xl cursor-pointer`}
                                        onClick={() => handleQuickSearch(item.name)}
                                    >
                                        <item.icon className={`text-2xl ${item.color} mb-1`} />
                                        <span className="text-xs font-terminal text-white">{item.name}</span>
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
                    <div className="border border-gray-700 rounded-2xl p-4 mb-4 bg-gray-900/50 flex flex-col flex-grow min-h-[400px] md:min-h-[600px]">
                        {ingredients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 font-terminal">
                                <img src={MealForgerLogo || "/placeholder.svg"} alt="Meal Forger Logo" className="h-16 mb-6" />
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
                                {allRecipes.map((recipe) => (
                                    <div
                                        key={recipe.id || recipe.idMeal || recipe.idDrink}
                                        className="mb-4 bg-[#1e1e1e] rounded-2xl overflow-hidden cursor-pointer"
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
                                            <div className="w-2/3 p-4 flex items-center">
                                                <div className="text-lg font-terminal text-text">
                                                    {recipe.title || recipe.strMeal || recipe.strDrink}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4">
                            <Button
                                className="border border-[#ce7c1c] bg-transparent hover:bg-[#ce7c1c]/20 text-[#ce7c1c] px-8 py-3 font-terminal rounded-2xl cursor-pointer w-full text-xl font-bold"
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
                                    className={`w-full py-4 font-title diet-button border ${
                                        selectedDiet === dietValue
                                            ? "bg-[#ce7c1c] text-white font-bold"
                                            : "border-[#ce7c1c] bg-transparent hover:bg-[#ce7c1c]/20 text-white font-bold"
                                    } rounded-2xl cursor-pointer text-xl`}
                                    onClick={() => setSelectedDiet(selectedDiet === dietValue ? null : dietValue)}
                                >
                                    {diet}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Category Selection Dialog */}
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="bg-[#1e1e1e] border border-gray-700 text-white max-w-md">
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
                            className="w-full py-6 text-lg font-terminal font-bold bg-[#ce7c1c] hover:bg-[#ce7c1c]/80"
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
                                        className="py-4 font-terminal hover:bg-[#ce7c1c]/20 border-[#ce7c1c] text-white"
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
                    <Alert className="bg-red-950 border-red-800 text-white">
                        <InfoIcon className="h-4 w-4 text-red-300" />
                        <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    )
}

export default UserInput
