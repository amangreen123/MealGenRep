import axios from "axios";

export const getDrinkDetails = async (id) => {
    try {
        const response = await axios.get(`www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`)
        const results = response.data

        console.log("Cocktail Data", results)
    }catch (error){

        throw error
    }
}

export default getDrinkDetails