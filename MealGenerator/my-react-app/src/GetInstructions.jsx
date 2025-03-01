import axios from "axios";

export const getInstructions = async (id) => {
    const apiKey = import.meta.env.VITE_API_KEY;
    const cachedData = localStorage.getItem(id);

    // Ensure cached data is not stored for more than 24 hours
    if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        const cacheTime = parsedData.timestamp;
        const currentTime = Date.now();

        const cacheDuration =  60 * 60 * 1000;

        console.log("Cached Data for ID:", id, parsedData);

        // Return cached data if within the expiry duration
        if (currentTime - cacheTime < cacheDuration) {
            console.log("Using cached data.");
            return parsedData.data;
        }
    }

    try {
        // Fetch both recipe instructions and nutrition information in parallel
        const [getInstruction, getMacros] = await Promise.all([
            axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
                params: { apiKey }
            }),
            axios.get(`https://api.spoonacular.com/recipes/${id}/nutritionWidget.json`, {
                params: { apiKey }
            })
        ]);

        const macrosAndSteps = {
            instructions: getInstruction.data.instructions,
            macros: getMacros.data,
            usedIngredients: getInstruction.data.usedIngredients,
            missedIngredients: getInstruction.data.missedIngredients,
            usdaNutrients: usdaData
        };

        console.log("Fetched USAD:", usdaData);

        // Store the response in localStorage with a timestamp
        localStorage.setItem(id, JSON.stringify({
            timestamp: Date.now(),
            data: macrosAndSteps
        }));



        return macrosAndSteps; // Return the structured data
    } catch (error) {
        //error for when I reach the API limit
        if (error.response && error.response.status === 402) {
            console.error("API limit reached. Please try again later.");
            throw new Error("API limit reached. Please try again later.");
        }
        console.error("Error fetching recipe details:", error);
        throw new Error("An error occurred while fetching recipe details.");
    }
};

export default getInstructions;
