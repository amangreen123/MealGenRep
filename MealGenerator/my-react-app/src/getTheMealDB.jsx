import {useState, useRef} from "react";
import axios from "axios";

//Filter by Ingredients
//www.themealdb.com/api/json/v1/1/filter.php?i=

//Filter by Category
//https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegan

//Give the details of the recipe
//www.themealdb.com/api/json/v1/1/lookup.php?i=52772

export const useTheMealDB = () => {
    const [MealDBRecipes, setMealDBRecipes] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const cache = useRef({}); // Store the data in cache


    const getMealDBRecipes = async (ingredients) => {

        const key = ingredients.join(',').toLowerCase();
        console.log("MDB Input", ingredients);
        console.log('Meal DB input ', key);

        if(cache.current[key]){
            setMealDBRecipes(cache.current[key]);
            setLoading(false);
            console.log("Using Cached MealDB Recipes for Key:", key, cache.current[key]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `https://www.themealdb.com/api/json/v1/1/filter.php?i=${key}`,
                {
                    params: {
                       key: ingredients.join(','), // Add ingredients filter if provided
                    }
                }
            );

            const results = response.data.meals;
            cache.current[key] = results;
            setMealDBRecipes(results);

            console.log('Meal DB Data', results);
            console.log("API URL:", `https://www.themealdb.com/api/json/v1/1/filter.php?i=${key}`);

        } catch (error) {
            console.log("Error", error.message);
            setError(error.message || "An error occurred while fetching Meal recipes.");

        } finally {
            setLoading(false);
        }

    }
    const getCachedDBRecipes = () => cache.current;

    return {MealDBRecipes, error, loading, getMealDBRecipes, getCachedDBRecipes };
}

export default useTheMealDB;