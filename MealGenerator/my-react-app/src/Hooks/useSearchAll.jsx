import { useState, useRef } from "react";
import axios from "axios";


const BASE_URL = import.meta.env.VITE_DEPLOYED_BACKEND_URL || 'http://localhost:5261';

export const useSearchAll = () => {
    const [results, setResults] = useState({ meals: [], drinks: [] });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const cache = useRef({});
    
    const searchAll = async (ingredients, diet = "") => {
        const ingredientString = Array.isArray(ingredients)
            ? ingredients.join(',')
            : ingredients;
        
        const cacheKey = `${ingredientString}-${diet}`.toLowerCase();
        
        if (cache.current[cacheKey]) {
            setResults(cache.current[cacheKey]);
            setLoading(false);
            return cache.current[cacheKey];
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const url = `${BASE_URL}/search-all?ingredients=${encodeURIComponent(ingredientString)}&diet=${encodeURIComponent(diet)}`;
            
            const response = await axios.get(url);
            
            const data = {
                meals: response.data.meals || [],
                drinks: response.data.drinks || []
            };
            cache.current[cacheKey] = data;
            setResults(data);
            return data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Failed to search";
            setError(errorMessage);
            setResults({ meals: [], drinks: [] });
            cache.current[cacheKey] = { meals: [], drinks: [] };
            return { meals: [], drinks: [] };
        } finally {
            setLoading(false);
        }
    };
    
    return { results, error, loading, searchAll };
}
            
            