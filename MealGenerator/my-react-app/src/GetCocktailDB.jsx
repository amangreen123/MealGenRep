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

        // Check cache first
        if (cache.current[key]) {
            setCocktailDBDrinks(cache.current[key]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            //Fetch the list of drinks by ingredient
            const filterUrl = `${BASE_URL}/filter.php?i=${encodeURIComponent(key)}`;
            console.log("Fetching from CocktailDB (filter):", filterUrl);

            const filterResponse = await axios.get(filterUrl);

            // Handle null response
            if (!filterResponse.data || !filterResponse.data.drinks) {
                const newError = `No drinks found for ${key}`;
                console.log(newError);
                setError(newError);
                setCocktailDBDrinks([]);
                cache.current[key] = []; // Cache empty results
                return;
            }

             //Fetch full details for each drink
            const drinksWithDetails = await Promise.all(
                filterResponse.data.drinks.map(async (drink) => {
                    const lookupUrl = `${BASE_URL}/lookup.php?i=${drink.idDrink}`;
                    console.log("Fetching from CocktailDB (lookup):", lookupUrl);

                    const lookupResponse = await axios.get(lookupUrl);
                    return lookupResponse.data.drinks[0]; // Return the full drink details
                })
            );

            // Cache the results
            cache.current[key] = drinksWithDetails;
            setCocktailDBDrinks(drinksWithDetails);
            console.log("CocktailDB drinks with details found:", drinksWithDetails.length);

        } catch (error) {
            const errorMessage = error.message || "Failed to fetch drinks from CocktailDB";
            console.error("CocktailDB API Error:", errorMessage);
            setError(errorMessage);
            setCocktailDBDrinks([]);
            cache.current[key] = []; // Cache failed results
        } finally {
            setLoading(false);
        }
    };

    const getCachedDBDrinks = () => cache.current;

    return { getCocktailDBDrinks, CocktailDBDrinks, getCachedDBDrinks, error, loading };
};

export default useTheCocktailDB;