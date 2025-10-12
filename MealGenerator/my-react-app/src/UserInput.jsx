import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { slugify } from "./utils/slugify"
import "@/fonts/fonts.css"

import { InfoIcon, Search, Plus } from 'lucide-react'


import MealForgerLogo from "./Images/Meal_Forger.png"
import CookableSearch from "@/components/CookableSearch.jsx"
import PantryList from "@/components/PantryList.jsx"
import QuickAddButtons from "@/components/QuickAddButtons.jsx"
import DietSelector from "@/components/DietSelector.jsx"
import GenerateButton from "@/components/GenerateButton.jsx"
import PopularRecipesSection from "@/components/PopularRecipesSection.jsx"
import CircularMatchIndicator from '@/components/CircularMatchIndicator';


import useLocalStorageState from "@/hooks/useLocalStorageState.jsx"
import useRecipeSearch from "@/hooks/useRecipeSearch.jsx"
import useIngredientManager from "@/hooks/useIngredientManager.jsx"
import { getCategoryIngredient } from "./utils/categorySearch.js"
import RandomSelectionRecipes from "@/components/RandomSelectionRecipes.jsx"

import useFetchMeals from "@/API/Spooncular/GetMeals.jsx";
import useTheMealDB from "@/API/MealDB/getTheMealDB.jsx";
import useTheCocktailDB from "@/API/MealDB/GetCocktailDB.jsx";
import ImageIngredientUpload from "@/components/ImageIngredientUpload.jsx";
import SearchStatsBanner from "@/components/SearchStatsBanner.jsx";


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
        isSearching: ingredientLoading,
    } = useIngredientManager()

    const {
        allRecipes,
        isSearching,
        loadingText,
        errorMessage: searchError,
        searchRecipes,
        categorySearch,
        searchStats
    } = useRecipeSearch({
        getRecipes,
        getMealDBRecipes,
        getCocktailDBDrinks,
        slugify,
    })

    const navigate = useNavigate()

    // Combine error messages
    const errorMessage = ingredientError || searchError

    const handleCameraIngredient = async (ingredient) => {
        try {
            await addIngredients(ingredient)
        } catch (error) {
            console.error("Failed to add camera ingredient:", error)
        }
    }

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
                                    searchType = "all", 
                                    exactMatch = false, 
                                    focusSearch = false,
                                    focusIngredient = null,
                                }) => {
        setHasGeneratedRecipes(true)
        await searchRecipes({
            ingredients,
            selectedDiet,
            searchType, 
            exactMatch,
            focusSearch,
            focusIngredient,
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
        const recipeName = recipe.strDrink || recipe.strMeal || recipe.title
        const recipeSlug = recipe.slug || slugify(recipeName)

        if (recipe.idDrink) {
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
                            <img src={MealForgerLogo} alt="Meal Forger Logo" className="h-20 md:h-16" />
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="search-input-container w-full max-w-2xl mx-auto mb-4 relative">
                        <Input
                            type="text"
                            placeholder="Enter an ingredient ....."
                            className="w-full bg-gray-800/50 border-2 border-gray-600 rounded-full text-white focus:border-[#ce7c1c] transition-all duration-300"
                            value={inputString}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            style={{
                                height: "48px",
                                paddingLeft: "3rem",
                                paddingRight: "8rem",
                                lineHeight: "1",
                            }}
                        />
                        <div className="search-icon absolute left-12 top-1/2 transform -translate-y-1/2">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <ImageIngredientUpload
                            onIngredientIdentified={handleCameraIngredient}
                            className="absolute right-12 top-1/2 transform -translate-y-1/2"
                        />
                        <Button
                            className="search-button bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white transition-all duration-300 absolute right-4 top-1/2 transform -translate-y-1/2"
                            onClick={handleAddIngredient}
                            disabled={ingredientLoading}
                        >
                            <Plus className="h-4 w-4" />
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

                    {/* Search Stats Banner - Shows after search */}
                    {hasGeneratedRecipes && searchStats.totalResults > 0 && (
                        <SearchStatsBanner searchStats={searchStats} />
                    )}
                    
                    {searchStats.totalResults > 0 && (
                        <div className="mb-6 p-4 bg-[#1a1a1a] border border-gray-800 rounded-2xl">
                            <p className="font-terminal text-sm text-[#f5efe4]">
                                Found <span className="text-[#ce7c1c] font-bold">{searchStats.totalResults}</span> recipes
                                {searchStats.perfectMatches > 0 && (
                                    <> · <span className="text-green-500 font-bold">{searchStats.perfectMatches}</span> you can cook now!</>
                                )}
                                {searchStats.searchMode === 'exact' && (
                                    <> · <span className="text-yellow-500">Exact Match Mode</span></>
                                )}
                            </p>
                        </div>
                    )}

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
                        <PantryList ingredients={ingredients} onRemove={removeIngredient} />
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
                            <DietSelector selectedDiet={selectedDiet} setSelectedDiet={setSelectedDiet} />
                        </div>

                        {/* Right Column - Combined Recipes Section */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Generate Button - only shows if ingredients exist */}
                            {ingredients.length > 0 && (
                                <GenerateButton
                                    ingredients={ingredients}
                                    isSearching={isSearching}
                                    onSearch={() => handleSearch({ searchType: "all", exactMatch: false })}
                                    loadingText={loadingText}
                                />
                            )}

                            {/* ✅ NEW: Search Stats Banner */}
                            {hasGeneratedRecipes && searchStats.totalResults > 0 && (
                                <SearchStatsBanner searchStats={searchStats} />
                            )}


                            {/* Combined Recipes Display - VERTICAL SCROLL ONLY */}
                            <div className="bg-gray-900/50 rounded-3xl border border-gray-700 p-4 md:p-6 shadow-lg">
                                <h2 className="text-2xl md:text-3xl font-bold mb-6 font-title text-center">
                                    {hasGeneratedRecipes && (allRecipes.length > 0 || isSearching) ? (
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
                                    ) : hasGeneratedRecipes && allRecipes.length > 0 ? (
                                        /* Show Generated Recipes only when generate button was pressed */
                                        <div className="space-y-4 pb-4">
                                            {allRecipes.map((recipe) => {
                                                const title = recipe.title || recipe.strMeal || recipe.strDrink;
                                                const image = recipe.image || recipe.strMealThumb || recipe.strDrinkThumb;
                                                const hasMatchData = recipe.matchScore !== undefined;
                                                const canCook = recipe.canCook || recipe.canMake || false;

                                                return (
                                                    <div
                                                        key={recipe.id || recipe.idMeal || recipe.idDrink}
                                                        className="bg-gray-800/50 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:shadow-[#ce7c1c]/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative"
                                                        onClick={() => clickHandler(recipe)}
                                                    >
                                                        {/* Circular Match Indicator - Top Right Corner */}
                                                        {hasMatchData && (
                                                            <div className="absolute top-2 right-2 z-10">
                                                                <CircularMatchIndicator
                                                                    matchPercentage={recipe.matchPercentage}
                                                                    canCook={canCook}
                                                                    size="md"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="flex">
                                                            <div className="w-1/3">
                                                                <img
                                                                    src={image || "/placeholder.svg"}
                                                                    alt={title}
                                                                    className="w-full h-32 object-cover"
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                            <div className="w-2/3 p-4 pr-16"> {/* Added pr-16 to make room for indicator */}
                                                                <h3 className="text-lg font-bold font-title mb-2 text-white line-clamp-2">
                                                                    {title}
                                                                </h3>

                                                                {/* Match Info Badge - Only show if not perfect match */}
                                                                {hasMatchData && !canCook && (
                                                                    <div className="mb-2">
                            <span className="text-xs font-terminal text-gray-400">
                                {recipe.matchScore}/{recipe.totalIngredients} ingredients
                            </span>
                                                                        {recipe.missingIngredients > 0 && (
                                                                            <span className="text-xs font-terminal text-red-400 ml-2">· Need {recipe.missingIngredients} more</span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Perfect Match Badge */}
                                                                {canCook && (
                                                                    <div className="mb-2">
                            <span className="inline-flex items-center gap-1 text-xs font-terminal px-2 py-1 bg-green-500/20 text-green-500 rounded-full border border-green-500/30">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Can Cook Now!
                            </span>
                                                                    </div>
                                                                )}

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

                                                                    {/* Diet Badges */}
                                                                    {recipe.isVegan && (
                                                                        <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-terminal">
                                🌱 Vegan
                            </span>
                                                                    )}
                                                                    {recipe.isKeto && (
                                                                        <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-terminal">
                                🥑 Keto
                            </span>
                                                                    )}
                                                                    {recipe.isGlutenFree && (
                                                                        <span className="bg-amber-600 text-white px-2 py-1 rounded-full text-xs font-terminal">
                                🌾 GF
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
                                                );
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
                                                            <h3 className="text-lg font-bold font-title mb-2 text-white line-clamp-2">
                                                                {recipe.strMeal}
                                                            </h3>
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {recipe.strCategory && (<span className="bg-[#ce7c1c] text-white px-2 py-1 rounded-full text-xs font-terminal">{recipe.strCategory}</span>)}
                                                                {recipe.strArea && (<span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-terminal">{recipe.strArea}</span>)}
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








