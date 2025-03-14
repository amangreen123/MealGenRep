"use client"


import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import useFetchMeals from "./getMeals.jsx"
import useTheMealDB from "./getTheMealDB.jsx"
import useTheCocktailDB from "./GetCocktailDB.jsx";

import {PlusCircle, Loader2, X, ChevronLeft,ChevronRight } from "lucide-react"

import { getGaladrielResponse } from "@/getGaladrielResponse.jsx"

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
    const { getMealDBRecipes, MealDBRecipes, loading } = useTheMealDB()
    const [allRecipes, setAllRecipes] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const recipesPerPage = 6
    const navigate = useNavigate()



    useEffect(() => {
        const mealDBRecipesArray = Array.isArray(MealDBRecipes) ? MealDBRecipes : []
        setAllRecipes([...recipes, ...mealDBRecipesArray])
    }, [recipes, MealDBRecipes])

    const handleInputChange = ({ target: { value } }) => {
        setInputString(value)
    }

    const handleAddIngredient = async () => {
        if (inputString.trim() === "") {
            setErrorMessage("Please enter valid ingredients.");
            return;
        }

        setIsSearching(true);

        // Create a temporary array to keep track of all ingredients being added in this batch
        let tempIngredients = [...ingredients];
        let hasAddedAny = false;
        let errorMessages = [];

        try {
            // Split the input string into individual ingredients
            const ingredientsArray = inputString.split(' ').map(item => item.trim()).filter(item => item);

            // Process each ingredient
            for (const ingredient of ingredientsArray) {
                // Check for duplicates against BOTH existing ingredients AND ones we're adding in this batch
                if (tempIngredients.some(existingIngr => existingIngr.toLowerCase() === ingredient.toLowerCase())) {
                    errorMessages.push(`"${ingredient}" has already been added`);
                    continue; // Skip to the next ingredient
                }

                const result = await getGaladrielResponse(ingredient);

                if (result !== "No valid ingredients") {
                    const suggestedIngredients = result.split(',').map((item) => item.trim());
                    const newSuggested = suggestedIngredients.filter(newIngr => !newIngr.startsWith('Error:'));

                    if (newSuggested.length <= 0) {
                        errorMessages.push(`"${ingredient}" is not a valid ingredient`);
                        continue;
                    }

                    // Filter out duplicates against our temporary array
                    const validIngredients = suggestedIngredients.filter(
                        (newIngr) => !tempIngredients.some((existingIngr) =>
                            existingIngr.toLowerCase() === newIngr.toLowerCase()) && !newIngr.startsWith('Error:')
                    );

                    if (validIngredients.length > 0) {
                        // Update our temporary array
                        tempIngredients = [...tempIngredients, ...validIngredients];
                        hasAddedAny = true;
                    } else {
                        errorMessages.push(`"${ingredient}" has already been added`);
                    }
                } else {
                    errorMessages.push(`"${ingredient}" is not a valid ingredient`);
                }
            }

            // Only update the state once at the end
            if (hasAddedAny) {
                setIngredients(tempIngredients);
            }

            // Set a single, combined error message if there are any errors
            if (errorMessages.length > 0) {
                setErrorMessage(errorMessages.join('. '));
            } else if (hasAddedAny) {
                setErrorMessage(""); // Clear error message only if we added something successfully
            }
        } catch (error) {
            console.error("Error during Verification:", error);
            setErrorMessage("Error during ingredient verification. Please try again.");
        } finally {
            setIsSearching(false);
            setInputString("");
        }
    }



    const handleRemoveIngredient = (ingredientToRemove) => {
        setIngredients(ingredients.filter((ingredient) => ingredient !== ingredientToRemove))
    }

    const handleSearch = async () => {
        if (ingredients.length > 0) {
            setIsSearching(true)
            try {
                await Promise.all([getRecipes(ingredients, selectedDiet), getMealDBRecipes(ingredients)])
                setCurrentPage(1)
            } catch (error) {
                console.error("Error during search:", error)
            } finally {
                setIsSearching(false)
            }
        }
    }

    const handleQuickSearch = async (ingredient) => {
        setIsSearching(true);
        // Clear any previous ingredients and errors
        setIngredients([ingredient]);
        setErrorMessage("");

        try {
            // Fetch recipes from both sources
            await Promise.all([
                getRecipes([ingredient], selectedDiet),
                getMealDBRecipes([ingredient])
            ]);

            // Reset to first page when new search is performed
            setCurrentPage(1);
        } catch (error) {
            console.error("Error during quick search:", error);
            setErrorMessage(`Failed to search for ${ingredient} recipes`);
        } finally {
            setIsSearching(false);
        }
    }

    const clickHandler = (recipe) => {
        if (recipe.idMeal) {
            navigate(`/mealdb-recipe/${recipe.idMeal}`, { state: { meal: recipe, userIngredients: ingredients } })
        } else {
            navigate(`/recipe/${recipe.id}`, { state: { recipe, userIngredients: ingredients } })
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
                                        onClick={() => handleQuickSearch(item.name)}
                                        className="group flex flex-col items-center justify-center p-4 h-32 w-full transition-all duration-200 hover:bg-gray-700/50"
                                        disabled={isSearching}
                                    >
                                        {/* Icon */}
                                        <item.icon
                                            className={`category-icon w-20 h-16 mb-3 transition-colors ${item.color}`}/>
                                        <span
                                            className="text-lg font-medium text-center group-hover:text-white">{item.name}
                                        </span>

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
                    {error && <p className="text-red-500 text-center">Error: Unable to fetch recipes. Please try again
                        later.</p>}
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

const RecipeCard = ({ recipe, onClick }) => (
    <Dialog>
        <DialogTrigger asChild>
            <Card className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors">
                <CardContent className="p-4">
                    <img
                        src={recipe.image || recipe.strMealThumb || "/placeholder.svg"}
                        alt={recipe.title || recipe.strMeal}
                        className="w-full h-32 object-cover rounded-md mb-2"
                    />
                    <h4 className="font-medium text-gray-300 text-sm line-clamp-2">
                        {recipe.title || recipe.strMeal}
                    </h4>
                </CardContent>
            </Card>
        </DialogTrigger>

        <DialogContent className="bg-gray-800 text-white">
        <DialogTitle className="font-medium text-gray-300 text-lg">
                {recipe.title || recipe.strMeal}
            </DialogTitle>
            <DialogDescription asChild>
                <div className="text-white font-bold">
                    <img
                        src={recipe.image || recipe.strMealThumb || "/placeholder.svg"}
                        alt={recipe.title || recipe.strMeal}
                        className="w-full h-48 object-cover rounded-md mb-4"
                    />
                    <p className="mb-4">
                        {stripHtml(recipe.summary) || "No summary available."}
                    </p>
                    <Button onClick={onClick} className="w-full font-bold">
                        View Full Recipe
                    </Button>
                </div>
            </DialogDescription>
        </DialogContent>
    </Dialog>
);



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
