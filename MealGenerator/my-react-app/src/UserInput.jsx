"use client"

import {useState, useEffect, useMemo} from "react"
import { useNavigate} from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { debounce } from "lodash";
import {AI_CONFIG} from "@/ai.js";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import useFetchMeals from "./getMeals.jsx"
import useTheMealDB from "./getTheMealDB.jsx"
import useTheCocktailDB from "./GetCocktailDB.jsx";

import {Check,PlusCircle, Loader2, X, ChevronLeft, ChevronRight, InfoIcon} from "lucide-react"

import { getGaladrielResponse,batchGaladrielResponse,clearValidationCache } from "@/getGaladrielResponse.jsx"

import {
    GiSlicedBread,
    GiCarrot,
    GiCow,
    GiFishingHook,
    GiCheeseWedge,
    GiFruitBowl,
    GiChickenLeg,
    GiCupcake
} from "react-icons/gi"

import MealForgerLogo from "./Images/MealForger_Logo.png"
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
        icon: GiCow,
        color: "text-red-500 group-hover:text-red-600",
        size: "w-50 h-50",

    },
    {
        name: "Fish",
        icon: GiFishingHook,
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
        icon: GiChickenLeg,
        color: "text-orange-400 group-hover:text-orange-500",
    },
]

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
    const recipesPerPage = 10
    const navigate = useNavigate()

    const [recipeType, setRecipeType] = useState("all")

    useEffect(() => {
        // Reset API limit warning when component mounts
        setApiLimitReached(false)
    }, [])

    useEffect(() => {
        // Check if Spoonacular API error is due to API limit
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
    }, [recipes, MealDBRecipes, CocktailDBDrinks, recipeType, setAllRecipes])

    const {currentRecipes, indexOfFirstRecipe, indexOfLastRecipe} = useMemo(() => {
        const indexOfLastRecipe = currentPage * recipesPerPage;
        const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
        const currentRecipes = allRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe);

        return {currentRecipes, indexOfFirstRecipe, indexOfLastRecipe};
    }, [allRecipes, currentPage, recipesPerPage]);


    useEffect(() => {
        //Only run when currentPage changes or allRecipes changes
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

        if (uncachedRecipes === 0) return;

        if (uncachedRecipes.length >= AI_CONFIG.BATCH_THRESHOLD) {
            try {
                const dishNames = uncachedRecipes.map(r => r.strMeal || r.strDrink || r.title);
                const batchResult = await batchGaladrielResponse(dishNames, "summary");
                const summaries = batchResult.split('/n');

                const summaryMap = {};
                uncachedRecipes.forEach((recipe, index) => {

                    if (index > summaries.length) {
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

            } catch {
                console.error("Batch summary failed:", error);
                await generateSummariesIndividually(recipesToProcess); // Fallback
            }
        } else {
            await generateSummariesIndividually(recipesToProcess);
        }

        const generateSummariesIndividually = async (recipes) => {
            const cachedSummaries = JSON.parse(localStorage.getItem("recipeSummaries")) || {};
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
                            updates[dishName] = "Description unavailable";
                        }
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                setAllRecipes(prevRecipes => {
                    return prevRecipes.map(recipes => {
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

                console.log("Ingredients to validate:", ingredientsArray); // Add this line

                // Track all issues
                const duplicates = [];
                const validationErrors = [];
                const newIngredients = [];

                // First pass: Check for duplicates in input AND existing ingredients
                const existingLower = ingredients.map(i => i.toLowerCase());
                const uniqueInputs = [...new Set(ingredientsArray)]; // Remove duplicates in input itself

                for (const ingredient of uniqueInputs) {
                    const lowerIngredient = ingredient.toLowerCase();

                    console.log(`Attempting to validate ingredient: "${ingredient}"`)

                    // Check against existing ingredients
                    if (existingLower.includes(lowerIngredient)) {
                        duplicates.push(ingredient);
                        continue;
                    }
                    console.log("Input" + inputString)
                    console.log(`Validating ingredient: ${ingredient}`);

                    // Validate only if not a duplicate
                    const result = await getGaladrielResponse(ingredient, "validate");
                    console.log(result)

                    if (result.startsWith('Error:')) {
                        validationErrors.push(ingredient);
                    } else {

                        // Check again for duplicates in the validated result
                        if (!existingLower.includes(result.toLowerCase())) {
                            newIngredients.push(result);
                        } else {
                            duplicates.push(ingredient); // The validated form is a duplicate
                        }
                    }
                }

                // Update state
                if (newIngredients.length > 0) {
                    setIngredients(prev => [...prev, ...newIngredients]);
                }

                // Show errors if any
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
            // If you've exported clearValidationCache from getGaladrielResponse
            clearValidationCache();

            // Optional: Clear the entire localStorage for AI-related items
            Object.keys(localStorage)
                .filter(key => key.includes('ai-'))
                .forEach(key => localStorage.removeItem(key));

            alert('Validation cache has been cleared. Please try adding ingredients again.');
        };

        const handleSearch = async () => {
            if (ingredients.length > 0) {
                setIsSearching(true);
                setApiLimitReached(false); // Reset before making requests

                try {
                    const apiCalls = [
                        apiLimitReached ? Promise.resolve([]) : getRecipes(ingredients, selectedDiet), // Avoid calling Spoonacular
                        getMealDBRecipes(ingredients),
                        getCocktailDBDrinks(ingredients),
                    ];

                    const results = await Promise.allSettled(apiCalls);

                    results.forEach((result, index) => {
                        if (result.status === "rejected") {
                            const errorMsg = String(result.reason);
                            console.log(`Error in API ${index}:`, errorMsg);

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


        const handleQuickSearch = async (ingredient) => {
            setIsSearching(true);
            setApiLimitReached(false);
            setErrorMessage("");

            let searchQuery = ingredient;

            if (categoryIngredients[ingredient]) {
                const chosenFood = Math.random() < 0.5;
                if (chosenFood && categoryIngredients[ingredient].mealDB.length > 0) {
                    const randomIndex = Math.floor(Math.random() * categoryIngredients[ingredient].mealDB.length);
                    searchQuery = categoryIngredients[ingredient].mealDB[randomIndex];
                } else if (categoryIngredients[ingredient].spoonacular.length > 0) {
                    const randomIndex = Math.floor(Math.random() * categoryIngredients[ingredient].spoonacular.length);
                    searchQuery = categoryIngredients[ingredient].spoonacular[randomIndex];
                }
            }

            setIngredients([searchQuery]);

            try {
                let apiCalls;

                if (apiLimitReached) {
                    // When Spoonacular is unavailable, only fetch from TheMealDB
                    apiCalls = [getMealDBRecipes(searchQuery)];
                } else {
                    // When Spoonacular is available, fetch from both
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
                        console.log(`Error in API ${index}:`, errorMsg);

                        if (!apiLimitReached && errorMsg.includes("402") || errorMsg.includes("429") || errorMsg.includes("quota")) {
                            spoonacularError = true;
                        }
                    }
                });

                if (spoonacularError) {
                    setApiLimitReached(true);
                }

                const combinedRecipes = [...mealDBRecipes, ...spoonacularRecipes];

                //console.log("Recipes Found:", combinedRecipes.length, combinedRecipes);

                //Updates the recipe before checking fors error
                setAllRecipes(combinedRecipes);
                setCurrentPage(1);

            } catch (error) {
                console.error("Error during quick search:", error);
                setErrorMessage("An unexpected error occurred.");
            } finally {
                setIsSearching(false);
            }
        };


        const clickHandler = (recipe) => {
            const currentPath = window.location.pathname; // Gets the current path

            if (recipe.isDrink) {
                navigate(`/drink/${recipe.idDrink}`, {
                    state: {
                        drink: recipe,
                        userIngredients: ingredients,
                        allRecipes: allRecipes,
                        previousPath: currentPath // This will be used by the back button
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

        // const indexOfLastRecipe = currentPage * recipesPerPage
        // const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage
        // const currentRecipes = allRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe)


        const paginate = (pageNumber) => setCurrentPage(pageNumber)

        const [showInput, setShowInput] = useState(true)

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
                    {/* Logo Container */}
                    <div className="logo-container flex justify-center items-center">
                        <div className="w-64 h-auto">
                            <img src={MealForgerLogo || "/placeholder.svg"} alt="Meal Forger Logo"
                                 className="max-w-full max-h-full"/>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {/* API Limit Warning Alert */}
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
                        {/* Combined Search Section */}
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-2xl text-center">Find Recipes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Quick Search Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {popularIngredients.map((item) => (
                                        <Button
                                            key={item.name}
                                            variant="outline"
                                            onClick={() => handleQuickSearch(item.name)} // Uses updated function
                                            className="group flex flex-col items-center justify-center p-4 h-32 w-full transition-all duration-200 hover:bg-gray-700/50"
                                            disabled={isSearching}
                                        >
                                            <item.icon
                                                className={`category-icon w-20 h-16 mb-3 transition-colors ${item.color}`}/>
                                            <span
                                                className="text-lg font-medium text-center group-hover:text-white">{item.name}</span>
                                        </Button>
                                    ))}
                                </div>
                                {/* Divider with text */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-700"/>
                                    </div>
                                    <div className="relative flex justify-center text-base uppercase">
                                <span className="px-4 py-2 text-gray-200 font-bold bg-gray-800">
                                    or search by ingredients
                                </span>
                                    </div>
                                </div>

                                {/* Search Input Section */}
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter ingredients(comma-separated): "
                                            value={inputString}
                                            onChange={handleInputChange}
                                            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 flex-grow"
                                        />

                                        <Select value={selectedDiet} onValueChange={setSelectedDiet}>
                                            <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                                                <SelectValue placeholder="Select Diet (Optional)"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={null}>No Specific Diet</SelectItem>
                                                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                                                <SelectItem value="vegan">Vegan</SelectItem>
                                                <SelectItem value="gluten-free">Gluten Free</SelectItem>
                                                <SelectItem value="ketogenic">Ketogenic</SelectItem>
                                                <SelectItem value="paleo">Paleo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={recipeType} onValueChange={setRecipeType}>
                                            <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                                                <SelectValue placeholder="Recipe Type"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Recipes</SelectItem>
                                                <SelectItem value="meals">Meals Only</SelectItem>
                                                <SelectItem value="drinks">Drinks Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            onClick={handleAddIngredient}
                                            className="gradient-button text-white font-bold py-2 px-4 rounded"
                                        >
                                            <PlusCircle className="w-4 h-4 mr-2"/>
                                            Add
                                        </Button>
                                    </div>
                                    {/* Error Message or Ingredients List */}
                                    <div className="flex flex-wrap gap-2">
                                        {ingredients.map((ingredient) => (
                                            <div
                                                key={ingredient}
                                                className="bg-green-900/50 text-green-100 px-3 py-1 rounded-full text-sm flex items-center"
                                            >
                                                <Check className="h-4 w-4 mr-1"/>
                                                {ingredient}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="ml-1 h-4 w-4 p-0 hover:bg-green-800"
                                                    onClick={() => handleRemoveIngredient(ingredient)}
                                                >
                                                    <X className="h-3 w-3"/>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Error display */}
                                    {errorMessage && (
                                        <div className="bg-amber-900/50 border-amber-700 p-3 rounded-md">
                                            <div className="flex items-start gap-2 text-amber-100">
                                                <InfoIcon className="h-5 w-5 flex-shrink-0"/>
                                                <div>{errorMessage}</div>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleSearch}
                                        className="gradient-button text-white font-bold py-2 px-4 rounded w-full"
                                        disabled={ingredients.length === 0 || isSearching}
                                    >
                                        {isSearching ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                                                Searching...
                                            </>
                                        ) : (
                                            "Generate Recipes"
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/*Clears Caches incase of old verification issue*/}
                        {/*<Button onClick={handleClearValidationCache}></Button>*/}

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
    }

    const stripHtml = (html) => {
        if (!html) {
            return ""; // Return an empty string if html is null or undefined
        }
        return html.replace(/<\/?[^>]+(>|$)/g, ""); // Removes all HTML tags
    };

    const RecipeCard = ({recipe, onClick}) => {
        const [summary, setSummary] = useState(recipe.summary || "");

        const fetchSummary = async () => {
            return (
                <Dialog>
                    <DialogTrigger asChild onClick={fetchSummary}>
                        <Card
                            className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors">
                            <CardContent className="p-4">
                                <img
                                    src={recipe.image || recipe.strMealThumb || recipe.strDrinkThumb || "/placeholder.svg"}
                                    alt={recipe.title || recipe.strMeal || recipe.strDrink}
                                    className="w-full h-32 object-cover rounded-md mb-2"
                                />
                                <h4 className="font-medium text-gray-300 text-sm line-clamp-2">
                                    {recipe.title || recipe.strMeal || recipe.strDrink}
                                </h4>
                                {/* Only show the drink icon if it's an alcoholic drink */}
                                {recipe.isDrink && recipe.strAlcoholic === "Alcoholic" && (
                                    <BiDrink className="text-blue-400 ml-2"/>
                                )}
                            </CardContent>
                        </Card>
                    </DialogTrigger>

                    <DialogContent className="bg-gray-800 text-white">
                        <DialogTitle className="font-medium text-gray-300 text-lg">
                            {recipe.title || recipe.strMeal || recipe.strDrink}
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="text-white font-bold">
                                <img
                                    src={recipe.image || recipe.strMealThumb || recipe.strDrinkThumb || "/placeholder.svg"}
                                    alt={recipe.title || recipe.strMeal || recipe.strDrink}
                                    className="w-full h-48 object-cover rounded-md mb-4"
                                />
                                <p className="mb-4">
                                    {stripHtml(summary) || "No summary available."}
                                </p>
                                <Button onClick={onClick} className="w-full font-bold">
                                    View Full Recipe
                                </Button>
                            </div>
                        </DialogDescription>
                    </DialogContent>
                </Dialog>
            );
        };

        const Pagination = ({recipesPerPage, totalRecipes, paginate, currentPage}) => {
            const pageNumbers = [];
            const totalPages = Math.ceil(totalRecipes / recipesPerPage);

            // Generate page numbers (optionally limit to show only a window)
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

    }
}


export default UserInput
