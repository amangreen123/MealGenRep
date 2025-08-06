import { Card } from "@/components/ui/card"
import { Clock, Users, Sparkles } from 'lucide-react'

export default function PopularRecipesSection({
                                                  allRecipes,
                                                  randomRecipes,
                                                  isSearching,
                                                  loadingText,
                                                  onRecipeClick,
                                                  onRandomRecipeClick
                                              }) {
    const getCookingTime = (recipe) => {
        if (recipe.readyInMinutes) return `${recipe.readyInMinutes} min`
        if (recipe.strCategory?.toLowerCase().includes("dessert")) return "30 min"
        if (recipe.isDrink) return "5 min"
        return "25 min"
    }

    const getServings = (recipe) => {
        if (recipe.servings) return recipe.servings
        if (recipe.strYield) return recipe.strYield
        return recipe.isDrink ? 1 : 4
    }

    const getUniqueFeature = (recipe) => {
        if (recipe.isDrink) {
            return recipe.strAlcoholic === "Non alcoholic" ? "Non-Alcoholic" : "Alcoholic"
        } else if (recipe.strArea) {
            return recipe.strArea
        } else if (recipe.diets && recipe.diets.length > 0) {
            return recipe.diets[0]
        } else if (recipe.veryHealthy) {
            return "Healthy"
        } else if (recipe.cheap) {
            return "Budget-Friendly"
        } else if (recipe.veryPopular) {
            return "Popular"
        }
        return null
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 font-title">
                <span className="text-[#ce7c1c]">POPULAR</span> <span className="text-white">RECIPES</span>
            </h2>

            {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Sparkles className="h-12 w-12 mb-4 text-[#ce7c1c] animate-pulse" />
                    <p className="text-gray-400 font-terminal">{loadingText || "Finding recipes..."}</p>
                </div>
            ) : allRecipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allRecipes.slice(0, 4).map((recipe) => {
                        const title = recipe.title || recipe.strMeal || recipe.strDrink
                        const image = recipe.image || recipe.strMealThumb || recipe.strDrinkThumb
                        const cookTime = getCookingTime(recipe)
                        const servings = getServings(recipe)
                        const uniqueFeature = getUniqueFeature(recipe)

                        return (
                            <Card
                                key={recipe.id || recipe.idMeal || recipe.idDrink}
                                className="bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-[#ce7c1c]/20 transition-all duration-300 transform hover:scale-[1.02]"
                                onClick={() => onRecipeClick(recipe)}
                            >
                                <div className="relative">
                                    <img
                                        src={image || "/placeholder.svg"}
                                        alt={title}
                                        className="w-full h-48 object-cover"
                                        loading="lazy"
                                    />
                                    {uniqueFeature && (
                                        <div className="absolute top-2 right-2">
                      <span className="bg-[#ce7c1c] text-white px-2 py-1 rounded-full text-xs font-terminal">
                        {uniqueFeature}
                      </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-bold font-title mb-2 line-clamp-1">{title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-400 font-terminal mb-3">
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-1 text-[#ce7c1c]" />
                                            <span>{cookTime}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 mr-1 text-[#ce7c1c]" />
                                            <span>{servings} servings</span>
                                        </div>
                                    </div>
                                    {/* Mock nutrition info */}
                                    <div className="grid grid-cols-4 gap-2 text-xs font-terminal">
                                        <div className="text-center">
                                            <div className="text-[#ce7c1c] font-bold">420</div>
                                            <div className="text-gray-400">Cal</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[#ce7c1c] font-bold">35g</div>
                                            <div className="text-gray-400">Protein</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[#ce7c1c] font-bold">28g</div>
                                            <div className="text-gray-400">Carbs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[#ce7c1c] font-bold">18g</div>
                                            <div className="text-gray-400">Fat</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            ) : randomRecipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {randomRecipes.slice(0, 4).map((recipe) => (
                        <Card
                            key={recipe.idMeal}
                            className="bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-[#ce7c1c]/20 transition-all duration-300 transform hover:scale-[1.02]"
                            onClick={() => onRandomRecipeClick(recipe)}
                        >
                            <div className="relative">
                                <img
                                    src={recipe.strMealThumb || "/placeholder.svg"}
                                    alt={recipe.strMeal}
                                    className="w-full h-48 object-cover"
                                    loading="lazy"
                                />
                                {recipe.strCategory && (
                                    <div className="absolute top-2 right-2">
                    <span className="bg-[#ce7c1c] text-white px-2 py-1 rounded-full text-xs font-terminal">
                      {recipe.strCategory}
                    </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-bold font-title mb-2 line-clamp-1">{recipe.strMeal}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-400 font-terminal mb-3">
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1 text-[#ce7c1c]" />
                                        <span>25 min</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Users className="h-4 w-4 mr-1 text-[#ce7c1c]" />
                                        <span>4 servings</span>
                                    </div>
                                </div>
                                {/* Mock nutrition info */}
                                <div className="grid grid-cols-4 gap-2 text-xs font-terminal">
                                    <div className="text-center">
                                        <div className="text-[#ce7c1c] font-bold">380</div>
                                        <div className="text-gray-400">Cal</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[#ce7c1c] font-bold">32g</div>
                                        <div className="text-gray-400">Protein</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[#ce7c1c] font-bold">22g</div>
                                        <div className="text-gray-400">Carbs</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[#ce7c1c] font-bold">15g</div>
                                        <div className="text-gray-400">Fat</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-400 font-terminal">Add ingredients to discover recipes</p>
                </div>
            )}
        </div>
    )
}
