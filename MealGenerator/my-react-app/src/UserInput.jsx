import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { slugify } from "./utils/slugify"
import "@/fonts/fonts.css"

import {
    InfoIcon, Search, Plus, X, SlidersHorizontal, ChefHat, ShoppingBasket, AlertTriangle,
    Drumstick, Fish, Leaf, Carrot, Wine, Coffee, Egg, Wheat, Utensils, Globe, Tag, Clock, Users,
    Martini, GlassWater, Beer, CakeSlice
} from 'lucide-react'

import MealForgerLogo from "./Images/Meal_Forger.png"
import CookableSearch from "@/components/CookableSearch.jsx"
import QuickAddButtons from "@/components/QuickAddButtons.jsx"
import DietSelector from "@/components/DietSelector.jsx"
import CircularMatchIndicator from '@/components/CircularMatchIndicator';
import ImageIngredientUpload from "@/components/ImageIngredientUpload.jsx";
import SearchStatsBanner from "@/components/SearchStatsBanner.jsx";
import FirstTimeUser from "@/components/FirstTimeUser.jsx";
import FirstTimeUserRecipes from "@/components/FirstTimeUserRecipes.jsx";
import DynamicLogo from "@/components/DynamicLogo.jsx"

import useIngredientManager from "@/hooks/useIngredientManager.jsx"
import useRecipeSearch from "@/hooks/useRecipeSearch.jsx"
import { getCategoryIngredient } from "./utils/categorySearch.js"
import useFetchMeals from "@/API/Spooncular/GetMeals.jsx";
import useTheMealDB from "@/API/MealDB/getTheMealDB.jsx";
import useTheCocktailDB from "@/API/MealDB/GetCocktailDB.jsx";

