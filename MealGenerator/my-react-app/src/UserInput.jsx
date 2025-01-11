import React, {useState, useRef} from 'react';
import usefetchMeals from "./getMeals.jsx";


const UserInput = () => {

    //const [input, setInput] = useState('')
    const [ingredients, setIngredients] = useState([])
    const {recipes, error, loading, getRecipes} = usefetchMeals();
    const inputRef = useRef(null);

    const handleAddIngredient = () => {
        const value = inputRef.current.value;
        if(value){
            setIngredients(prevState => [...prevState, value]);
            inputRef.current.value = '';
        }
    }

    const handleSearch = () => {
        if(ingredients.length  > 0){
            getRecipes(ingredients);
        }
    };

    return(
        <div>
            <h1>Meal Generator</h1>
            <input
                type="text"
                ref={inputRef}
                placeholder="Enter ingredients"
            />
            <button onClick={handleAddIngredient}>Add Ingredient</button>
            <button onClick={handleSearch}>Search Recipes</button>

            <div>
                <h3>Current Ingredients</h3>
                <ul>
                    {ingredients.map((ingredient, index) => (
                        <li key={index}>{ingredient}</li>
                    ))}
                </ul>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}

            <h3>Recipes</h3>
            <ul>
                {recipes.map((recipe) => (
                    <li key={recipe.id}>{recipe.title}</li>
                ))}
            </ul>
        </div>
    );
};

export default UserInput;

