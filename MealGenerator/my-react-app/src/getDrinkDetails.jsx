import axios from "axios";

export const getDrinkDetails = async (id) => {
    const apiKey = import.meta.env.VITE_COCKTAILDB_KEY;
   
    try {
        const response = await axios.get(`https://www.thecocktaildb.com/api/json/v2/${apiKey}/lookup.php?i=${id}`);
        const results = response.data;
        return results;
    } catch (error) {
        console.error("Error fetching cocktail details:", error);
        throw error;
    }
}

export default getDrinkDetails