import axios from "axios"

export const getMealDBRecipeDetails = async (id) => {
    try {
        const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)

        const results = response.data
        //console.log("Meal DB Recipe Step Data", results)
        return results // Return the entire response data
    } catch (error) {
        //console.log("Error", error.message)
        throw error // Throw the error to be handled by the caller
    }
}

export default getMealDBRecipeDetails

