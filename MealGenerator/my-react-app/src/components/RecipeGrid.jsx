import {Clock, Sparkles, Users} from "lucide-react";
import {Card} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import spooncularHelper from "@/API/Spooncular/spooncularHelper.jsx"

export default  function RecipeGrid({ingredients, allRecipes, isSearching, onRecipeClick, loadingText}) {

    return(
        <div
            className="bg-gray-900/50 rounded-3xl border border-gray-700 p-4 md:p-6 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300 h-full flex flex-col">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-title text-center">
                <span className="text-[#ce7c1c]">RE</span>
                <span className="text-white">CIPES</span>
            </h2>
            {isSearching ? (
                <div className="flex flex-col items-center justify-center py-6 md:py-8 flex-grow min-h-[300px]">
                    <Sparkles className="h-10 w-10 md:h-12 md:w-12 mb-3 md:mb-4 text-[#ce7c1c] animate-pulse"/>
                    <p className="text-gray-400 font-terminal text-xs md:text-sm">
                        {loadingText || "Finding recipes..."}
                    </p>
                </div>
            ) : ingredients.length === 0 ? (
                <div className="text-center py-6 md:py-8 flex-grow min-h-[300px]">
                    <p className="text-gray-400 font-terminal text-xs md:text-sm">
                        Add ingredients to discover recipes
                    </p>
                </div>
            ) : allRecipes.length === 0 ? (
                <div className="text-center py-6 md:py-8 flex-grow min-h-[300px]">
                    <p className="text-gray-400 font-terminal text-xs md:text-sm">
                        No recipes found with your ingredients. Try adding more!
                    </p>
                </div>
            ) : (
                <div className="mb-4 flex-grow overflow-hidden">
                    <div
                        className="h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#ce7c1c] scrollbar-track-gray-800">
                        <div className="grid grid-cols-2 gap-3 md:gap-4 pb-2">
                            {allRecipes.map((recipe) => {
                                const title = recipe.title || recipe.strMeal || recipe.strDrink
                                const image = recipe.image || recipe.strMealThumb || recipe.strDrinkThumb
                                const cookTime =  spooncularHelper.getCookingTime(recipe)
                                const servings = spooncularHelper.getServings(recipe)
                                const uniqueFeature =spooncularHelper.getUniqueFeature(recipe)

                                return (
                                    <Card
                                        key={recipe.id || recipe.idMeal || recipe.idDrink}
                                        className="overflow-hidden border border-gray-700 bg-gray-800/50 rounded-xl hover:shadow-md hover:shadow-[#ce7c1c]/20 active:bg-gray-700/70 transition-all duration-300 cursor-pointer transform hover:scale-[1.03]"
                                        onClick={() => onRecipeClick(recipe)}
                                    >
                                        <div className="p-2 md:p-3">
                                            <div className="mb-2">
                                                <img
                                                    src={image || "/placeholder.svg"}
                                                    alt={title}
                                                    className="w-full h-24 md:h-32 object-cover rounded-lg"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <h3 className="text-xs md:text-sm font-bold font-title line-clamp-2">{title}</h3>
                                            <div
                                                className="flex flex-wrap items-center gap-1 mt-1 text-[10px] md:text-xs text-gray-400">
                                                <div className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-0.5 text-[#ce7c1c]"/>
                                                    <span className="font-terminal">{cookTime}</span>
                                                </div>
                                                <span className="mx-0.5 text-[#ce7c1c]">•</span>
                                                <div className="flex items-center">
                                                    <Users className="h-3 w-3 mr-0.5 text-[#ce7c1c]"/>
                                                    <span className="font-terminal">{servings}</span>
                                                </div>
                                                {uniqueFeature && (
                                                    <>
                                                        <span className="mx-0.5 text-[#ce7c1c]">•</span>
                                                        <span
                                                            className="font-terminal bg-[#ce7c1c]/20 px-1.5 py-0.5 rounded-full">
                                          {uniqueFeature}
                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

