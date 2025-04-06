"use client"

import {useState, useEffect, useMemo} from "react"
import { useNavigate} from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {AI_CONFIG} from "@/ai.js";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import useFetchMeals from "./GetMeals.jsx"
import useTheMealDB from "./getTheMealDB.jsx"
import useTheCocktailDB from "./GetCocktailDB.jsx";

import {Check,PlusCircle, Loader2, X, ChevronLeft, ChevronRight, InfoIcon} from "lucide-react"

import { getGaladrielResponse,batchGaladrielResponse,clearValidationCache } from "@/getGaladrielResponse.jsx"

import CookableSearch from "./CookableSearch.jsx";

import {
    GiSlicedBread,
    GiCarrot,
    GiCow,
    GiFishingHook,
    GiCheeseWedge,
    GiFruitBowl,
    GiChickenLeg,
    GiCupcake, GiFishCooked, GiRoastChicken, GiSteak
} from "react-icons/gi"

import MealForgerLogo from "./Images/Meal_Forger.png"
import {BiDrink} from "react-icons/bi";

const categoryIngredients = {
    "Dessert": {
        mealDB: ["Chocolate", "Honey", "Vanilla"],
        spoonacular: ["Cocoa Powder", "Custard", "Whipped Cream"]
    },
    "Bread": {
        mealDB: ["Baguette", "Ciabatta", "Pita"],
        spoonacular: ["Whole Wheat", "Rye", "Sourdough"]
    },
    "Vegetables": {
        mealDB: ["Carrot", "Broccoli", "Zucchini"],
        spoonacular: ["Spinach", "Kale", "Bell Pepper"]
    },
    "Beef": {
        mealDB: ["Ground Beef", "Sirloin", "Brisket"],
        spoonacular: ["Short Ribs", "T-Bone", "Flank Steak"]
    },
    "Fish": {
        mealDB: ["Salmon", "Tuna", "Cod"],
        spoonacular: ["Haddock", "Mackerel", "Tilapia"]
    },
    "Cheese": {
        mealDB: ["Cheddar", "Mozzarella", "Feta"],
        spoonacular: ["Parmesan", "Gorgonzola", "Goat Cheese"]
    },
    "Fruit": {
        mealDB: ["Apple", "Banana", "Strawberry"],
        spoonacular: ["Mango", "Peach", "Pineapple"]
    },
    "Chicken": {
        mealDB: ["Chicken Breast", "Chicken Thigh", "Chicken Wings"],
        spoonacular: ["Whole Chicken", "Rotisserie Chicken", "Chicken Drumstick"]
    }
};

const popularIngredients = [
    {
        name: "Dessert",
        icon: GiCupcake,
        color: "text-yellow-400 group-hover:text-yellow-500",
        size: "w-50 h-50",
    },
    {
        name: "Bread",
        icon: GiSlicedBread,
        color: "text-amber-600 group-hover:text-amber-700",
        size: "w-50 h-50",
    },
    {
        name: "Vegetables",
        icon: GiCarrot,
        color: "text-green-800 group-hover:text-green-600",
        size: "w-50 h-50",
    },
    {
        name: "Beef",
        icon: GiSteak,
        color: "text-red-500 group-hover:text-red-600",
        size: "w-50 h-50",
    },
    {
        name: "Fish",
        icon: GiFishCooked,
        color: "text-blue-400 group-hover:text-blue-500",
        size: "w-50 h-50",
    },
    {
        name: "Cheese",
        icon: GiCheeseWedge,
        color: "text-yellow-300 group-hover:text-yellow-400",
        size: "w-50 h-50",
    },
    {
        name: "Fruit",
        icon: GiFruitBowl,
        color: "text-pink-500 group-hover:text-pink-600",
        size: "w-50 h-50",
    },
    {
        name: "Chicken",
        icon: GiRoastChicken,
        color: "text-orange-400 group-hover:text-orange-500",
        size: "w-80 h-80",
    },
]

const stripHtml = (html) => {
    if (!html) {
        return "";
    }
    return html.replace(/<\/?[^>]+(>|$)/g, "");
};

const debugCache = () => {
    const cachedSummaries = JSON.parse(localStorage.getItem("recipeSummaries")) || {};
    return Object.keys(cachedSummaries).length;
};

