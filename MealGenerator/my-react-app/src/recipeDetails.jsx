import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import getInstructions from "./getInstructions.jsx";
import IngredientAmount from "./IngredientAmount.jsx";

// Component to list ingredients
const IngredientList = ({ ingredients }) => (
    <ul>
        {ingredients?.length > 0 ? (
            ingredients.map((ingredient) => (
                <li key={ingredient.id}>{ingredient.name}</li>
            ))
        ) : (
            <p>No ingredients found for this recipe.</p>
        )}
    </ul>
);

const RecipeDetails = () => {
    const { state } = useLocation();
    const recipe = state?.recipe;

    const [loading, setLoading] = useState(true);
    const [instructions, setInstructions] = useState(null);
    const [error, setError] = useState(null);

    // Return early if recipe is not found
    if (!recipe) {
        return <h1>Recipe not found</h1>;
    }

    // Fetch data on recipe id change
    useEffect(() => {
        const fetchMacrosAndSteps = async () => {
            try {
                setLoading(true);
                const data = await getInstructions(recipe.id);
                console.log("API Response:", data);
                setInstructions(data);
            } catch (error) {
                setError(error.message || "An error occurred while fetching recipe details");
            } finally {
                setLoading(false);
            }
        };

        fetchMacrosAndSteps();
    }, [recipe]);

    // Return loading, error, or recipe details
    if (loading) return <h1>Loading...</h1>;
    if (error) return <h1>{error}</h1>;

    // Check if macrosAndSteps and nutrition data exist
    const nutrition = instructions?.nutrition;

    return (
        <div>
            <h1>Recipe Details</h1>
            <img
                src={recipe.image}
                alt={recipe.title}
                style={{width: "100%", maxWidth: "500px"}}
            />

            <h3>Used Ingredients</h3>
            <IngredientList ingredients={recipe.usedIngredients}/>

            <h3>Missed Ingredients</h3>
            <IngredientList ingredients={recipe.missedIngredients}/>

            <h3>Amount Needed</h3>
            <ul>
                {instructions.extendedIngredients?.map((ingredient) => (
                    <li key={ingredient.id || ingredient.name || `${ingredient.amount}${ingredient.unit}`}>
                        <IngredientAmount ingredient={ingredient}/>
                    </li>
                ))}
            </ul>

            <h3>Unused Ingredients</h3>
            <IngredientList ingredients={instructions.unusedIngredients}/>

            {instructions && (
                <>
                    <h3>Instructions</h3>
                    <p>{instructions.instructions || "No instructions available."}</p>
                </>
            )}
        </div>
    );
};

export default RecipeDetails;
