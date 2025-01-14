import axios from "axios";

export const getInstructions = async (id) => {

    const apiKey = import.meta.env.VITE_API_KEY;
    const cachedData = localStorage.getItem(id);

    //Ensure cached is not stored for more than 24 hours
    if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        const cacheTime = parsedData.timestamp;
        const currentTime = Date.now();
        const cacheDuration = 24 * 60 * 60 * 1000;

        // Return cached data if within the expiry duration
        if (currentTime - cacheTime < cacheDuration) {
            return parsedData.data;
        }
    }

    try{
        const response = await axios.get(
            `https://api.spoonacular.com/recipes/${id}/information`,
            {
                params: {
                    apiKey,
                },
            }
        );

        localStorage.setItem(id, JSON.stringify(response.data));
        console.log("extened Meal", response.data.extendedIngredients);
        return response.data;


    } catch (error) {
        console.error("An error occurred while fetching recipe details", error);
        throw new Error("An error occurred while fetching recipe details");
    }
};

export default getInstructions;