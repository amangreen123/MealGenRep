import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import getInstructions from "./GetInstructions.jsx";
import IngredientAmount from "./IngredientAmount";

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

// Component to display recipe details


const RecipeDetails = () => {
    const { state } = useLocation();
    const recipe = state?.recipe;

    const [loading, setLoading] = useState(true);
    const [recipeDetails, setRecipeDetails] = useState(null);
    const [error, setError] = useState(null);

    console.log("Recipe Data:", recipe);
    console.log("recipeDetails Data:", recipeDetails);


    // Return early if recipe is not found
    if (!recipe) {
        return <h1>Recipe not found</h1>;
    }

    // Fetch data on recipe id change
    useEffect(() => {
        const fetchRecipeData = async () => {
            try {
                setLoading(true);
                const data = await getInstructions(recipe.id);
                console.log("Fetched Recipe Data:", );
                setRecipeDetails(data);
            } catch (error) {
                setError(error.message || "An error occurred while fetching recipe details");
            } finally {
                setLoading(false);
            }
        };

        fetchRecipeData();
    }, [recipe]);

    // Return loading, error, or recipe details
    if (loading) return <h1>Loading...</h1>;
    if (error) return <h1>{error}</h1>;


    // Destructure the data into meaningful variables
    const { instructions, macros } = recipeDetails;


    return (
        <div>
            <h1>Recipe Details</h1>
            <img
                src={recipe.image}
                alt={recipe.title}
                style={{width: "100%", maxWidth: "500px"}}
            />
            <h3>What Ingredients You Have</h3>
            <IngredientList ingredients={recipe.usedIngredients}/>

            <h3>Missing Ingredients</h3>
            <IngredientList ingredients={recipe.missedIngredients}/>

            <h3>Amount Needed</h3>
            <ul>
                {recipe.missedIngredients?.map((ingredient) => (
                    <li key={ingredient.id || ingredient.name || `${ingredient.amount} ${ingredient.unit}`}>
                        <IngredientAmount ingredient={ingredient}/>
                    </li>
                ))}
            </ul>


            {/* Instructions Section */}
            {instructions && (
                <>
                    <h3>Instructions</h3>
                    <p>{instructions || "No instructions available."}</p>
                </>
            )}

            {/* Nutrition Data Section */}
            {macros && (
                <>
                    <h3>Nutrition</h3>
                    <p>{macros.calories} Total Calories</p>
                    <p>{macros.carbs} Carbs</p>
                    <p>{macros.fat} Fat</p>
                    <p>{macros.protein} Protein</p>
                </>
            )}
        </div>
    );
};

export default RecipeDetails;
