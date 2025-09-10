export const validateIngredient = async (ingredient) => {

    if(!ingredient || ingredient.trim() === "") {
        return "Error: Ingredient cannot be empty.";
    }
    
    try {
        
        const response = await("http://localhost:5261/validate-ingredient", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ingredient })
        });
        
        if (!response.ok) {
            return `Error: Server responded with status ${response.status}`;
        }
        
        const data = await response.json();
        console.log("Validation response data:", data);
        return data.validate || `Error: Invalid ingredient "${ingredient}"`;
        
    } catch (error) {
        return `Error: ${error.message}`;
    }
}