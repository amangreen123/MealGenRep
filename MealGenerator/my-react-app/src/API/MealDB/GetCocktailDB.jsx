"use client";

import { useState, useRef } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_DEPLOYED_BACKEND_URL || 'http://localhost:5261';

export const useTheCocktailDB = () => {
    const [CocktailDBDrinks, setCocktailDBDrinks] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const cache = useRef({});

    const getCocktailDBDrinks = async (ingredients) => {
        const ingredientString = Array.isArray(ingredients)
            ? ingredients.join(',')
            : ingredients;

        const key = ingredientString.toLowerCase().trim();

        if (cache.current[key]) {
            setCocktailDBDrinks(cache.current[key]);
            setLoading(false);
            return cache.current[key];
        }

        setLoading(true);
        setError(null);

        try {
            const url = `${BASE_URL}/general-cocktails-search?ingredients=${encodeURIComponent(ingredientString)}`;
            console.log("Fetching cocktails from:", url);

            const response = await axios.get(url);

            if (!response.data || !response.data.drinks) {
                setError(`No drinks found for ${key}`);
                setCocktailDBDrinks([]);
                cache.current[key] = [];
                return [];
            }

            const drinks = response.data.drinks;

            cache.current[key] = drinks;
            setCocktailDBDrinks(drinks);

            console.log("Cocktails found:", drinks.length);
            return drinks;

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Failed to fetch drinks";
            console.error("Cocktail API Error:", errorMessage);
            setError(errorMessage);
            cache.current[key] = [];
            setCocktailDBDrinks([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getCachedDBDrinks = () => cache.current;

    return { getCocktailDBDrinks, CocktailDBDrinks, getCachedDBDrinks, error, loading };
};

export default useTheCocktailDB;