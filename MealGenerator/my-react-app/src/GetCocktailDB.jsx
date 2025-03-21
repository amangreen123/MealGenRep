"use client"

import { useState, useRef } from "react"
import axios from "axios"

const BASE_URL = "https://www.thecocktaildb.com/api/json/v1/1"

export const useTheCocktailDB = () => {
    const [CocktailDBDrinks, setCocktailDBDrinks] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const cache = useRef({})

    const getCocktailDBDrinks = async (ingredients) =>{
        const mainIngredient = Array.isArray(ingredients) ? ingredients[0]?.name || ingredients[0] : ingredients;

        const key = mainIngredient.toLowerCase().trim()

        // console.log("Key" + key)
        // console.log("Main Ingredients" + mainIngredient)

         // Check cache first
        if (cache.current[key]) {
            setCocktailDBDrinks(cache.current[key])
            setLoading(false)
            //console.log("Using cached CocktailDB drinks for:", key)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Construct the URL properly with encoded ingredient
            const url = `${BASE_URL}/filter.php?i=${encodeURIComponent(key)}`
            console.log("Fetching from CocktailDB:", url)

            const response = await axios.get(url)

            // Handle API-specific null response
            if (!response.data || !response.data.drinks) {
                const newError = `No drinks found for ${key}`
                console.log(newError)
                setError(newError)
                setCocktailDBDrinks([])
                cache.current[key] = [] // Cache empty results to avoid repeated failed calls
                return
            }
            const results = response.data.drinks
            cache.current[key] = results
            setCocktailDBDrinks(results)
            console.log("CocktailDB drinks found:", results.length)

        } catch {
            const errorMessage = error.message || "Failed to fetch drinks from CocktailDB"
            console.error("CocktailDB API Error:", errorMessage)
            setError(errorMessage)
            setCocktailDBDrinks([])
            cache.current[key] = [] // Cache failed results
        } finally {
            setLoading(false)
        }
    }

    const getCachedDBDrinks = () => cache.current

    return {getCocktailDBDrinks,CocktailDBDrinks, getCachedDBDrinks, error, loading }
}

export default useTheCocktailDB