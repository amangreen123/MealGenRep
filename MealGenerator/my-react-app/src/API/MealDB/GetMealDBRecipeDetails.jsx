import axios from "axios"

const BASE_URL = import.meta.env.VITE_DEPLOYED_BACKEND_URL || 'http://localhost:5261';

export const getMealDBRecipeDetails = async (id, servings = 4) => {
    try {
        const response = await axios.get(`${BASE_URL}/recipe/${id}?servings=${servings}`, {
            timeout: 5000
        });

        console.log("Recipe details for", id);
        return response.data;
    } catch (error) {
        console.error("Error fetching recipe:", error);
        throw error;
    }
}

export default getMealDBRecipeDetails;