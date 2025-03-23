"use client";

import { useState, useRef } from "react";
import axios from "axios";

const BASE_URL = "https://www.thecocktaildb.com/api/json/v1/1";

export const useTheCocktailDB = () => {
    const [CocktailDBDrinks, setCocktailDBDrinks] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const cache = useRef({});

    const getCocktailDBDrinks = async (ingredients) => {
        const mainIngredient = Array.isArray(ingredients) ? ingredients[0]?.name || ingredients[0] : ingredients;
        const key = mainIngredient.toLowerCase().trim();

        if (cache.current[key]) {
            setCocktailDBDrinks(cache.current[key]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const filterUrl = `${BASE_URL}/filter.php?i=${encodeURIComponent(key)}`;
            const filterResponse = await axios.get(filterUrl);

            if (!filterResponse.data || !filterResponse.data.drinks) {
                setError(`No drinks found for ${key}`);
                setCocktailDBDrinks([]);
                cache.current[key] = [];
                return;
            }

            // Randomly select 5 drinks
            const allDrinks = filterResponse.data.drinks;
            const randomDrinks = allDrinks
                .sort(() => 0.5 - Math.random()) // Shuffle array
                .slice(0, 5); // Pick first 5

            const drinkIds = randomDrinks.map(d => d.idDrink);
            const detailsResponses = await Promise.all(
                drinkIds.map(id => axios.get(`${BASE_URL}/lookup.php?i=${id}`))
            );

            const drinksWithDetails = detailsResponses.map(resp => resp.data.drinks[0]);

            cache.current[key] = drinksWithDetails;
            setCocktailDBDrinks(drinksWithDetails);

        } catch (error) {
            setError(error.message || "Failed to fetch drinks");
            cache.current[key] = [];
        } finally {
            setLoading(false);
        }
    };

    const getCachedDBDrinks = () => cache.current;

    return { getCocktailDBDrinks, CocktailDBDrinks, getCachedDBDrinks, error, loading };
};

export default useTheCocktailDB;