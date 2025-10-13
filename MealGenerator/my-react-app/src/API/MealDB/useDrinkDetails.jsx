import { useState, useRef } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_DEPLOYED_BACKEND_URL || 'http://localhost:5261';

export const useDrinkDetails = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // In-memory cache for drink details
    const cache = useRef({});

    const getDrinkDetails = async (id, servings = 1) => {
        // Create cache key
        const cacheKey = `${id}_${servings}`;

        // Check if we have this in cache
        if (cache.current[cacheKey]) {
            console.log(`✅ Frontend Cache HIT for drink: ${id}`);
            return cache.current[cacheKey];
        }

        console.log(`🔄 Frontend Cache MISS for drink: ${id}`);

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${BASE_URL}/cocktail/${id}?servings=${servings}`
            );

            const data = response.data;

            // Store in cache
            cache.current[cacheKey] = data;

            console.log(`💾 Cached drink details for: ${id}`);

            return data;

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch drink details";
            console.error("Error fetching drink details:", errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const clearCache = () => {
        cache.current = {};
        console.log("🗑️ Drink details cache cleared");
    };

    const getCacheSize = () => {
        return Object.keys(cache.current).length;
    };

    return {
        getDrinkDetails,
        loading,
        error,
        clearCache,
        getCacheSize
    };
};

export default useDrinkDetails;