import axios from "axios";

const BASE_URL = import.meta.env.VITE_DEPLOYED_BACKEND_URL || 'http://localhost:5261';

export const getDrinkDetails = async (id, servings = 1) => {
    try {
        const response = await axios.get(`${BASE_URL}/cocktail/${id}?servings=${servings}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching cocktail details:", error);
        throw error;
    }
}

export default getDrinkDetails;