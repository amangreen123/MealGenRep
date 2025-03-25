"use client"

import { useState, useEffect } from "react"
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

import {PlusCircle, Loader2, X, ChevronLeft, ChevronRight, InfoIcon} from "lucide-react"

import { getGaladrielResponse,batchGaladrielResponse } from "@/getGaladrielResponse.jsx"

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
    const { recipes, error, getRecipes } = useFetchMeals()

    const [apiLimitReached, setApiLimitReached] = useState(false)


    const { getMealDBRecipes, MealDBRecipes, loading } = useTheMealDB()
    const {CocktailDBDrinks, getCocktailDBDrinks} = useTheCocktailDB()

    const [allRecipes, setAllRecipes] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const recipesPerPage = 6
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


    useEffect(() => {
        const debouncedGenerateSummaries = debounce(() => {
            const visibleRecipes = allRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe);
            generateSummaries(visibleRecipes);
        }, 300); // 300ms debounce delay

        debouncedGenerateSummaries();

        return () => debouncedGenerateSummaries.cancel(); // Cleanup
    }, [currentPage, allRecipes]);

    
    const generateSummaries = async (recipes) => {
        const cachedSummaries = JSON.parse(localStorage.getItem("recipeSummaries")) || {};
        const uncachedRecipes = recipes.filter(recipe => !recipe.summary);
        
        if(uncachedRecipes.length >= AI_CONFIG.BATCH_THRESHOLD) {
            try{
                const dishNames = uncachedRecipes.map(r => r.strMeal || r.strDrink);
                const batchResult = await batchGaladrielResponse(dishNames, "summary");
                const summaries = batchResult.split('/n');
                
                //Updates Recipes with Summary
                const updatedRecipes = recipes.map(recipe => {
                    const dishName = recipe.strMeal || recipe.strDrink;
                    
                    if(!recipe.summary) {
                        const summaryIndex = uncachedRecipes.findIndex(r =>(r.strMeal || r.strDrink) === dishName);
                        
                        if (summaryIndex >= 0) {
                            cachedSummaries[dishName] = summaries[summaryIndex];
                            return {...recipe, summary: summaries[summaryIndex]}
                        }
                    }
                    return recipe;
                });

                localStorage.setItem("recipeSummaries", JSON.stringify(cachedSummaries));
                setAllRecipes(updatedRecipes)
            } catch (error) {
                console.error("Batch summary failed:", error);
                await generateSummariesIndividually(recipes); // Fallbaclk
            }
        }
        else {
            await generateSummariesIndividually(recipes);
        }
    };
    
    const generateSummariesIndividually = async (recipes) => {
        const updatedRecipes = [...recipes];
        const cachedSummaries = JSON.parse(localStorage.getItem("recipeSummaries")) || {};
        
        for(let i = 0; i < updatedRecipes.length; i++){
            if(!updatedRecipes[i].summary){
                const dishName = updatedRecipes[i].strMeal || updatedRecipes[i].strDrink;
                
                if(!cachedSummaries[dishName]) {
                    try {
                        const summary = await getGaladrielResponse(
                            `Describe ${dishName} in 2 sentences`,
                            "summary"
                        );
                        cachedSummaries[dishName] = summary;
                        updatedRecipes[i] = {...updatedRecipes[i], summary}

                    } catch (error) {
                        updatedRecipes[i] = {...updatedRecipes[i], summary: "Description unavailable"};
                    }
                }else {
                    updatedRecipes[i] = { ...updatedRecipes[i], summary: cachedSummaries[dishName] };
                }
            }
        }
        localStorage.setItem("recipeSummaries", JSON.stringify(cachedSummaries));
        setAllRecipes(updatedRecipes);
    }

    const handleInputChange = ({ target: { value } }) => {
        setInputString(value)
    }

    const handleAddIngredient = async () => {
        if (inputString.trim() === ',') {
            setErrorMessage("Please enter valid ingredients.");
            return;
        }
        
        ///If htere are mutiple ingreidnts
        if(ingredientsArray.length >= AI_CONFIG.BATCH_THRESHOLD){
            try {
                const batchResult = await batchGaladrielResponse(ingredientsArray, "validate")
                const validated = batchResult.split('/n').filter(i => !i.startsWith('Error:'));
                setIngredients(prev => [...new Set([...prev, ...validated])]);
                return;
            
            } catch {
                console.log("Batch failed, falling back to single requests");
            }
        }
        ///if there are single ingredients
        for (const ingredient of ingredientsArray){
            const result = await getGaladrielResponse(ingredient, "validate");
            if(!result.startsWith('Error')){
                setIngredients(prev => [...prev, result])
            }
        }
    };

    const handleRemoveIngredient = (ingredientToRemove) => {
        setIngredients(ingredients.filter((ingredient) => ingredient !== ingredientToRemove))
    }

    const handleSearch = async () => {
        if (ingredients.length > 0) {
            setIsSearching(true);
            setApiLimitReached(false); // Reset before making requests

            try {
                const results = await Promise.allSettled([
                    getRecipes(ingredients, selectedDiet),
                    getMealDBRecipes(ingredients),
                    getCocktailDBDrinks(ingredients)
                ]);

                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        const errorMsg = String(result.reason);
                        console.log(`Error in API ${index}:`, errorMsg);

                        if (errorMsg.includes("402") || errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("API limit")) {
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
            const results = await Promise.allSettled([
                getRecipes(searchQuery, selectedDiet), // Spoonacular
                getMealDBRecipes(searchQuery), // TheMealDB
                getCocktailDBDrinks(searchQuery) // TheCocktailDB
            ]);

            let mealDBRecipes = [];
            let spoonacularRecipes = [];
            let cocktailDBRecipes = [];
            let spoonacularError = false;

            results.forEach((result, index) => {
                if (result.status === "fulfilled" && Array.isArray(result.value)) {
                    if (index === 0) {
                        spoonacularRecipes = result.value;
                    } else if (index === 1) {
                        mealDBRecipes = result.value;
                    } else {
                        cocktailDBRecipes = result.value;
                    }
                } else if (result.status === "rejected" && index === 0) {
                    // Spoonacular API failed due to an API limit
                    spoonacularError = String(result.reason).includes("402") || String(result.reason).includes("429");
                }
            });

            if (spoonacularError) {
                setApiLimitReached(true);
            }

            const combinedRecipes = [...mealDBRecipes, ...spoonacularRecipes, ...cocktailDBRecipes];

            console.log("Recipes Found:", combinedRecipes.length, combinedRecipes);

            //Update recipes BEFORE checking for errors
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


    const indexOfLastRecipe = currentPage * recipesPerPage
    const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage
    const currentRecipes = allRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe)

    const paginate = (pageNumber) => setCurrentPage(pageNumber)

    const [showInput, setShowInput] = useState(true)

    useEffect(() => {
        if(errorMessage){
            setShowInput(false)
            const timer = setTimeout(() => {
                setShowInput(true)
                setErrorMessage("")
            }, 1000);
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
                            <InfoIcon className="h-4 w-4 text-amber-400" />
                            <AlertTitle>Spoonacular API Limit Reached</AlertTitle>
                            <AlertDescription>
                                Daily API limit for Spoonacular has been reached. You can still view recipes from TheMealDB and TheCocktailDB.
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
                                        placeholder="Enter Ingredients"
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
                                    {errorMessage ? (
                                        <p className="text-red-500">{errorMessage}</p>
                                    ) : (
                                        ingredients.map((ingredient, index) => (
                                            <div key={index}
                                                 className="bg-gray-600 px-3 py-1 rounded-full text-sm flex items-center">
                                                {ingredient}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="ml-2 h-4 w-4 p-0"
                                                    onClick={() => handleRemoveIngredient(ingredient)}
                                                >
                                                    <X className="h-3 w-3"/>
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>

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

                    {/* Results Section */}
                    {error && !apiLimitReached && allRecipes.length === 0 && (
                        <p className="text-red-500 text-center">
                            Error: Unable to fetch recipes. Please try again later.
                        </p>
                    )}

                    {allRecipes.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-center">Found Recipes ({allRecipes.length})</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {currentRecipes.map((recipe) => (
                                    <RecipeCard key={recipe.id || recipe.idMeal} recipe={recipe}
                                                onClick={() => clickHandler(recipe)}/>
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

const RecipeCard = ({ recipe, onClick }) => {
    const [summary, setSummary] = useState(recipe.summary || "");

    const fetchSummary = async () => {
        if (!summary) {
            // Check localStorage for cached summary
            const cachedSummaries = JSON.parse(localStorage.getItem("recipeSummaries")) || {};
            const dishName = recipe.strMeal || recipe.strDrink;

            if (cachedSummaries[dishName]) {
                setSummary(cachedSummaries[dishName]);
                
            } else {
                try {
                    const response = await getGaladrielResponse(
                        `Generate a short summary for the dish: ${dishName}`,
                        "summary"
                    );
                    setSummary(response);

                    // Cache the summary in localStorage
                    cachedSummaries[dishName] = response;
                    localStorage.setItem("recipeSummaries", JSON.stringify(cachedSummaries));
                } catch (error) {
                    console.error("Error generating summary:", error);
                    setSummary("No summary available.");
                }
            }
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild onClick={fetchSummary}>
                <Card className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors">
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
                            <BiDrink className="text-blue-400 ml-2" />
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



const Pagination = ({ recipesPerPage, totalRecipes, paginate, currentPage }) => {
    const pageNumbers = []

    for (let i = 1; i <= Math.ceil(totalRecipes / recipesPerPage); i++) {
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
                        disabled={currentPage === Math.ceil(totalRecipes / recipesPerPage)}
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

export default UserInput
