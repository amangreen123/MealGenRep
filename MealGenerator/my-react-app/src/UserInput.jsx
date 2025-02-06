import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import useFetchMeals from "./getMeals.jsx"
// import RecipeBuilder from "@/RecipeBuilder.jsx"

import {
    Search,
    Egg,
    CroissantIcon as Bread,
    Carrot,
    Beef,
    Fish,
    ChevronsUpIcon as Cheese,
    Apple,
    Milk,
    PlusCircle,
    Loader2,
    X,
} from "lucide-react"
import {getGaladrielResponse} from "@/getGaladrielResponse.jsx";

const popularIngredients = [
    { name: "Eggs", icon: Egg },
    { name: "Bread", icon: Bread },
    { name: "Vegetables", icon: Carrot },
    { name: "Beef", icon: Beef },
    { name: "Fish", icon: Fish },
    { name: "Cheese", icon: Cheese },
    { name: "Fruit", icon: Apple },
    { name: "Milk", icon: Milk },
]

const UserInput = () => {
    const [inputString, setInputString] = useState("")
    const [ingredients, setIngredients] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const { recipes, error, getRecipes} = useFetchMeals()
    const navigate = useNavigate()

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
            //console.log("AI Response:", result)

            if (result !== "No valid ingredients") {
                const suggestedIngredients = result.split(", ").map((item) => item.trim())

                const uniqueIngredients = suggestedIngredients.filter(
                    (newIngr) => !ingredients.some((existingIngr) => existingIngr.toLowerCase() === newIngr.toLowerCase()),
                )

                //console.log("Unique Ingredients to Add:", uniqueIngredients)
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

    const handleSearch = () => {
        if (ingredients.length > 0) {
            setIsSearching(true)
            getRecipes(ingredients).finally(() => setIsSearching(false))
        }
    }

    const handleQuickSearch = (ingredient) => {
        setIsSearching(true)
        getRecipes([ingredient]).finally(() => setIsSearching(false))
    }

    const clickHandler = (recipe) => {
        navigate(`/${recipe.id}`, { state: { recipe } })
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-center mb-8">MEAL FORGER</h1>

                <Tabs defaultValue="search" className="w-full">
                    <TabsList className="grid w-full grid-cols-1">
                        <TabsTrigger value="search">Search Recipes</TabsTrigger>
                        {/* <TabsTrigger value="build">Build Recipe</TabsTrigger> */}
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
                                            placeholder="Enter Ingredients Separated By Spaces"
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

                                {recipes.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-xl font-semibold mb-4">Found Recipes</h3>
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {recipes.map((recipe) => (
                                                <Card
                                                    key={recipe.id}
                                                    className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
                                                    onClick={() => clickHandler(recipe)}
                                                >
                                                    <CardContent className="p-4">
                                                        <img
                                                            src={recipe.image || "/placeholder.svg"}
                                                            alt={recipe.title}
                                                            className="w-full h-32 object-cover rounded-md mb-2"
                                                        />
                                                        <h4 className="font-semibold text-sm line-clamp-2">{recipe.title}</h4>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    {/* <TabsContent value="build">
            <RecipeBuilder />
          </TabsContent> */}
                </Tabs>
            </div>
        </div>
    )
}

export default UserInput