const UserInput = () => {
    // --- STATE & HOOKS ---
    const [isFirstTime, setisFirstTime] = useState(true)
    const { isFirstTimeUser, markAsReturningUser } = FirstTimeUser({
        onFirstTimeStatusChange: setisFirstTime,
    })

    const [inputString, setInputString] = useState("")
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [selectedDiet, setSelectedDiet] = useState(null)
    const [randomRecipes, setRandomRecipes] = useState([])
    const [hasGeneratedRecipes, setHasGeneratedRecipes] = useState(false)
    const [visibleError, setVisibleError] = useState(null);

    // API Hooks
    const { recipes, error, getRecipes } = useFetchMeals()
    const { getMealDBRecipes, MealDBRecipes, loading } = useTheMealDB()
    const { CocktailDBDrinks, getCocktailDBDrinks } = useTheCocktailDB()

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
        searchStats,
    } = useRecipeSearch({
        getRecipes,
        getMealDBRecipes,
        getCocktailDBDrinks,
        slugify,
    })

    const navigate = useNavigate()
    const rawErrorMessage = ingredientError || searchError

    useEffect(() => {
        if (rawErrorMessage) {
            setVisibleError(rawErrorMessage);
            const timer = setTimeout(() => setVisibleError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [rawErrorMessage]);

    // --- HANDLERS ---
    const handleFirstTimeDismiss = () => {
        markAsReturningUser()
        setisFirstTime(false)
    }

    const handleCameraIngredient = async (ingredient) => {
        try { await addIngredients(ingredient) }
        catch (error) { console.error("Failed to add camera ingredient:", error) }
    }

    const handleInputChange = ({ target: { value } }) => setInputString(value)

    const handleAddIngredient = async () => {
        if (inputString.trim() === "") return
        try {
            await addIngredients(inputString)
            setInputString("")
        } catch (error) { console.error("Failed to add ingredient:", error) }
    }

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleAddIngredient()
    }

    const handleSearch = async ({ searchType = "all", exactMatch = false }) => {
        setHasGeneratedRecipes(true)
        await searchRecipes({
            ingredients,
            selectedDiet,
            searchType,
            exactMatch,
        })
    }

    const handleQuickSearch = (category) => {
        setSelectedCategory(category)
        setCategoryDialogOpen(true)
    }

    const handleCategorySearch = async (specificIngredient) => {
        setCategoryDialogOpen(false)
        try {
            const searchQuery = getCategoryIngredient(specificIngredient, selectedCategory)
            await addIngredients(searchQuery)
            setHasGeneratedRecipes(true)
            await categorySearch({ ingredient: searchQuery })
        } catch (error) { console.error("Category search error:", error) }
    }

    const clickHandler = (recipe) => {
        const currentPath = window.location.pathname
        const recipeName = recipe.strDrink || recipe.strMeal || recipe.title
        const recipeSlug = recipe.slug || slugify(recipeName)

        // FIX: Determine which list is currently visible (Search Results OR Trending)
        // If we are showing search results, pass 'allRecipes'. If trending, pass 'randomRecipes'.
        const isShowingSearchResults = (hasGeneratedRecipes && allRecipes.length > 0) || isSearching;
        const activeList = isShowingSearchResults ? allRecipes : randomRecipes;

        if (recipe.idDrink) {
            navigate(`/drink/${recipeSlug}`, {
                state: {
                    drink: recipe,
                    userIngredients: ingredients,
                    allRecipes: activeList, // <--- PASS THE ACTIVE LIST
                    previousPath: currentPath,
                    recipeId: recipe.idDrink
                },
            })
        } else if (recipe.idMeal) {
            navigate(`/mealdb-recipe/${recipeSlug}`, {
                state: {
                    meal: recipe,
                    userIngredients: ingredients,
                    allRecipes: activeList, // <--- PASS THE ACTIVE LIST
                    previousPath: currentPath,
                    recipeId: recipe.idMeal
                },
            })
        } else {
            navigate(`/recipe/${recipeSlug}`, {
                state: {
                    recipe,
                    userIngredients: ingredients,
                    allRecipes: activeList,
                    previousPath: currentPath,
                    recipeId: recipe.id
                },
            })
        }
    }

    useEffect(() => {
        const fetchRandomRecipes = async () => {
            try {
                const BASE_URL =  import.meta.env.VITE_DEPLOYED_BACKEND_URL || 'http://localhost:5261';
                const response = await fetch(`${BASE_URL}/random-recipes?count=12`);
                const data = await response.json()
                if (data && data.meals) {
                    const recipesWithSlugs = data.meals.map((recipe) => ({
                        ...recipe,
                        slug: slugify(recipe.strMeal),
                        idMeal: recipe.idMeal,
                    }))
                    setRandomRecipes(recipesWithSlugs)
                }
            } catch (error) { console.error("Error fetching random recipes:", error) }
        }
        fetchRandomRecipes()
    }, [])

    const getCategoryIcon = (category, strAlcoholic = "") => {
        if (!category) return Tag;
        const c = category.toLowerCase();
        const a = strAlcoholic.toLowerCase();

        if (c.includes('beef') || c.includes('chicken') || c.includes('lamb') || c.includes('pork') || c.includes('goat')) return Drumstick;
        if (c.includes('seafood') || c.includes('fish')) return Fish;
        if (c.includes('vegan') || c.includes('vegetarian')) return Leaf;
        if (c.includes('breakfast')) return Coffee;
        if (c.includes('dessert')) return CakeSlice;

        if (c.includes('shot')) return GlassWater;
        if (c.includes('beer') || c.includes('ale')) return Beer;
        if (c.includes('coffee') || c.includes('tea') || c.includes('cocoa')) return Coffee;

        if (a.includes('non')) return GlassWater;
        if (a.includes('alcohol')) return Martini;
        if (c.includes('cocktail')) return Martini;

        return Utensils;
    }

    const showGenerated = (hasGeneratedRecipes && allRecipes.length > 0) || isSearching;
    const displayRecipes = showGenerated ? allRecipes : randomRecipes;

    const getTitleParts = () => {
        if (isSearching) return { white: "SEARCHING", orange: "RECIPES..." };
        if (selectedDiet && showGenerated) return { white: selectedDiet.toUpperCase(), orange: "RECIPES" };
        if (showGenerated) return { white: "RECIPES", orange: "YOU CAN COOK" };
        return { white: "TRENDING", orange: "NOW" };
    };

    const titleParts = getTitleParts();

    return (
        // Added relative z-10 to ensure content sits above ambient background
        <div className="flex flex-col min-h-screen bg-transparent text-[#f5efe4] selection:bg-[#ce7c1c] selection:text-white font-sans relative z-10">
            {isFirstTimeUser && <FirstTimeUserRecipes onDismiss={handleFirstTimeDismiss} />}

            <main className="flex-grow pt-6 px-4 md:px-6">
                <div className="mb-8 flex justify-center transform scale-75 md:scale-90">
                    <DynamicLogo className="h-32 md:h-48 w-auto" />
                </div>

                <div className="w-full max-w-2xl mx-auto relative z-20">
                    <div className="flex items-center w-full bg-[#1a1a1a] p-2 rounded-full border-2 border-gray-700 shadow-xl focus-within:border-[#ce7c1c] transition-colors duration-300">
                        <div className="pl-3 pr-2 text-gray-400"><Search className="h-5 w-5" /></div>

                        <Input
                            type="text"
                            placeholder="Add ingredient (e.g., Chicken)..."
                            className="flex-grow border-none bg-transparent text-white text-lg placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-12"
                            value={inputString}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                        />

                        <Button
                            onClick={handleAddIngredient}
                            className="bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white rounded-full h-10 w-10 p-0 flex-shrink-0 mr-1"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>

                        <div className="h-8 w-[1px] bg-gray-700 mx-0"></div>

                        <div className="relative flex items-center justify-center pl-1 pr-1">
                            <ImageIngredientUpload onIngredientIdentified={handleCameraIngredient} />
                        </div>
                    </div>

                    {ingredients.length > 0 && (
                        <div className="mt-4 bg-[#1a1a1a]/50 border border-gray-800 rounded-2xl p-4 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-2 mb-3 text-gray-400 text-xs uppercase font-bold tracking-wider">
                                <ShoppingBasket className="h-4 w-4 text-[#ce7c1c]" />
                                Your Pantry
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {ingredients.map((ing, index) => (
                                    <Badge
                                        key={index}
                                        className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 cursor-pointer shadow-sm transition-all hover:border-[#ce7c1c]"
                                        onClick={() => removeIngredient(ing)}
                                    >
                                        {ing}
                                        <X className="h-3 w-3 text-gray-400 hover:text-red-400" />
                                    </Badge>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button
                                    onClick={() => handleSearch({ searchType: "all" })}
                                    className="bg-white text-black hover:bg-gray-200 font-bold rounded-full px-6 flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform hover:scale-105"
                                >
                                    <ChefHat className="h-5 w-5" />
                                    Find Matching Recipes
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
                        <QuickAddButtons
                            onQuickSearch={handleQuickSearch}
                            categoryDialogOpen={categoryDialogOpen}
                            setCategoryDialogOpen={setCategoryDialogOpen}
                            selectedCategory={selectedCategory}
                            onCategorySearch={handleCategorySearch}
                        />

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="rounded-full border-gray-600 hover:bg-gray-800 hover:border-[#ce7c1c] transition-all duration-300 px-6 group"
                                >
                                    <SlidersHorizontal className="h-4 w-4 mr-2 text-gray-400 group-hover:text-[#ce7c1c] transition-colors" />
                                    <span className="font-title text-base tracking-wide flex gap-1 items-center">
                                        {selectedDiet ? (
                                            <span className="text-[#ce7c1c] uppercase tracking-wider">{selectedDiet}</span>
                                        ) : (
                                            <>
                                                <span className="text-white">DIET</span>
                                                <span className="text-[#ce7c1c]">& FILTERS</span>
                                            </>
                                        )}
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-lg w-[95%] max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl md:text-3xl font-bold font-title text-center mb-2">
                                        <span className="text-white">FILTER</span> <span className="text-[#ce7c1c]">RECIPES</span>
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="py-4 space-y-6">
                                    <DietSelector selectedDiet={selectedDiet} setSelectedDiet={setSelectedDiet} />
                                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                        <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Advanced Search</h4>
                                        <CookableSearch
                                            onSearch={handleSearch}
                                            ingredients={ingredients}
                                            selectedDiet={selectedDiet}
                                            isSearching={isSearching}
                                        />
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="w-full max-w-7xl mx-auto mt-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 px-2">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold font-title tracking-wide mb-2">
                                <span className="text-white">{titleParts.white}</span> <span className="text-[#ce7c1c]">{titleParts.orange}</span>
                            </h2>
                            {!showGenerated && ingredients.length === 0 && (
                                <p className="font-title text-gray-400 text-lg md:text-xl tracking-wide">
                                    HERE'S WHAT'S POPULAR. <span className="text-[#ce7c1c]">ADD INGREDIENTS ABOVE</span> TO FIND MATCHES.
                                </p>
                            )}
                        </div>
                    </div>

                    {hasGeneratedRecipes && searchStats.totalResults > 0 && (
                        <div className="mb-8">
                            <SearchStatsBanner searchStats={searchStats} />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayRecipes.map((recipe) => {
                            const title = recipe.title || recipe.strMeal || recipe.strDrink
                            const image = recipe.image || recipe.strMealThumb || recipe.strDrinkThumb
                            const canCook = recipe.canCook || recipe.canMake || false
                            const hasMatchData = recipe.matchScore !== undefined

                            const isDrink = recipe.strDrink !== undefined || recipe.idDrink !== undefined;

                            let Tag1 = null;
                            let Tag2 = null;

                            if (isDrink) {
                                const CategoryIcon = getCategoryIcon(recipe.strCategory, recipe.strAlcoholic);
                                const isAlcoholic = recipe.strAlcoholic && !recipe.strAlcoholic.toLowerCase().includes('non');

                                Tag1 = recipe.strCategory ? (
                                    <div className="flex items-center gap-1.5 bg-[#ce7c1c]/10 border border-[#ce7c1c]/20 text-[#ce7c1c] px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        <CategoryIcon className="w-3 h-3" />
                                        {recipe.strCategory}
                                    </div>
                                ) : null;

                                Tag2 = recipe.strAlcoholic ? (
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                        isAlcoholic ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-green-500/10 border-green-500/20 text-green-400"
                                    }`}>
                                        {isAlcoholic ? <Martini className="w-3 h-3" /> : <GlassWater className="w-3 h-3" />}
                                        {recipe.strAlcoholic}
                                    </div>
                                ) : null;

                            } else {
                                const CategoryIcon = getCategoryIcon(recipe.strCategory);

                                Tag1 = recipe.strCategory ? (
                                    <div className="flex items-center gap-1.5 bg-[#ce7c1c]/10 border border-[#ce7c1c]/20 text-[#ce7c1c] px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        <CategoryIcon className="w-3 h-3" />
                                        {recipe.strCategory}
                                    </div>
                                ) : null;

                                Tag2 = recipe.strArea ? (
                                    <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        <Globe className="w-3 h-3" />
                                        {recipe.strArea}
                                    </div>
                                ) : null;
                            }

                            return (
                                <div
                                    key={recipe.id || recipe.idMeal || recipe.idDrink}
                                    onClick={() => clickHandler(recipe)}
                                    className="group bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 hover:border-[#ce7c1c]/50 transition-all duration-300 cursor-pointer shadow-lg hover:-translate-y-1"
                                >
                                    <div className="relative aspect-video overflow-hidden">
                                        <img
                                            src={image || "/placeholder.svg"}
                                            alt={title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            loading="lazy"
                                        />
                                        {hasMatchData && (
                                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full p-1 shadow-xl">
                                                <CircularMatchIndicator matchPercentage={recipe.matchPercentage} canCook={canCook} size="sm" />
                                            </div>
                                        )}
                                        {canCook && (
                                            <div className="absolute bottom-3 left-3 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                <span>Ready to Cook</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h3 className="text-xl font-bold font-title text-gray-100 mb-3 line-clamp-2 leading-tight group-hover:text-[#ce7c1c] transition-colors">
                                            {title}
                                        </h3>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {Tag1}
                                            {Tag2}
                                        </div>

                                        <div className="flex flex-wrap gap-3 text-sm text-gray-500 font-medium">
                                            {recipe.readyInMinutes && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {recipe.readyInMinutes}m
                                                </div>
                                            )}
                                            {recipe.servings && (
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {recipe.servings}
                                                </div>
                                            )}
                                        </div>

                                        {hasMatchData && !canCook && recipe.missingIngredients > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
                                                You need {recipe.missingIngredients} more ingredient{recipe.missingIngredients > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </main>

            {visibleError && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
                    <Alert className="pointer-events-auto bg-red-950/95 border-red-500 text-white rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)] backdrop-blur-xl p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-300 max-w-md w-full">
                        <div className="bg-red-500/20 p-3 rounded-full animate-bounce">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                        <AlertDescription className="text-lg font-bold font-title tracking-wide ml-0">
                            {visibleError}
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    )
}

export default UserInput