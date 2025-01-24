import React, {useState, useRef} from 'react';
import {useNavigate} from "react-router-dom";
import usefetchMeals from "./getMeals.jsx";


const UserInput = () => {

    const [inputString, setInputString] = useState('');
    const [ingredients, setIngredients] = useState([])
    const [recipeId, setRecipeId] = useState('')
    const {recipes, error, loading, getRecipes,getCachedRecipes} = usefetchMeals();
    const inputRef = useRef(null);

    const navigate = useNavigate();

    const handleInputChange = ({target: {value}}) => {
        setInputString(value)
    }

    const handleAddIngredient = () => {

        const newIngredients = inputString
            .split(',')
            .map(item => item.trim())
            .filter(item => item !== '');

        const uniqueIngredients = newIngredients.filter(
                newIngr => !ingredients.some(
                existingIngr => existingIngr.toLowerCase() === newIngr.toLowerCase()
                )
        );

        if(uniqueIngredients.length === 0){
            alert('No new ingredients to add or all ingredients already exist');
            return;
        }

        //const value = inputRef.current.value.trim();
        // if (ingredients.some(ingredient => ingredient.toLowerCase() === value)) {
        //     alert('This ingredient is already in the list');
        //     return;
        // }
        //
        // if (!value) {
        //     alert('Please enter an ingredient');
        //     return;
        // }
        //setIngredients([...ingredients, value]);
        //inputRef.current.value = '';

        setIngredients([...ingredients, ...uniqueIngredients]);
        setInputString('');
    }

    const handleSearch = () => {
        if(ingredients.length  > 0){
            getRecipes(ingredients);
        }
    };

    const clickHandler = (recipe) => {
        navigate(`/${recipe.id}`, { state: { recipe } });
    }

    return(
        <div>
            <h1>Meal Generator</h1>
            <input
                type="text"
                value={inputString}
                onChange={handleInputChange}
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
                    {/* <pre>{JSON.stringify(getCachedRecipes(),null,2)}</pre> */}
            </div>

            {loading && <p>Awaiting Input</p>}
            {error && <p>Error: Unable to fetch recipes. Please try again later.</p>}

            <h3>Recipes</h3>
            <ul>
                {recipes.map((recipe) => (
                    <li key={recipe.id} onClick={() => clickHandler(recipe)}>
                        {recipe.title}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserInput;