const Pagination = ({recipesPerPage, totalRecipes, paginate, currentPage}) => {
    const pageNumbers = [];
    const totalPages = Math.ceil(totalRecipes / recipesPerPage);

    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
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
                    >
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>
                </li>
                {pageNumbers.map((number) => (
                    <li key={number}>
                        <Button
                            onClick={() => paginate(number)}
                            variant={currentPage === number ? "default" : "outline"}
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
                    >
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                </li>
            </ul>
        </nav>
    );
};

const UserInput = () => {

    const [inputString, setInputString] = useState("")
    const [ingredients, setIngredients] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedDiet, setSelectedDiet] = useState(null)
    const [errorMessage, setErrorMessage] = useState("")
    const {recipes, error, getRecipes} = useFetchMeals()
    const [apiLimitReached, setApiLimitReached] = useState(false)
    const {getMealDBRecipes, MealDBRecipes, loading} = useTheMealDB()
    const {CocktailDBDrinks, getCocktailDBDrinks} = useTheCocktailDB()
    const [allRecipes, setAllRecipes] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const recipesPerPage = 5
    const navigate = useNavigate()
    const [recipeType, setRecipeType] = useState("all")
    const [showInput, setShowInput] = useState(true)
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)

    useEffect(() => {
        setApiLimitReached(false)
    }, [])

    useEffect(() => {
        if (error && (
            error.includes("API limit") ||
            error.includes("quota") ||
            error.includes("402") ||
            error.includes("429")
        )) {
            setApiLimitReached(true)
        }
    }, [error])

    useEffect(() => {
        const mealDBRecipesArray = Array.isArray(MealDBRecipes) ? MealDBRecipes : []
        const cocktailDBRecipesArray = Array.isArray(CocktailDBDrinks)
            ? CocktailDBDrinks.map((drink) => ({
                ...drink,
                isDrink: true,
                strMealThumb: drink.strMealThumb,
                summary: drink.summary || ""
            }))
            : [];

        let filteredRecipes = []

        if (recipeType === "all") {
            filteredRecipes = [...recipes, ...mealDBRecipesArray, ...cocktailDBRecipesArray]
        } else if (recipeType === "drinks") {
            filteredRecipes = [...cocktailDBRecipesArray]
        } else if (recipeType === "meals") {
            filteredRecipes = [...recipes, ...mealDBRecipesArray]
        }

        generateSummaries(filteredRecipes);
        setAllRecipes(filteredRecipes)
    }, [recipes, MealDBRecipes, CocktailDBDrinks, recipeType])

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const {currentRecipes, indexOfFirstRecipe, indexOfLastRecipe} = useMemo(() => {
        const indexOfLastRecipe = currentPage * recipesPerPage;
        const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
        const currentRecipes = allRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe);

        return {currentRecipes, indexOfFirstRecipe, indexOfLastRecipe};
    }, [allRecipes, currentPage, recipesPerPage]);

    useEffect(() => {
        if (currentRecipes.length > 0) {
            const recipeNeedingSummaries = currentRecipes.filter(recipe => !recipe.summary);
            if (recipeNeedingSummaries.length > 0) {
                generateSummaries(currentRecipes);
            }
        }
    }, [currentPage, allRecipes.length]);

    const generateSummaries = async (recipes) => {
        const cachedSummaries = JSON.parse(localStorage.getItem("recipeSummaries")) || {};
        const uncachedRecipes = recipes.filter(recipe => !recipe.summary);

        if (uncachedRecipes.length === 0) return;

        const generateSummariesIndividually = async (recipes) => {
            const updates = {}
            for (const recipe of recipes) {
                if (!recipe.summary) {
                    const dishName = recipe.strMeal || recipe.strDrink || recipe.title;
                    if (cachedSummaries[dishName]) {
                        updates[dishName] = cachedSummaries[dishName];
                    } else {
                        try {
                            const summary = await getGaladrielResponse(`Describe ${dishName} in 2 sentences`, "summary");
                            updates[dishName] = summary;
                            cachedSummaries[dishName] = summary;
                        } catch (error) {
                            console.error(`Error generating summary for ${dishName}:`, error);
                            updates[dishName] = "Description unavailable";
                        }
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                setAllRecipes(prevRecipes => {
                    return prevRecipes.map(recipe => {
                        const dishName = recipe.strMeal || recipe.strDrink || recipe.title;
                        if (updates[dishName]) {
                            return {...recipe, summary: updates[dishName]};
                        }
                        return recipe;
                    });
                });
                localStorage.setItem("recipeSummaries", JSON.stringify(cachedSummaries));
            }
        };

        if (uncachedRecipes.length >= AI_CONFIG.BATCH_THRESHOLD) {
            try {
                const dishNames = uncachedRecipes.map(r => r.strMeal || r.strDrink || r.title);
                const batchResult = await batchGaladrielResponse(dishNames, "summary");
                const summaries = batchResult.split('\n');

                const summaryMap = {};
                uncachedRecipes.forEach((recipe, index) => {
                    if (index < summaries.length) {
                        const dishName = recipe.strMeal || recipe.strDrink || recipe.title;
                        summaryMap[dishName] = summaries[index];
                        cachedSummaries[dishName] = summaries[index];
                    }
                });

                setAllRecipes(prevRecipes => {
                    return prevRecipes.map(recipe => {
                        const dishName = recipe.strMeal || recipe.strDrink || recipe.title;
                        if (summaryMap[dishName]) {
                            return {...recipe, summary: summaryMap[dishName]};
                        }
                        return recipe;
                    });
                });

                localStorage.setItem("recipeSummaries", JSON.stringify(cachedSummaries));
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
            const recipesNeedingSummaries = allRecipes.filter(recipe => !recipe.summary);
            if (recipesNeedingSummaries.length > 0) {
                generateSummaries(recipesNeedingSummaries);
            }
        }
    }, [allRecipes.length]);

    const handleInputChange = ({target: {value}}) => {
        setInputString(value)
    }

    const handleAddIngredient = async () => {
        if (inputString.trim() === "") {
            setErrorMessage("Please enter valid ingredients.");
            return;
        }

        setIsSearching(true);
        setErrorMessage("");

        try {
            const ingredientsArray = inputString.split(',')
                .map(item => item.trim())
                .filter(Boolean);

            const duplicates = [];
            const validationErrors = [];
            const newIngredients = [];

            const existingLower = ingredients.map(i => i.toLowerCase());
            const uniqueInputs = [...new Set(ingredientsArray)];

            for (const ingredient of uniqueInputs) {
                const lowerIngredient = ingredient.toLowerCase();

                if (existingLower.includes(lowerIngredient)) {
                    duplicates.push(ingredient);
                    continue;
                }

                const result = await getGaladrielResponse(ingredient, "validate");

                if (result.startsWith('Error:')) {
                    validationErrors.push(result);
                } else {
                    if (!existingLower.includes(result.toLowerCase())) {
                        newIngredients.push(result);
                    } else {
                        duplicates.push(ingredient);
                    }
                }
            }

            if (newIngredients.length > 0) {
                setIngredients(prev => [...prev, ...newIngredients]);
            }

            let errorParts = [];
            if (duplicates.length > 0) {
                errorParts.push(`Already added: ${duplicates.join(', ')}`);
            }
            if (validationErrors.length > 0) {
                errorParts.push(`Invalid: ${validationErrors.join(', ')}`);
            }

            if (errorParts.length > 0) {
                setErrorMessage(errorParts.join('. '));
            }

        } catch (error) {
            setErrorMessage("Failed to validate ingredients. Please try again.");
        } finally {
            setIsSearching(false);
            setInputString("");
        }
    };

    const handleRemoveIngredient = (ingredientToRemove) => {
        setIngredients(ingredients.filter((ingredient) => ingredient !== ingredientToRemove))
    }

    const handleClearValidationCache = () => {
        clearValidationCache();
        Object.keys(localStorage)
            .filter(key => key.includes('ai-'))
            .forEach(key => localStorage.removeItem(key));
        alert('Validation cache has been cleared. Please try adding ingredients again.');
    };

    const handleSearch = async () => {
        if (ingredients.length > 0) {
            setIsSearching(true);
            setApiLimitReached(false);

            try {
                const apiCalls = [
                    apiLimitReached ? Promise.resolve([]) : getRecipes(ingredients, selectedDiet),
                    getMealDBRecipes(ingredients),
                    getCocktailDBDrinks(ingredients),
                ];

                const results = await Promise.allSettled(apiCalls);

                results.forEach((result, index) => {
                    if (result.status === "rejected") {
                        const errorMsg = String(result.reason);
                        if (errorMsg.includes("402") || errorMsg.includes("429")) {
                            setApiLimitReached(true);
                        }
                    }
                });
            } catch (error) {
                console.error("Error during search:", error);
            } finally {
                setIsSearching(false);
            }
        }
    };

    //Recipe to test 
    //Olive Oil, Onion, Carrots, Fish Stock, Water, Potatoes, Bay Leaf, Cod, Salmon
    const handleCookableSearch = async (searchOptions) => {
        if (ingredients.length === 0) return;

        setIsSearching(true);
        setApiLimitReached(false);

        try {
            const apiParams = {
                includeIngredients: ingredients.join(","),
                diet: selectedDiet || undefined,
                addRecipeInformation: true,
                fillIngredients: true,
                instructionsRequired: true,
                number: 20,
            };

            if (searchOptions.cookableOnly) {
                apiParams.sort = "min-missing-ingredients";
                apiParams.ranking = 2;
            } else {
                apiParams.sort = "max-used-ingredients";
                apiParams.ranking = 1;
            }

            const apiCalls = [
                apiLimitReached ? Promise.resolve([]) : getRecipes(ingredients, selectedDiet, apiParams),
                getMealDBRecipes(ingredients),
                getCocktailDBDrinks(ingredients),
            ];

            const results = await Promise.allSettled(apiCalls);

            // Process results
            results.forEach((result, index) => {
                if (result.status === "rejected") {
                    const errorMsg = String(result.reason);
                    if (errorMsg.includes("402") || errorMsg.includes("429")) {
                        setApiLimitReached(true);
                    }
                }
            });

            // Collect all recipes from all API sources
            let allFetchedRecipes = [];
            results.forEach((result, index) => {
                if (result.status === "fulfilled" && Array.isArray(result.value)) {
                    allFetchedRecipes = [...allFetchedRecipes, ...result.value];
                }
            });

            // Filter for cookable recipes if needed
            if (searchOptions.cookableOnly) {
                const cookableRecipes = allFetchedRecipes.filter(recipe =>
                    isRecipeCookable(recipe, ingredients)
                );

                if (cookableRecipes.length === 0) {
                    setErrorMessage(
                        "No recipes found that you can make with your current ingredients. Showing all related recipes instead."
                    );
                    setTimeout(() => setErrorMessage(""), 5000);
                    setAllRecipes(allFetchedRecipes);
                } else {
                    setAllRecipes(cookableRecipes);
                }
            } else {
                setAllRecipes(allFetchedRecipes);
            }

        } catch (error) {
            console.error("Error during search:", error);
            setErrorMessage("An error occurred while searching for recipes. Please try again.");
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setIsSearching(false);
        }
    };

    const isRecipeCookable = (recipe, userIngredients) => {
        const normalizedUserIngredients = userIngredients.map(ing =>
            getBaseIngredient(ing).toLowerCase().trim()
        );

        // Get all non-empty recipe ingredients
        const recipeIngredients = [];

        // TheMealDB format
        if (recipe.strIngredient1) {
            for (let i = 1; i <= 20; i++) {
                const ing = recipe[`strIngredient${i}`];
                if (ing && ing.trim() !== "") {
                    const normalized = getBaseIngredient(ing);
                    if (normalized) recipeIngredients.push(normalized);
                }
            }
        }
        // Spoonacular format
        else if (recipe.extendedIngredients) {
            recipe.extendedIngredients.forEach(ing => {
                if (ing.name) {
                    const normalized = getBaseIngredient(ing.name);
                    if (normalized) recipeIngredients.push(normalized);
                }
            });
        }
        // CocktailDB format
        else if (recipe.idDrink) {
            for (let i = 1; i <= 15; i++) {
                const ing = recipe[`strIngredient${i}`];
                if (ing && ing.trim() !== "") {
                    const normalized = getBaseIngredient(ing);
                    if (normalized) recipeIngredients.push(normalized);
                }
            }
        }

        // Check if all recipe ingredients exist in user's ingredients
        return recipeIngredients.every(recipeIng =>
            normalizedUserIngredients.some(userIng =>
                userIng.includes(recipeIng) || recipeIng.includes(userIng)
            ));
    };

    const handleQuickSearch = (category) => {
        setSelectedCategory(category)
        setCategoryDialogOpen(true)
    }

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
            let apiCalls;

            if (apiLimitReached) {
                apiCalls = [getMealDBRecipes(searchQuery)];
            } else {
                apiCalls = [
                    getRecipes(searchQuery, selectedDiet),
                    getMealDBRecipes(searchQuery)
                ];
            }

            const results = await Promise.allSettled(apiCalls);

            let mealDBRecipes = [];
            let spoonacularRecipes = [];
            let spoonacularError = false;

            results.forEach((result, index) => {
                if (result.status === "fulfilled" && Array.isArray(result.value)) {
                    if (index === 0 && !apiLimitReached) {
                        spoonacularRecipes = result.value;
                    } else {
                        mealDBRecipes = result.value;
                    }
                } else if (result.status === "rejected") {
                    const errorMsg = String(result.reason);
                    if (!apiLimitReached && (errorMsg.includes("402") || errorMsg.includes("429") || errorMsg.includes("quota"))) {
                        spoonacularError = true;
                    }
                }
            });

            if (spoonacularError) {
                setApiLimitReached(true);
            }

            const combinedRecipes = [...mealDBRecipes, ...spoonacularRecipes];
            setAllRecipes(combinedRecipes);
            setCurrentPage(1);

        } catch (error) {
            console.error("Error during quick search:", error);
            setErrorMessage("An unexpected error occurred.");
        } finally {
            setIsSearching(false);
        }
    };

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
        const currentPath = window.location.pathname;

        if (recipe.isDrink) {
            navigate(`/drink/${recipe.idDrink}`, {
                state: {
                    drink: recipe,
                    userIngredients: ingredients,
                    allRecipes: allRecipes,
                    previousPath: currentPath
                }
            });
        } else if (recipe.idMeal) {
            navigate(`/mealdb-recipe/${recipe.idMeal}`, {
                state: {
                    meal: recipe,
                    userIngredients: ingredients,
                    allRecipes: allRecipes,
                    previousPath: currentPath
                }
            });
        } else {
            navigate(`/recipe/${recipe.id}`, {
                state: {
                    recipe,
                    userIngredients: ingredients,
                    allRecipes: allRecipes,
                    previousPath: currentPath
                }
            });
        }
    }

    useEffect(() => {
        if (errorMessage) {
            setShowInput(false)
            const timer = setTimeout(() => {
                setShowInput(true)
                setErrorMessage("")
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage])

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="logo-container flex justify-center items-center">
                    <div className="w-64 h-auto">
                        <img src={MealForgerLogo || "/placeholder.svg"} alt="Meal Forger Logo"
                             className="max-w-full max-h-full"/>
                    </div>
                </div>
                <div className="space-y-6">
                    {apiLimitReached && (
                        <Alert className="bg-amber-900/50 border-amber-700 text-amber-100">
                            <InfoIcon className="h-4 w-4 text-amber-400"/>
                            <AlertTitle>Spoonacular API Limit Reached</AlertTitle>
                            <AlertDescription>
                                Daily API limit for Spoonacular has been reached. You can still view recipes from
                                TheMealDB and TheCocktailDB.
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
                                            className="group flex flex-col items-center justify-center p-3 h-28 w-full transition-all duration-200 hover:bg-gray-700/50"
                                            disabled={isSearching}
                                        >
                                            <item.icon
                                                className={`category-icon w-20 h-18 mb-2 transition-colors ${item.color}`}/>
                                            <span className="text-sm font-medium text-center group-hover:text-white">
                                                {item.name}
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-700"/>
                                </div>
                                <div className="relative flex justify-center text-sm uppercase">
                                    <span className="px-3 py-1 text-gray-400 bg-gray-800 rounded-md">
                                        or search by ingredients
                                    </span>
                                </div>
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
                                            <PlusCircle className="w-4 h-4 mr-2"/>
                                            Add Ingredients
                                        </Button>
                                    </div>

                                    {/* Selected Ingredients */}
                                    {ingredients.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-400">Selected ingredients:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {ingredients.map((ingredient) => (
                                                    <div key={ingredient} className="bg-green-900/50 text-green-100 px-3 py-1 rounded-full text-sm flex items-center">
                                                        <Check className="h-4 w-4 mr-1"/>
                                                        {ingredient}
                                                        <Button variant="ghost" size="sm" className="ml-1 h-4 w-4 p-0 hover:bg-green-800" onClick={() => handleRemoveIngredient(ingredient)}><X className="h-3 w-3"/></Button>
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
                                                <SelectValue placeholder="No specific diet"/>
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
                                                <SelectValue placeholder="All Recipes"/>
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
                                {/* Search Button */}
                                {/*<Button*/}
                                {/*    onClick={handleSearch}*/}
                                {/*    className="w-full gradient-button text-white font-bold py-2 px-4 rounded"*/}
                                {/*    disabled={ingredients.length === 0 || isSearching}*/}
                                {/*    size="lg"*/}
                                {/*>*/}
                                {/*    {isSearching ? (*/}
                                {/*        <>*/}
                                {/*            <Loader2 className="w-4 h-4 mr-2 animate-spin"/>*/}
                                {/*            Searching...*/}
                                {/*        </>*/}
                                {/*    ) : (*/}
                                {/*        "Generate Recipes"*/}
                                {/*    )}*/}
                                {/*</Button>*/}
                            </div>
                            <CookableSearch
                                onSearch={handleCookableSearch}
                                ingredients={ingredients}
                                selectedDiet={selectedDiet}
                                isSearching={isSearching}
                            />
                        </CardContent>
                    </Card>
                    
                    {/* Category Selection Dialog */}
                    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                        <DialogContent className="bg-gray-800 text-white max-w-md">
                            <DialogTitle className="text-center text-xl font-bold mb-2">
                                {selectedCategory} Recipes
                            </DialogTitle>
                            <DialogDescription className="text-center text-gray-300 mb-6">
                                Would you like to search for a specific {selectedCategory} ingredient or let us choose for you?
                            </DialogDescription>

                            <div className="space-y-4">
                                {/* Surprise Me Button */}
                                <Button
                                    variant="default"
                                    onClick={() => handleCategorySearch(selectedCategory)}
                                    className="w-full py-6 text-lg font-bold">
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
                                        {[...categoryIngredients[selectedCategory].mealDB, ...categoryIngredients[selectedCategory].spoonacular].map((ingredient) => (
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
                        <p className="text-red-500 text-center">
                            Error: Unable to fetch recipes. Please try again later.
                        </p>
                    )}
                    {allRecipes.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-center">Found Recipes
                                ({allRecipes.length})</h3>
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

    function getBaseIngredient(ingredient) {
        if (!ingredient || typeof ingredient !== 'string') return '';

        // Remove measurements and descriptors
        let base = ingredient
            .replace(/\d+\.?\d*\s*(tsp|tbsp|cup|cups|oz|g|kg|ml|l|lb|pound|pounds|packet|packets|clove|cloves|slice|slices)\b/gi, '')
            .replace(/\([^)]*\)/g, '')
            .replace(/\b(fresh|dried|ground|chopped|sliced|minced|grated|peeled|cubed|whole|organic|raw|cooked|boneless|skinless|lean|extra lean|low fat|fat free)\b/gi, '')
            .trim()
            .toLowerCase();

        // Common substitutions
        const substitutions = {
            'tomatoes': 'tomato',
            'potatoes': 'potato',
            'onions': 'onion',
            'carrots': 'carrot',
            'peppers': 'pepper',
            'red pepper': 'pepper',
            'green pepper': 'pepper',
            'chicken breasts': 'chicken',
            'chicken breast': 'chicken',
            'cheddar cheese': 'cheddar',
            'heavy cream': 'cream',
            'chicken stock': 'stock',
            'fajita seasoning': 'seasoning',
            // Add more as needed
        };

        return substitutions[base] || base;
    }
}

export default UserInput