
import {useEffect, useMemo, useState} from "react"
import {useNavigate} from "react-router-dom"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {Badge} from "@/components/ui/badge"
import {AI_CONFIG} from "@/ai.js"

import {Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger} from "@/components/ui/dialog"

import useFetchMeals from "./GetMeals.jsx"
import useTheMealDB from "./getTheMealDB.jsx"
import useTheCocktailDB from "./GetCocktailDB.jsx"

import {Check, ChevronLeft, ChevronRight, InfoIcon, PlusCircle, X} from "lucide-react"

import {batchGaladrielResponse, clearValidationCache, getGaladrielResponse} from "@/getGaladrielResponse.jsx"

import CookableSearch from "./CookableSearch.jsx"

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
import {BiDrink} from "react-icons/bi"

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
};

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
        
        setAllRecipes([
            ...spoonacularRecipesArray,
            ...mealDBRecipesArray,
            ...cocktailDBRecipesArray,
        ])
    }, [MealDBRecipes, CocktailDBDrinks, recipes])

    // useEffect(() => {
    //     console.log('Spoonacular recipes:', recipes);
    //     console.log('MealDB recipes:', MealDBRecipes);
    //     console.log('CocktailDB recipes:', CocktailDBDrinks);
    //     console.log('All combined recipes:', allRecipes);
    // }, [recipes, MealDBRecipes, CocktailDBDrinks, allRecipes]);

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
                const dishName = recipe.strMeal || recipe.strDrink || recipe.title;
                return dishName && !recipe.summary;
            });

            if (recipeNeedingSummaries.length > 0) {
                generateSummaries(recipeNeedingSummaries);
            }
        }
    }, [currentPage, allRecipes.length]);

    const generateSummaries = async (recipes) => {
        const cachedSummaries = JSON.parse(localStorage.getItem("recipeSummaries")) || {};
        const uncachedRecipes = recipes.filter((recipe) => !recipe.summary);

        if (uncachedRecipes.length === 0) return;

        const generateSummariesIndividually = async (recipesToProcess) => {
            const updates = {};
            for (const recipe of recipesToProcess) {
                const dishName = recipe.strMeal || recipe.strDrink || recipe.title;
                if (!dishName) continue;

                if (cachedSummaries[dishName]) {
                    updates[dishName] = cachedSummaries[dishName];
                } else {
                    try {
                        const summary = await getGaladrielResponse(
                            `Describe ${dishName} in 2 sentences`,
                            "summary"
                        );
                        updates[dishName] = summary;
                        cachedSummaries[dishName] = summary;
                    } catch (error) {
                        console.error(`Error generating summary for ${dishName}:`, error);
                        updates[dishName] = "Description unavailable";
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                // Update both localStorage and state
                localStorage.setItem("recipeSummaries", JSON.stringify(cachedSummaries));

                setAllRecipes((prevRecipes) => {
                    return prevRecipes.map((recipe) => {
                        const dishName = recipe.strMeal || recipe.strDrink || recipe.title;
                        return updates[dishName] ? { ...recipe, summary: updates[dishName] } : recipe;
                    });
                });
            }
        };

        if (uncachedRecipes.length >= AI_CONFIG.BATCH_THRESHOLD) {
            try {
                const dishNames = uncachedRecipes.map((r) => r.strMeal || r.strDrink || r.title).filter(Boolean);
                const batchResult = await batchGaladrielResponse(dishNames, "summary");
                const summaries = batchResult.split("\n");

                const summaryMap = {};
                uncachedRecipes.forEach((recipe, index) => {
                    const dishName = recipe.strMeal || recipe.strDrink || recipe.title;
                    if (dishName && index < summaries.length) {
                        summaryMap[dishName] = summaries[index];
                        cachedSummaries[dishName] = summaries[index];
                    }
                });

                // Update both localStorage and state
                localStorage.setItem("recipeSummaries", JSON.stringify(cachedSummaries));

                setAllRecipes((prevRecipes) => {
                    return prevRecipes.map((recipe) => {
                        const dishName = recipe.strMeal || recipe.strDrink || recipe.title;
                        return summaryMap[dishName] ? { ...recipe, summary: summaryMap[dishName] } : recipe;
                    });
                });
            } catch (error) {
                console.error("Batch summary failed:", error);
                await generateSummariesIndividually(uncachedRecipes);
            }
        } else {
            await generateSummariesIndividually(uncachedRecipes);
        }
    };

    useEffect(() => {
        if (allRecipes.length > 0) {
            const recipesNeedingSummaries = allRecipes.filter((recipe) => {
                const dishName = recipe.strMeal || recipe.strDrink || recipe.title;
                return dishName && !recipe.summary;
            });

            if (recipesNeedingSummaries.length > 0) {
                generateSummaries(recipesNeedingSummaries);
            }
        }
    }, [allRecipes]);

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

    const handleClearValidationCache = () => {
        clearValidationCache()
        Object.keys(localStorage)
            .filter((key) => key.includes("ai-"))
            .forEach((key) => localStorage.removeItem(key))
        alert("Validation cache has been cleared. Please try adding ingredients again.")
    }

    const handleSearch = async ({ cookableOnly = false, strictMode = false, focusSearch = false, focusIngredient = null }) => {
        if (ingredients.length === 0) return;

        setIsSearching(true);
        setApiLimitReached(false);
        setFocusSearch(focusSearch);
        setFocusIngredient(focusIngredient || "");
        setErrorMessage(""); // Clear previous errors

        try {
            let spoonacularResults = [];
            let mealDBResults = [];
            let cocktailResults = [];

            // Spoonacular call with explicit error handling
            if (!apiLimitReached) {
                try {
                    spoonacularResults = await getRecipes(ingredients, selectedDiet, {
                        cookableOnly,
                        strictMode,
                        focusIngredient
                    }) || [];
                } catch (spoonError) {
                    console.error("Spoonacular error:", spoonError);
                    if (spoonError.response?.status === 402 || spoonError.response?.status === 429) {
                        setApiLimitReached(true);
                    }
                    // Don't set general error - fall through to other APIs
                }
            }

            // Other API calls
            try {
                [mealDBResults, cocktailResults] = await Promise.all([
                    getMealDBRecipes(ingredients),
                    getCocktailDBDrinks(ingredients)
                ]);
            } catch (otherError) {
                console.error("Other API error:", otherError);
                // Only show error if ALL APIs failed
                if (spoonacularResults.length === 0) {
                    setErrorMessage("Failed to fetch recipes from all sources");
                }
            }

            const allRecipes = [
                ...spoonacularResults,
                ...(mealDBResults || []),
                ...(cocktailResults || [])
            ];

            setAllRecipes(allRecipes);
            setCurrentPage(1);

            // Show warning if only fallback recipes available
            if (apiLimitReached && allRecipes.length > 0) {
                setErrorMessage("Using fallback recipes (Spoonacular limit reached)");
            }

        } catch (error) {
            console.error("Search error:", error);
            // Only show error if we got ZERO results
            if (allRecipes.length === 0) {
                setErrorMessage("Failed to fetch recipes. Please try again.");
            }
        } finally {
            setIsSearching(false);
        }
    };

    // Helper to extract ingredients from any recipe format
    const getRecipeIngredients = (recipe) => {
        // Add debug logging
        console.log("Getting ingredients for:", recipe.title || recipe.strMeal || recipe.strDrink)

        if (recipe.strMeal && recipe.strIngredient1) {
            // TheMealDB format
            const ingredients = Array.from({ length: 20 }, (_, i) =>
                recipe[`strIngredient${i + 1}`] || "").filter(ing => ing && ing.trim())
            console.log(`Found ${ingredients.length} TheMealDB ingredients`)
            return ingredients
        } else if (recipe.extendedIngredients) {
            // Spoonacular format
            const ingredients = recipe.extendedIngredients.map(ing => ing.name || ing.original || "")
                .filter(ing => ing && ing.trim())
            console.log(`Found ${ingredients.length} Spoonacular ingredients`)
            return ingredients
        } else if (recipe.strDrink && recipe.strIngredient1) {
            // CocktailDB format - correctly identified by strDrink + strIngredient1
            const ingredients = Array.from({ length: 15 }, (_, i) =>
                recipe[`strIngredient${i + 1}`] || "").filter(ing => ing && ing.trim())
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
        setCategoryDialogOpen(false);
        setIsSearching(true);
        setApiLimitReached(false);
        setErrorMessage("");

        let searchQuery = specificIngredient || selectedCategory;

        if (!specificIngredient && categoryIngredients[selectedCategory]) {
            const chosenFood = Math.random() < 0.5;
            if (chosenFood && categoryIngredients[selectedCategory].mealDB.length > 0) {
                const randomIndex = Math.floor(Math.random() * categoryIngredients[selectedCategory].mealDB.length);
                searchQuery = categoryIngredients[selectedCategory].mealDB[randomIndex];
            } else if (categoryIngredients[selectedCategory].spoonacular.length > 0) {
                const randomIndex = Math.floor(Math.random() * categoryIngredients[selectedCategory].spoonacular.length);
                searchQuery = categoryIngredients[selectedCategory].spoonacular[randomIndex];
            }
        }

        setIngredients([searchQuery]);

        try {
            let mealDBRecipes = [];
            let spoonacularRecipes = [];

            // Only try Spoonacular if not limited
            if (!apiLimitReached) {
                try {
                    spoonacularRecipes = await getRecipes([searchQuery], selectedDiet);
                } catch (error) {
                    const errorMsg = String(error);
                    if (errorMsg.includes("402") || errorMsg.includes("429") || errorMsg.includes("quota")) {
                        setApiLimitReached(true);
                        setIsSpoonacularLimited(true);
                    }
                }
            }

            // Always try MealDB
            try {
                mealDBRecipes = await getMealDBRecipes([searchQuery]);
            } catch (error) {
                console.error("MealDB error:", error);
            }

            const combinedRecipes = [
                ...(Array.isArray(mealDBRecipes) ? mealDBRecipes : []),
                ...(Array.isArray(spoonacularRecipes) ? spoonacularRecipes : [])
            ];            
            setAllRecipes(combinedRecipes);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error during quick search:", error);
            setErrorMessage("An unexpected error occurred.");
        } finally {
            setIsSearching(false);
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
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="logo-container flex justify-center items-center">
                    <div className="w-64 h-auto">
                        <img src={MealForgerLogo || "/placeholder.svg"} alt="Meal Forger Logo" className="max-w-full max-h-full" />
                    </div>
                </div>
                <div className="space-y-6">
                    {apiLimitReached && (
                        <Alert className="bg-amber-900/50 border-amber-700 text-amber-100">
                            <InfoIcon className="h-4 w-4 text-amber-400" />
                            <AlertTitle>Spoonacular API Limit Reached</AlertTitle>
                            <AlertDescription>
                                Daily API limit for Spoonacular has been reached. You can still view recipes from TheMealDB and
                                TheCocktailDB.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Reorganized Input Section */}
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center">Find Recipes By Category</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Quick Search Section */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {popularIngredients.map((item) => (
                                        <Button
                                            key={item.name}
                                            variant="outline"
                                            onClick={() => handleQuickSearch(item.name)}
                                            className="group flex flex-col items-center justify-center p-3 h-32 w-full transition-all duration-200 hover:bg-gray-700/50"
                                            disabled={isSearching}
                                        >
                                            <div className="relative">
                                                <item.icon className={`category-icon ${item.size} transition-colors ${item.color}`} />
                                            </div>
                                            <span className="text-sm font-medium text-center group-hover:text-white mt-2">{item.name}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-700" />
                                </div>
                                <div className="relative flex justify-center text-sm uppercase"><span className="px-3 py-1 text-white font-bold bg-gray-800 rounded-md">or search by ingredients</span></div>
                            </div>

                            {/* Ingredient Input Section */}
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Input
                                            placeholder="Enter ingredients (comma-separated)"
                                            value={inputString}
                                            onChange={handleInputChange}
                                            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 flex-grow"
                                        />
                                        <Button
                                            onClick={handleAddIngredient}
                                            className="gradient-button text-white font-bold py-2 px-4 rounded sm:w-auto"
                                        >
                                            <PlusCircle className="w-4 h-4 mr-2" />
                                            Add Ingredients
                                        </Button>
                                    </div>

                                    {/* Selected Ingredients */}
                                    {ingredients.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-400">Selected ingredients:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {ingredients.map((ingredient) => (
                                                    <div
                                                        key={ingredient}
                                                        className="bg-green-900/50 text-green-100 px-3 py-1 rounded-full text-sm flex items-center"
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        {ingredient}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="ml-1 h-4 w-4 p-0 hover:bg-green-800"
                                                            onClick={() => handleRemoveIngredient(ingredient)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Filters Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-400">Dietary Restrictions</label>
                                        <Select value={selectedDiet} onValueChange={setSelectedDiet}>
                                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                                <SelectValue placeholder="No specific diet" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value={null}>No Specific Diet</SelectItem>
                                                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                                                <SelectItem value="vegan">Vegan</SelectItem>
                                                <SelectItem value="gluten-free">Gluten Free</SelectItem>
                                                <SelectItem value="ketogenic">Ketogenic</SelectItem>
                                                <SelectItem value="paleo">Paleo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-400">Recipe Type</label>
                                        <Select value={recipeType} onValueChange={setRecipeType}>
                                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                                <SelectValue placeholder="All Recipes" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                                <SelectItem value="all">All Recipes</SelectItem>
                                                <SelectItem value="meals">Meals Only</SelectItem>
                                                <SelectItem value="drinks">Drinks Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {errorMessage && (
                                    <Alert variant="destructive" className="bg-red-950 border-red-800 text-white">
                                        <InfoIcon className="h-4 w-4 text-red-300" />
                                        <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* CookableSearch Component */}
                    <CookableSearch
                        onSearch={handleSearch} 
                        ingredients={ingredients}
                        selectedDiet={selectedDiet}
                        isSearching={isSearching}
                        apiLimitReached={apiLimitReached}
                    />

                    {/* Category Selection Dialog */}
                    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                        <DialogContent className="bg-gray-800 text-white max-w-md">
                            <DialogTitle className="text-center text-xl font-bold mb-2">{selectedCategory} Recipes</DialogTitle>
                            <DialogDescription className="text-center text-gray-300 mb-6">
                                Would you like to search for a specific {selectedCategory} ingredient or let us choose for you?
                            </DialogDescription>

                            <div className="space-y-4">
                                {/* Surprise Me Button */}
                                <Button
                                    variant="default"
                                    onClick={() => handleCategorySearch(selectedCategory)}
                                    className="w-full py-6 text-lg font-bold"
                                >
                                    Surprise Me
                                </Button>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-700" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="px-3 bg-gray-800 text-sm text-gray-400 uppercase">OR CHOOSE SPECIFIC</span>
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
                                                className="py-4 font-medium hover:bg-gray-700/50"
                                            >
                                                {ingredient}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                   
                    {/* Results Section */}
                    {error && !apiLimitReached && allRecipes.length === 0 && (
                        <p className="text-red-500 text-center">Error: Unable to fetch recipes. Please try again later.</p>
                    )}
                    
                    {allRecipes.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold">Found Recipes ({allRecipes.length})</h3>
                                {focusSearch && (
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-amber-900/30 text-amber-200">Focused on: {focusIngredient}</Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFocusSearch}
                                            className="h-8 px-2 text-gray-400 hover:text-white"
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Clear focus
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {currentRecipes.map((recipe) => (
                                    <RecipeCard
                                        key={recipe.id || recipe.idMeal || recipe.idDrink}
                                        recipe={recipe}
                                        onClick={() => clickHandler(recipe)}
                                    />
                                ))}
                            </div>
                            <Pagination
                                recipesPerPage={recipesPerPage}
                                totalRecipes={allRecipes.length}
                                paginate={paginate}
                                currentPage={currentPage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserInput

