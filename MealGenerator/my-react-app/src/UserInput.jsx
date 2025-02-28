"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import useFetchMeals from "./getMeals.jsx"
import useTheMealDB from "./getTheMealDB.jsx"

import {
    Search,
    Egg,
    CroissantIcon as Bread,
    Carrot,
    Beef,
    Fish,
    Apple,
    Bird,
    PlusCircle,
    Loader2,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"

import { FaCheese } from "react-icons/fa"
import { getGaladrielResponse } from "@/getGaladrielResponse.jsx"

const popularIngredients = [
    { name: "Eggs", icon: Egg },
    { name: "Bread", icon: Bread },
    { name: "Vegetables", icon: Carrot },
    { name: "Beef", icon: Beef },
    { name: "Fish", icon: Fish },
    { name: "Cheese", icon: FaCheese },
    { name: "Fruit", icon: Apple },
    { name: "Chicken", icon: Bird },
]

const UserInput = () => {

    const [inputString, setInputString] = useState("")
    const [ingredients, setIngredients] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedDiet, setSelectedDiet] = useState(null)
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
            alert("Please enter valid ingredients.")
            return
        }

        setIsSearching(true)

        try {
            const result = await getGaladrielResponse(inputString)

            if (result !== "No valid ingredients") {

                const suggestedIngredients = result.split(',').map((item) => item.trim())
                const uniqueIngredients = suggestedIngredients.filter(
                    (newIngr) => !ingredients.some((existingIngr) => existingIngr.toLowerCase() === newIngr.toLowerCase()),
                )
                setIngredients((prevIngredients) => [...prevIngredients, ...uniqueIngredients])
                setInputString("")
            } else {
                alert("No valid ingredients were found. Please try again.")
            }
        } catch (error) {
            console.error("Error during Verification:", error)
            alert("Error during ingredient verification. Please try again later.")
        } finally {
            setIsSearching(false)
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

    const handleQuickSearch = (ingredient) => {
        setIsSearching(true)
        getRecipes([ingredient], selectedDiet).finally(() => setIsSearching(false))
        getMealDBRecipes([ingredient])
        setCurrentPage(1)
    }

    const clickHandler = (recipe) => {
        if (recipe.idMeal) {
            navigate(`/mealdb-recipe/${recipe.idMeal}`, { state: { meal: recipe } })
        } else {
            navigate(`/recipe/${recipe.id}`, { state: { recipe } })
        }
    }

    const indexOfLastRecipe = currentPage * recipesPerPage
    const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage
    const currentRecipes = allRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe)

    const paginate = (pageNumber) => setCurrentPage(pageNumber)

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-center mb-8">MEAL FORGER</h1>

                <Tabs defaultValue="search" className="w-full">
                    <TabsList className="grid w-full grid-cols-1">
                        <TabsTrigger value="search">Search Recipes</TabsTrigger>
                    </TabsList>
                    <TabsContent value="search">
                        <div className="mt-6">
                            <h3 className="text-2xl font-semibold mb-4 text-center">Quick Search</h3>
                            <Card className="bg-gray-800/50 border-gray-700">
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {popularIngredients.map((item) => (
                                            <Button
                                                key={item.name}
                                                variant="outline"
                                                onClick={() => handleQuickSearch(item.name)}
                                                className="flex flex-col items-center justify-center p-2 h-24 w-full"
                                                disabled={isSearching}
                                            >
                                                <item.icon className="w-8 h-8 mb-2" />
                                                <span className="text-sm text-center">{item.name}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-gray-800/50 border-gray-700 mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="w-6 h-6" />
                                    Advanced Recipe Search
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter Ingredients"
                                            value={inputString}
                                            onChange={handleInputChange}
                                            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 flex-grow"
                                        />
                                        <Button
                                            onClick={handleAddIngredient}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            <PlusCircle className="w-4 h-4 mr-2" />
                                            Add
                                        </Button>
                                    </div>
                                    <Card className="bg-gray-700/50 border-gray-600">
                                        <CardHeader>
                                            <CardTitle>Current Ingredients</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-20">
                                                <div className="flex flex-wrap gap-2">
                                                    {ingredients.map((ingredient, index) => (
                                                        <div key={index} className="bg-gray-600 px-3 py-1 rounded-full text-sm flex items-center">
                                                            {ingredient}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="ml-2 h-4 w-4 p-0"
                                                                onClick={() => handleRemoveIngredient(ingredient)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>

                                    <Select value={selectedDiet} onValueChange={setSelectedDiet}>
                                        <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white mb-4">
                                            <SelectValue placeholder="Select Diet (Optional)" />
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
                                        onClick={handleSearch}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
                                        disabled={ingredients.length === 0 || isSearching}
                                    >
                                        {isSearching ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Searching...
                                            </>
                                        ) : (
                                            "Generate Recipes"
                                        )}
                                    </Button>
                                </div>
                                {error && <p className="text-red-500 mt-6">Error: Unable to fetch recipes. Please try again later.</p>}
                                {allRecipes.length > 0 ? (
                                    <div className="mt-6">
                                        <h3 className="text-xl font-semibold mb-4">Recipes ({allRecipes.length})</h3>
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {currentRecipes.map((recipe) => (
                                                <RecipeCard
                                                    key={recipe.id || recipe.idMeal}
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
                                ) : (
                                    <p className="text-center mt-6"> </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
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
