import axios from "axios";

export const getDrinkDetails = async (id) => {
    try {
        const response = await axios.get(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`)
        const results = response.data
        //console.log("Cocktail Data", results)
        return results
    }catch (error){
        //console.error("Error fetching cocktail details:", error)
        throw error
    }
}

export default getDrinkDetails