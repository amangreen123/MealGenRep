import {useEffect, useState} from "react";
import {slugify} from "@/utils/slugify.js"
import {Card} from "@/components/ui/card.tsx";
import {ChefHat} from "lucide-react";


export default function RandomSelectionRecipes({ onRecipeClick, setRandomRecipes }) {
    const [loadingRandomRecipes, setLoadingRandomRecipes] = useState(true)
    const [localRecipes, setLocalRecipes] = useState([])

    // Fetch random recipes on initial load
    useEffect(() => {
        const fetchRandomRecipes = async () => {
            try {
                setLoadingRandomRecipes(true)
                const apiKey = import.meta.env.VITE_MEALDB_KEY || "1" // Use environment variable or default to free API
                const response = await fetch(`https://www.themealdb.com/api/json/v2/${apiKey}/randomselection.php`)
                const data = await response.json()

                if (data && data.meals) {
                    // Add slugs to the random recipes
                    const recipesWithSlugs = data.meals.map((recipe) => ({
                        ...recipe,
                        slug: slugify(recipe.strMeal),
                        idMeal: recipe.idMeal,
                    }))
                    setRandomRecipes(recipesWithSlugs)
                    setLocalRecipes(recipesWithSlugs)
                }
            } catch (error) {
                console.error("Error fetching random recipes:", error)
            } finally {
                setLoadingRandomRecipes(false)
            }
        }
        fetchRandomRecipes()
    }, [])

    return (
        <div className="mt-6 md:mt-8">
            <div className="bg-gray-900/50 rounded-3xl border border-gray-700 p-4 md:p-6 shadow-lg">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 font-title text-center">
                    <span className="text-[#ce7c1c]">POPULAR</span> <span className="text-white">RECIPES</span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {localRecipes.slice(0, 8).map((recipe) => (
                        <Card
                            key={recipe.idMeal}
                            onClick={() => onRecipeClick(recipe)}
                            className="cursor-pointer hover:scale-[1.03] transition-all duration-300 bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:shadow-md hover:shadow-[#ce7c1c]/20"
                        >
                            <div className="p-2 md:p-3">
                                <div className="mb-2">
                                    <img
                                        src={recipe.strMealThumb || "/placeholder.svg"}
                                        alt={recipe.strMeal}
                                        className="w-full h-24 md:h-32 object-cover rounded-lg"
                                        loading="lazy"
                                    />
                                </div>
                                <h3 className="text-xs md:text-sm font-bold font-title line-clamp-2 mb-1">{recipe.strMeal}</h3>
                                {recipe.strCategory && (
                                    <div className="flex items-center mt-1 text-[10px] md:text-xs text-gray-400">
                                        <ChefHat className="h-3 w-3 mr-1 text-[#ce7c1c]" />
                                        <span className="font-terminal">{recipe.strCategory}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}