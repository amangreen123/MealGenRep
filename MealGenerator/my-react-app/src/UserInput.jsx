import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { slugify } from "./utils/slugify"
import "@/fonts/fonts.css"

import useFetchMeals from "./GetMeals.jsx"
import useTheMealDB from "./getTheMealDB.jsx"
import useTheCocktailDB from "./GetCocktailDB.jsx"

import { InfoIcon, Search, Plus } from 'lucide-react'

import MealForgerLogo from "./Images/Meal_Forger.png"
import CookableSearch from "./CookableSearch.jsx"
import PantryList from "@/components/PantryList.jsx"
import QuickAddButtons from "@/components/QuickAddButtons.jsx"
import DietSelector from "@/components/DietSelector.jsx"
import GenerateButton from "@/components/GenerateButton.jsx"
import PopularRecipesSection from "@/components/PopularRecipesSection.jsx"

import useLocalStorageState from "@/hooks/useLocalStorageState.jsx"
import useRecipeSearch from "@/hooks/useRecipeSearch.jsx"
import useIngredientManager from "@/hooks/useIngredientManager.jsx"
import { getCategoryIngredient } from "./utils/categorySearch.js"
import RandomSelectionRecipes from "@/components/RandomSelectionRecipes.jsx"



const UserInput = () => {
    // Use custom hooks instead of manual state management
    const [inputString, setInputString] = useState("")
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [showFilters, setShowFilters] = useState(false)
    const [selectedDiet, setSelectedDiet] = useState(null)
    const [randomRecipes, setRandomRecipes] = useState([])
    const [hasGeneratedRecipes, setHasGeneratedRecipes] = useState(false)

    // Get API functions
    const { recipes, error, getRecipes } = useFetchMeals()
    const { getMealDBRecipes, MealDBRecipes, loading } = useTheMealDB()
    const { CocktailDBDrinks, getCocktailDBDrinks } = useTheCocktailDB()

    // Use custom hooks
    const {
        ingredients,
        addIngredients,
        removeIngredient,
        errorMessage: ingredientError,
        isSearching: ingredientLoading
    } = useIngredientManager()

    const {
        allRecipes,
        isSearching,
        loadingText,
        errorMessage: searchError,
        searchRecipes,
        categorySearch
    } = useRecipeSearch({
        getRecipes,
        getMealDBRecipes,
        getCocktailDBDrinks,
        slugify
    })

    const navigate = useNavigate()

    // Combine error messages
    const errorMessage = ingredientError || searchError

    const handleInputChange = ({ target: { value } }) => {
        setInputString(value)
    }

    // Update the handleAddIngredient function to use the custom hook
    const handleAddIngredient = async () => {
        if (inputString.trim() === "") {
            return
        }

        try {
            await addIngredients(inputString)
            setInputString("")
        } catch (error) {
            console.error("Failed to add ingredient:", error)
        }
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
        setHasGeneratedRecipes(true) // Add this line
        await searchRecipes({
            ingredients,
            selectedDiet,
            cookableOnly,
            strictMode,
            focusSearch,
            focusIngredient
        })
        setShowFilters(false)
    }

    const handleQuickSearch = (category) => {
        setSelectedCategory(category)
        setCategoryDialogOpen(true)
    }

    // Update handleCategorySearch to use the utility function and custom hooks
    const handleCategorySearch = async (specificIngredient) => {
        setCategoryDialogOpen(false)

        try {
            const searchQuery = getCategoryIngredient(specificIngredient, selectedCategory)
            await addIngredients(searchQuery)

            // Set the flag and trigger category search
            setHasGeneratedRecipes(true)
            await categorySearch({ ingredient: searchQuery })
        } catch (error) {
            console.error("Category search error:", error)
        }
    }

    const clickHandler = (recipe) => {
        const currentPath = window.location.pathname
        const recipeName = recipe.strDrink || recipe.strMeal || recipe.title || "recipe"
        const recipeSlug = recipe.slug || slugify(recipeName)

        if (recipe.isDrink) {
            navigate(`/drink/${recipeSlug}`, {
                state: {
                    drink: recipe,
                    userIngredients: ingredients,
                    allRecipes: allRecipes,
                    previousPath: currentPath,
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
                recipeId: recipe.idMeal,
            },
        })
    }

    // Auto-search when ingredients are loaded from localStorage
    // useEffect(() => {
    //   if (ingredients.length > 0) {
    //     setTimeout(() => {
    //       handleSearch({ cookableOnly: false, strictMode: false })
    //     }, 500)
    //   }
    // }, [ingredients.length]) // Only run when ingredients length changes

    // Determine what to show in the recipes section
    const showGeneratedRecipes = allRecipes.length > 0 || isSearching
    const recipeSectionTitle = showGeneratedRecipes ? "RECIPES YOU CAN COOK" : "POPULAR RECIPES"

    // Fetch random recipes on component mount
    useEffect(() => {
        const fetchRandomRecipes = async () => {
            try {
                const apiKey = import.meta.env.VITE_MEALDB_KEY || "1"
                const response = await fetch(`https://www.themealdb.com/api/json/v2/${apiKey}/randomselection.php`)
                const data = await response.json()

                if (data && data.meals) {
                    const recipesWithSlugs = data.meals.map((recipe) => ({
                        ...recipe,
                        slug: slugify(recipe.strMeal),
                        idMeal: recipe.idMeal,
                    }))
                    setRandomRecipes(recipesWithSlugs)
                }
            } catch (error) {
                console.error("Error fetching random recipes:", error)
            }
        }

        fetchRandomRecipes()
    }, [])

    return (
        <div className="flex flex-col min-h-screen bg-[#131415] text-[#f5efe4]">
            {/* Header */}
            <header className="py-6 md:py-8">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    {/* Logo - centered */}
                    <div className="flex justify-center mb-6">
                        <div className="text-3xl md:text-4xl font-bold font-title">
                            <span className="text-white">MEAL</span>
                            <br/>
                            <span className="text-[#ce7c1c]">FORGER</span>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="search-input-container w-full max-w-2xl mx-auto mb-4">
                        <Input
                            type="text"
                            placeholder="Enter an ingredient ....."
                            className="w-full bg-gray-800/50 border-2 border-gray-600 rounded-full text-white focus:border-[#ce7c1c] transition-all duration-300"
                            value={inputString}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            style={{
                                height: '48px',
                                paddingLeft: '3rem',
                                paddingRight: '3rem',
                                lineHeight: '1'
                            }}
                        />
                        <div className="search-icon">
                            <Search className="h-5 w-5 text-gray-400"/>
                        </div>
                        <Button
                            className="search-button bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white transition-all duration-300"
                            onClick={handleAddIngredient}
                            disabled={ingredientLoading}
                        >
                            <Plus className="h-4 w-4"/>
                        </Button>
                    </div>
                    
                    {/* Filters button */}
                    <div className="flex justify-center mb-6">
                        <Button
                            variant="outline"
                            className="border-2 border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/20 px-8 py-2 rounded-full font-terminal bg-transparent"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            FILTERS
                        </Button>
                    </div>

                    {/* Filters section */}
                    {showFilters && (
                        <div className="w-full max-w-2xl mx-auto mb-6">
                            <CookableSearch
                                onSearch={handleSearch}
                                ingredients={ingredients}
                                selectedDiet={selectedDiet}
                                isSearching={isSearching}
                                focusIngredient=""
                            />
                        </div>
                    )}

                    {/* Main heading */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold font-title">
                            <span className="text-white">DISCOVER </span>
                            <span className="text-[#ce7c1c]">RECIPES </span>
                            <span className="text-white">WITH </span>
                            <span className="text-[#ce7c1c]">WHAT YOU HAVE</span>
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8">

                    {/* MY PANTRY - Slimmer design */}
                    <div className="mb-6">
                        <PantryList
                            ingredients={ingredients}
                            onRemove={removeIngredient}
                        />
                    </div>

                    {/* 2 Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Left Column - Controls */}
                        <div className="space-y-6">

                            {/* QUICK ADD */}
                            <QuickAddButtons
                                onQuickSearch={handleQuickSearch}
                                categoryDialogOpen={categoryDialogOpen}
                                setCategoryDialogOpen={setCategoryDialogOpen}
                                selectedCategory={selectedCategory}
                                onCategorySearch={handleCategorySearch}
                            />

                            {/* MY DIET */}
                            <DietSelector
                                selectedDiet={selectedDiet}
                                setSelectedDiet={setSelectedDiet}
                            />
                        </div>

                        {/* Right Column - Combined Recipes Section */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Generate Button - only shows if ingredients exist */}
                            {ingredients.length > 0 && (
                                <GenerateButton
                                    ingredients={ingredients}
                                    isSearching={isSearching}
                                    onSearch={() => handleSearch({ cookableOnly: false, strictMode: false })}
                                    loadingText={loadingText}
                                />
                            )}

                            {/* Combined Recipes Display - VERTICAL SCROLL ONLY */}
                            <div className="bg-gray-900/50 rounded-3xl border border-gray-700 p-4 md:p-6 shadow-lg">
                                <h2 className="text-2xl md:text-3xl font-bold mb-6 font-title text-center">
                                    {(hasGeneratedRecipes && (allRecipes.length > 0 || isSearching)) ? (
                                        <>
                                            <span className="text-[#ce7c1c]">RE</span>
                                            <span className="text-white">CIPES</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-[#ce7c1c]">POPULAR</span>
                                            <span className="text-white"> RECIPES</span>
                                        </>
                                    )}
                                </h2>

                                {/* Large vertical scrolling container with smooth mobile-like scrolling */}
                                <div className="h-[600px] overflow-y-auto recipe-smooth-scroll">
                                    {isSearching ? (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce7c1c] mb-4"></div>
                                            <p className="text-gray-400 font-terminal">{loadingText || "Searching..."}</p>
                                        </div>
                                    ) : (hasGeneratedRecipes && allRecipes.length > 0) ? (
                                        /* Show Generated Recipes only when generate button was pressed */
                                        <div className="space-y-4 pb-4">
                                            {allRecipes.map((recipe) => {
                                                const title = recipe.title || recipe.strMeal || recipe.strDrink
                                                const image = recipe.image || recipe.strMealThumb || recipe.strDrinkThumb

                                                return (
                                                    <div
                                                        key={recipe.id || recipe.idMeal || recipe.idDrink}
                                                        className="bg-gray-800/50 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:shadow-[#ce7c1c]/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                                                        onClick={() => clickHandler(recipe)}
                                                    >
                                                        <div className="flex">
                                                            <div className="w-1/3">
                                                                <img
                                                                    src={image || "/placeholder.svg"}
                                                                    alt={title}
                                                                    className="w-full h-32 object-cover"
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                            <div className="w-2/3 p-4">
                                                                <h3 className="text-lg font-bold font-title mb-2 text-white line-clamp-2">{title}</h3>
                                                                <div className="flex flex-wrap gap-2 mb-2">
                                                                    {recipe.strCategory && (
                                                                        <span className="bg-[#ce7c1c] text-white px-2 py-1 rounded-full text-xs font-terminal">
                                      {recipe.strCategory}
                                    </span>
                                                                    )}
                                                                    {recipe.strArea && (
                                                                        <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-terminal">
                                      {recipe.strArea}
                                    </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-gray-400 font-terminal">
                                                                    {recipe.readyInMinutes && `${recipe.readyInMinutes} min`}
                                                                    {recipe.servings && ` • ${recipe.servings} servings`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        /* Show Popular Recipes by default or when no generated recipes */
                                        <div className="space-y-4 pb-4">
                                            {randomRecipes.slice(0, 12).map((recipe) => (
                                                <div
                                                    key={recipe.idMeal}
                                                    className="bg-gray-800/50 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:shadow-[#ce7c1c]/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                                                    onClick={() => handleRandomRecipeClick(recipe)}
                                                >
                                                    <div className="flex">
                                                        <div className="w-1/3">
                                                            <img
                                                                src={recipe.strMealThumb || "/placeholder.svg"}
                                                                alt={recipe.strMeal}
                                                                className="w-full h-32 object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <div className="w-2/3 p-4">
                                                            <h3 className="text-lg font-bold font-title mb-2 text-white line-clamp-2">{recipe.strMeal}</h3>
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {recipe.strCategory && (
                                                                    <span className="bg-[#ce7c1c] text-white px-2 py-1 rounded-full text-xs font-terminal">
                                    {recipe.strCategory}
                                  </span>
                                                                )}
                                                                {recipe.strArea && (
                                                                    <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-terminal">
                                    {recipe.strArea}
                                  </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-400 font-terminal">
                                                                25 min • 4 servings
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Load random recipes on mount - hidden component */}
            {/* <RandomSelectionRecipes 
        onRecipeClick={handleRandomRecipeClick}
        setRandomRecipes={setRandomRecipes}
      /> */}

            {/* Error Message */}
            {errorMessage && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
                    <Alert className="bg-red-950 border-red-800 text-white rounded-xl shadow-lg">
                        <InfoIcon className="h-4 w-4 text-red-300 flex-shrink-0" />
                        <AlertDescription className="font-medium font-terminal text-sm">{errorMessage}</AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    )
}

export default UserInput








