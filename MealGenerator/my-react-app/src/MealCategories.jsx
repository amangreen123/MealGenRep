import axios from "axios";
import { useState, useEffect } from "react";

export const MealCategories = ({ diet }) => {
    const [loading, setLoading] = useState(true);
    const [meals, setMeals] = useState([]);
    const [error, setError] = useState(null);

    // Function to fetch meal details
    const fetchMealDbRecipeDetails = async (meal) => {
        try {
            const response = await axios.get(
                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
            );

            const details = response.data.meals?.[0] || {};

            return {
                id: details.idMeal,
                name: details.strMeal,
                category: details.strCategory,
                area: details.strArea,
                thumbnail: details.strMealThumb,
                tags: details.strTags?.split(",") || [],
                instructions: details.strInstructions,
                youtube: details.strYoutube,
                source: details.strSource,
                ingredients: getIngredients(details),
            };
        } catch (error) {
            console.error("Error fetching MealDB recipe details:", error);
            return {};
        }
    };

    // Function to extract ingredients and measures
    const getIngredients = (details) => {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = details[`strIngredient${i}`];
            const measure = details[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== "") {
                ingredients.push({ ingredient, measure });
            }
        }
        return ingredients;
    };

    // Function to fetch meals by category
    const fetchMealDbRecipes = async (diet) => {
        try {
            const response = await axios.get(
                `https://www.themealdb.com/api/json/v1/1/filter.php?c=${diet || "Miscellaneous"}`
            );

            const meals = response.data.meals || [];
            const mealsWithDetails = await Promise.all(meals.map(fetchMealDbRecipeDetails));
            setMeals(mealsWithDetails);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching MealDB recipes:", error);
            setError(error);
            setLoading(false);
        }
    };

    // Fetch meals when the component mounts or the diet prop changes
    useEffect(() => {
        fetchMealDbRecipes(diet);
    }, [diet]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

};



