import {useNavigate} from "react-router-dom";


const RecipeNavigator = ({allRecipes, currentRecipe}) => {

    const navigate = useNavigate()
    const currentIndex = allRecipes.findIndex(r => r.id === currentRecipe.id);

    console.log("allRecipes in RecipeNavigator:", allRecipes);
    console.log("Current Recipe:", currentRecipe);

    const navigateToRecipe = (newIndex) => {
        const nextRecipe = allRecipes[newIndex];
        navigate(`/recipe/${nextRecipe.id}`, { state: { recipe: nextRecipe, allRecipes } });
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
        <div className="flex justify-between mt-4">
            <button onClick={handlePrevious} disabled={allRecipes.length < 2} className="btn">
                Previous
            </button>
            <button onClick={handleNext} disabled={allRecipes.length < 2} className="btn">
                Next
            </button>
        </div>
    );
}

export default RecipeNavigator;
