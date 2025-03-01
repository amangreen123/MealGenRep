import axios from "axios";

const apiKey = import.meta.env.VITE_USDA_KEY;
const BASE_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

export const getUSDAInfo = async (ingredientName) => {

    const cachedData = localStorage.getItem(`macros-${ingredientName}`);

    if(cachedData){
        console.log(`Cache hit for ${ingredientName}`);

        return JSON.parse(cachedData);
    }

    try {
        const response = await axios.get(BASE_URL, {
            params:{
                api_key: apiKey,
                query: ingredientName,
                dataType: "Foundation, SR Legacy, Branded, Survey (FNDDS)",
                pageSize: 1
            },
        });

        if(response.data.foods.length === 0){
            console.warn(`No data found for ${ingredientName}`)

            return null;
        }

        const food = response.data.foods[0];

        const macros = {
            calories: food.foodNutrients.find(n => n.nutrientName === "Energy")?.value || 0,
            protein: food.foodNutrients.find(n => n.nutrientName === "Protein")?.value || 0,
            fat: food.foodNutrients.find(n => n.nutrientName === "Total lipid (fat)")?.value || 0,
            carbs: food.foodNutrients.find(n => n.nutrientName === "Carbohydrate, by difference")?.value || 0,
        };

        localStorage.setItem(`macros-${ingredientName}`, JSON.stringify(macros));

        //console.log("USDA API Response:", response.data);

        return macros;

    } catch {
        console.error(`Error Fetching USDA data for ${ingredientName}`);
        console.log("API Key:", apiKey);
        console.log("Request URL:", `${BASE_URL}?query=${ingredientName}&api_key=${apiKey}`);
        return null;
    }

};



