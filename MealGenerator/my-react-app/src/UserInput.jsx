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

import { InfoIcon, Search, Plus, Clock, Users, ChefHat, Sparkles, X } from "lucide-react"
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

import CookableSearch from "./CookableSearch.jsx"
import FirstTimeUserRecipes from "./FirstTimeUserRecipes.jsx"
import PantryList from "@/components/PantryList.jsx";
import RecipeGrid from "@/components/RecipeGrid.jsx";
import DietSelector from "@/components/DietSelector.jsx";
import FirstTimeUser from "@/components/FirstTimeUser.jsx";

import UseLocalStorageState from "@/Hooks/useLocalStorageState.jsx";
import useRecipeSearch from "@/Hooks/useRecipeSearch.jsx"
import useIngredientManager from "@/Hooks/useIngredientManager.jsx";

import {getCategoryIngredient} from "@/utils/categorySearch.js";
import RandomSelectionRecipes from "@/components/RandomSelectionRecipes.jsx";

const QuickSearchFood = {
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
    const [selectedDiet, setSelectedDiet] = useState(null)
    const { recipes, error, getRecipes } = useFetchMeals()
    const { getMealDBRecipes, MealDBRecipes, loading } = useTheMealDB()
    const { CocktailDBDrinks, getCocktailDBDrinks } = useTheCocktailDB()
    const navigate = useNavigate()
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [showFilters, setShowFilters] = useState(false)
    const [focusIngredient, setFocusIngredient] = useState("")
    const [randomRecipes, setRandomRecipes] = useState([]);



    const {
        isSearching,
        loadingText,
        errorMessage,
        allRecipes,
        searchRecipes,
        categorySearch,
        apiLimitReached
    } = useRecipeSearch({
        getRecipes,
        getMealDBRecipes,
        getCocktailDBDrinks,
        slugify,
    })

    const {
        ingredients,
        addIngredients,
        removeIngredient,
        clearIngredients,
    } = useIngredientManager();
    
    const {isFirstTimeUser, markAsReturningUser} = FirstTimeUser({
        onFirstTimeStatusChange: (isFirstTimeUser) => {
            console.log('First time user status changed:', isFirstTimeUser);
        }
    })
    
    useEffect(() => {
        apiLimitReached
    }, [])

    useEffect(() => {
        if (
            error &&
            (error.includes("API limit") || error.includes("quota") || error.includes("402") || error.includes("429"))
        ) {
            apiLimitReached
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
        //allRecipes
    }, [MealDBRecipes, CocktailDBDrinks, recipes])

    

    const handleInputChange = ({ target: { value } }) => {
        setInputString(value)
    }

    const handleAddIngredient = async () => {
        addIngredients(inputString.trim());
        setInputString("");
    }

    const handleRemoveIngredient = (ingredient) => {
        removeIngredient(ingredient);
    };
    
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleAddIngredient()
        }
    }
    const handleQuickSearch = (category) => {
        setSelectedCategory(category)
        setCategoryDialogOpen(true)
    }

    const triggerCategorySearch = (category) => {
        
        const selectedIngredient = getCategoryIngredient(QuickSearchFood, selectedCategory,category)

        categorySearch({ingredient: selectedIngredient})
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
                allRecipes:randomRecipes,
                previousPath: currentPath,
                // Store the ID explicitly
                recipeId: recipe.idMeal,
            },
        })
    }

    // useEffect(() => {
    //     console.log("🎯 UserInput received allRecipes:", allRecipes);
    // }, [allRecipes]);

    return (
        <div className="flex flex-col min-h-screen bg-[#131415] text-[#f5efe4]">
            {/* Header */}
            <header className="py-4 md:py-6">
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    {/* Logo row - centered with larger size */}
                    <div className="flex justify-center mb-4 md:mb-6">
                        <img
                            src={MealForgerLogo || "/placeholder.svg"}
                            alt="Meal Forger"
                            className="h-24 md:h-32 w-auto object-contain"
                        />
                    </div>

                    {/* Search and filter row - centered */}
                    <div className="flex flex-col items-center w-full space-y-3">
                        {/* Search bar - larger and centered */}
                        <div className="relative w-full max-w-2xl">
                            <Input
                                type="text"
                                placeholder="Enter an ingredient ....."
                                className="w-full bg-transparent border-2 border-gray-600 rounded-full py-3 text-white pl-12 pr-12 focus:border-[#ce7c1c] transition-all duration-300 text-base md:text-lg font-terminal"
                                value={inputString}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <div className="bg-[#ce7c1c]/20 p-2 rounded-full flex items-center justify-center">
                                    <Search className="h-4 w-4 md:h-5 md:w-5 text-[#ce7c1c]" />
                                </div>
                            </div>
                            <Button
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 rounded-full p-0 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center transition-all duration-300"
                                onClick={handleAddIngredient}
                            >
                                <Plus className="h-4 w-4 md:h-5 md:w-5 text-white" />
                            </Button>
                        </div>

                        {/* Filters button - centered below search */}
                        <Button
                            variant="outline"
                            className="border-2 border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c]/20 px-6 py-2 rounded-full font-bold transition-all duration-300 text-sm md:text-base"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            FILTERS
                        </Button>

                        {/* Cookable search */}
                        {showFilters && (
                            <div className="w-full max-w-2xl mt-2">
                                <CookableSearch
                                    onSearch={() => searchRecipes({ ingredients, selectedDiet })}
                                    ingredients={ingredients}
                                    selectedDiet={selectedDiet}
                                    isSearching={isSearching}
                                    focusIngredient={focusIngredient}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow overflow-x-hidden">
                <div className="max-w-6xl mx-auto px-2 md:px-6 py-2 md:py-4 pb-8 md:pb-16">
                    {!isFirstTimeUser && (
                        <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-center font-title">
                            <span className="text-[#ce7c1c]">Discover</span> Recipes With What You Have
                        </h1>
                    )}
                    {/* First Time User Experience */}
                    {isFirstTimeUser && (
                        <FirstTimeUserRecipes onDismiss={markAsReturningUser} />
                    )}
                    {/* Main Content Area - New Layout */}
                        <div className="mt-4 md:mt-6"></div>
                    {/* MY PANTRY - Full Width at Top */}
                    <PantryList ingredients={ingredients} onRemove={handleRemoveIngredient}/>
                  
                    
                    {/* RECIPES Section with Quick Add and My Diet on sides */}
                    {!isFirstTimeUser && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                            {/* Left Column - QUICK ADD */}
                            <div className="md:col-span-3 order-1">
                                <div className="p-4 h-full flex flex-col">
                                    <h3 className="text-2xl md:text-3xl font-bold mb-4 font-title text-center">
                                        <span className="text-white">QUICK</span> <span className="text-[#ce7c1c]">SEARCH</span>
                                    </h3>
                                    
                                    {/* Quick Add Grid - Icon-only buttons */}
                                    <div className="grid grid-rows-2 grid-cols-4 gap-3 mx-auto w-full">
                                        {popularIngredients.map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleQuickSearch(item.name)}
                                                className="flex items-center justify-center h-16 w-16 bg-gray-900/70 border-2 border-white hover:border-[#ce7c1c] rounded-full cursor-pointer group transition-all duration-300 transform hover:scale-110 hover:bg-gray-800/80 relative mx-auto"
                                                aria-label={`Quick add ${item.name}`}
                                                title={item.name}
                                            >
                                                <item.icon className={`w-8 h-8 ${item.color} transition-all duration-300`} />
                                                <span className="sr-only">{item.name}</span>
                                                <div className="absolute -bottom-1 opacity-0 group-hover:opacity-100 group-hover:bottom-1 transition-all duration-300 text-[10px] font-terminal text-white bg-gray-900/90 px-2 py-0.5 rounded-full">
                                                    {item.name}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Middle Column RECIPES */}
                            <RecipeGrid ingredients={ingredients}
                                        allRecipes={allRecipes}
                                        isSearching={isSearching}
                                        onRecipeClick={clickHandler}
                                        loadingText={loadingText}
                            ></RecipeGrid>
                            
                            {/* Right Column - MY DIET */}
                            <DietSelector selectedDiet={selectedDiet} setSelectedDiet={setSelectedDiet}/>
                        </div>
                    )}
                    {/* Popular Recipes - Below Main Content */}
                    {!isFirstTimeUser && (<RandomSelectionRecipes onRecipeClick={handleRandomRecipeClick} setRandomRecipes={setRandomRecipes}/> )}
                </div>
            </main>
            
            {/* Category Selection Dialog */}
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="bg-[#1e1e1e] border border-[#ce7c1c] text-white max-w-[90vw] md:max-w-md rounded-2xl md:rounded-3xl shadow-2xl mx-auto">
                    <DialogTitle className="text-center text-base md:text-lg font-title mb-2 text-[#ce7c1c]">
                        {selectedCategory} Recipes
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-300 mb-4 font-terminal text-xs md:text-sm">
                        Would you like to search for a specific {selectedCategory} ingredient or let us choose for you?
                    </DialogDescription>
                    <div className="space-y-3 md:space-y-4">
                        {/* Surprise Me Button */}
                        <Button
                            onClick={() => {
                                triggerCategorySearch(selectedCategory)
                                setCategoryDialogOpen(false)
                            }}
                            disabled={isSearching}
                        >
                            Surprise Me
                        </Button>
                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-700" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-2 bg-[#1e1e1e] text-xs text-gray-400 uppercase">OR CHOOSE SPECIFIC</span>
                            </div>
                        </div>
                        {/* Ingredient Grid */}
                        {selectedCategory && QuickSearchFood[selectedCategory] && (
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    ...QuickSearchFood[selectedCategory].mealDB,
                                    ...QuickSearchFood[selectedCategory].spoonacular,
                                ].map((ingredient) => (
                                    <Button
                                        key={ingredient}
                                        variant="outline"
                                        onClick={() => {
                                            triggerCategorySearch(selectedCategory)
                                            setCategoryDialogOpen(false)
                                        }}
                                        disabled={isSearching}
                                        className="py-2 text-xs md:text-sm font-terminal hover:bg-[#ce7c1c]/20 border-[#ce7c1c] text-white rounded-xl transform hover:scale-105 transition-all duration-300"
                                    >
                                        {ingredient}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Button
                onClick={() => searchRecipes({ ingredients, selectedDiet })}
                disabled={isSearching || ingredients.length === 0}
            >
                {isSearching ? "Generating..." : "Generate Recipes"}
            </Button>

            {errorMessage && (
                <div className="text-red-500 text-center mt-2 font-terminal text-xs md:text-sm">{errorMessage}</div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
                    <Alert className="bg-red-950 border-red-800 text-white rounded-xl shadow-lg">
                        <InfoIcon className="h-3 w-3 md:h-4 md:w-4 text-red-300 flex-shrink-0" />
                        <AlertDescription className="font-medium font-terminal text-xs md:text-sm">{errorMessage}</AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    )
}

export default UserInput
