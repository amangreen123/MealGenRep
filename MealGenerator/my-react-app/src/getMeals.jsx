import {useState,useEffect,useRef} from "react";
import axios from "axios";

export const useFetchMeals = () => {

    const [recipes, setRecipes] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const cache = useRef({}); //store the data in cache
    const apiKey = import.meta.env.VITE_API_KEY;

   const getRecipes = async (ingredients) => {

       const key = ingredients.join(',').toLowerCase();

        if (cache.current[key]) {
            setRecipes(cache.current[key]);
            setLoading(false);
            console.log('Data from cache', cache.current[key]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                'https://api.spoonacular.com/recipes/findByIngredients',
                {
                params: {
                    ingredients: key,
                    apiKey,
                },
            });

            const results = response.data;
            cache.current[key] = results;
            setRecipes(results);
            console.log('Food Data', results);

        } catch (error) {
            setError(error.message || "An error occurred while fetching recipes.");
        } finally {
            setLoading(false);
        }
   };
    //console.log("What is this" + typeof getRecipes);

    return { recipes, error, loading, getRecipes };
};

export default useFetchMeals;