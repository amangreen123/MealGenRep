import {useNavigate} from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"


const RecipeNavigator = ({allRecipes, currentRecipe}) => {

    const navigate = useNavigate()
    // console.log("allRecipes in RecipeNavigator:", allRecipes);
    // console.log("Current Recipe:", currentRecipe);

    const getCurrentIndex = () => {


        if(!currentRecipe || !allRecipes || allRecipes.length === 0) return -1

        if(currentRecipe.id){
            return allRecipes.findIndex((r) => r.id === currentRecipe.id)
        }

        if(typeof currentRecipe === "string"){
            return allRecipes.findIndex((r) => r.strDrink === currentRecipe)
        }

        if (currentRecipe.idMeal){
            return allRecipes.findIndex((r) => r.idMeal === currentRecipe.idMeal)
        }

        if(currentRecipe.idDrink) {
            return allRecipes.findIndex((r) => r.idDrink === currentRecipe.idDrink)
        }

        return -1
    }

    const currentIndex = getCurrentIndex()

    if(currentIndex === -1 || allRecipes.length < 2){
        return null
    }

    const navigateToRecipe = (newIndex) => {
        const nextRecipe = allRecipes[newIndex];
        //Handles each recipe type

        if (nextRecipe.id) {
            navigate(`/recipe/${nextRecipe.id}`, { state: { recipe: nextRecipe, allRecipes } })
        } else if (nextRecipe.idDrink) {
            navigate(`/drink/${nextRecipe.idDrink}`, { state: { drink: nextRecipe, allRecipes } })
        } else if (nextRecipe.idMeal) {
            navigate(`/mealdb-recipe/${nextRecipe.idMeal}`, { state: { recipe: nextRecipe, allRecipes } })
        }
    }

    const handleNext = () => {
        const newIndex = (currentIndex + 1) % allRecipes.length;
        navigateToRecipe(newIndex);
    };

    const handlePrevious = () => {
        const newIndex = (currentIndex - 1 + allRecipes.length) % allRecipes.length;
        navigateToRecipe(newIndex);
    };

    return (
        <Card className="bg-gray-800/50 border-gray-700 p-4 mb-6">
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                    Recipe {currentIndex + 1} of {allRecipes.length}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        className="bg-gray-700/30 hover:bg-gray-700/50 border-gray-600"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleNext}
                        className="bg-gray-700/30 hover:bg-gray-700/50 border-gray-600"
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}

export default RecipeNavigator;
