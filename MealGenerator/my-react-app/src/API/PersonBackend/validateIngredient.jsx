export const validateIngredient = async (ingredient) => {

    const BASE_URL = import.meta.env.VITE_DEPLOYED_BACKEND_URL || 'http://localhost:5261';


    if(!ingredient || ingredient.trim() === "") {
        return "Error: Ingredient cannot be empty.";
    }
    
    try {
        const response = await fetch(`${BASE_URL}/validate-ingredient`, {
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
        
        return data || `Error: "${ingredient}" is not a valid ingredient.`;
        
    } catch (error) {
        return `Error: ${error.message}`;
    }
}