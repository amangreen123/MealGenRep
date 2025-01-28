import axios from "axios";

const getNutrition = async  () => {
    const appId = import.meta.env.VITE_APP_ID;
    const appKey = import.meta.env.VITE_APP_KEY;

    try{
        const response = await axios.get(`https://api.edamam.com/api/nutrition-data?app_id=${appId}&app_key=${appKey}&ingr=1%20large%20apple`);
        return response.data;

    }catch(error){
        console.error("Error fetching nutrition data:", error);
        throw new Error("An error occurred while fetching nutrition data.");
    }


}

export default getNutrition;