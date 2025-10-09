import { useState, useRef, useCallback} from "react";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5261';

export const useRecipeDetails = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Separate caches for meals and drinks
    const mealCache = useRef({});
    const drinkCache = useRef({});
    
    const getMealDetails = useCallback (async (id, servings = 4) => {
        const cacheKey = `${id}_${servings}`;

        // Check cache
        if (mealCache.current[cacheKey]) {
            console.log(`✅ Meal Cache HIT: ${id}`);
            return mealCache.current[cacheKey];
        }

        console.log(`🔄 Meal Cache MISS: ${id}`);
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${BASE_URL}/recipe/${id}?servings=${servings}`
            );

            const data = response.data;
            mealCache.current[cacheKey] = data;

            console.log(`💾 Cached meal: ${id}`);
            return data;

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch meal";
            console.error("Meal fetch error:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);
    
    
    const getDrinkDetails = useCallback (async (id, servings = 1) => {
        const cacheKey = `${id}_${servings}`;

        // Check cache
        if (drinkCache.current[cacheKey]) {
            console.log(`✅ Drink Cache HIT: ${id}`);
            return drinkCache.current[cacheKey];
        }

        console.log(`🔄 Drink Cache MISS: ${id}`);
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${BASE_URL}/cocktail/${id}?servings=${servings}`
            );

            const data = response.data;
            drinkCache.current[cacheKey] = data;

            console.log(`💾 Cached drink: ${id}`);
            return data;

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch drink";
            console.error("Drink fetch error:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Clear all caches
     */
    const clearAllCaches = () => {
        mealCache.current = {};
        drinkCache.current = {};
        console.log("🗑️ All caches cleared");
    };

    /**
     * Clear specific cache type
     */
    const clearMealCache = () => {
        mealCache.current = {};
        console.log("🗑️ Meal cache cleared");
    };

    const clearDrinkCache = () => {
        drinkCache.current = {};
        console.log("🗑️ Drink cache cleared");
    };

    /**
     * Get cache statistics
     */
    const getCacheStats = () => {
        return {
            meals: Object.keys(mealCache.current).length,
            drinks: Object.keys(drinkCache.current).length,
            total: Object.keys(mealCache.current).length + Object.keys(drinkCache.current).length
        };
    };

    return {
        // Getters
        getMealDetails,
        getDrinkDetails,

        // State
        loading,
        error,

        // Cache management
        clearAllCaches,
        clearMealCache,
        clearDrinkCache,
        getCacheStats
    };
};

export default useRecipeDetails;