import {useState, useEffect} from "react";
import UseLocalStorageState from "@/hooks/UseLocalStorageState";
import { getGaladrielResponse } from "@/getGaladrielResponse.jsx"
import {validateIngredient} from "@/API/PersonBackend/validateIngredient.jsx";


export default function useIngredientManager() {

    const [ingredients, setIngredients] = UseLocalStorageState("mealForgerIngredients", []);
    const [errorMessage, setErrorMessage] = useState("");
    const [loadingText, setLoadingText] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    
    const addIngredients = async (input) => {
        if (input.trim() === "") {
            setErrorMessage("Ingredient input is empty");
            return;
        }
        
        const ingredientsArray = input
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        const isMultiple = ingredientsArray.length > 1;
        setLoadingText(isMultiple ? "ADDING INGREDIENTS..." : "ADDING INGREDIENT...");
        setIsSearching(true);
        setErrorMessage("");
        
        try {
            const duplicates = [];
            const validationErrors = [];
            const newIngredients = [];

            const existingLower = ingredients.map((i) => i.toLowerCase());
            const uniqueInputs = [...new Set(ingredientsArray)]

            for (const ingredient of uniqueInputs) {
                
                //console.log("Ingredient received:", ingredient, typeof ingredient);
                const lower = typeof ingredient === "string" ? ingredient.toLowerCase() : "";
                
                if (existingLower.includes(lower)) {
                    duplicates.push(ingredient)
                    continue;
                }
                
                
                const result = await validateIngredient(ingredient);
                console.log("Validation result:", result);
                
                if (result.startsWith("Error:")) {
                    validationErrors.push(result)

                } else {

                    if (!existingLower.includes(result.toLowerCase())) {
                        newIngredients.push(result)

                    } else {
                        duplicates.push(ingredient)
                    }
                }
              

                const errorParts = [];

                if (duplicates.length > 0) {
                    errorParts.push(`Already added: ${duplicates.join(", ")}`);
                }

                if (validationErrors.length > 0) {
                    errorParts.push(`Invalid: ${validationErrors.join(", ")}`);
                }

                if (errorParts.length > 0) {
                    setErrorMessage(errorParts.join(". "));
                }
            }

            if (newIngredients.length > 0) {
                setIngredients((prev) => [...prev, ...newIngredients]);
            }
            
        } catch (error) {
            console.error("Error adding ingredients:", error);
            setErrorMessage("Something went wrong adding ingredients.");
        } finally {
            setIsSearching(false);
            setLoadingText("");
        }
    };
    
    const removeIngredient = (ingredientToRemove) => {
        setIngredients((prev) => prev.filter((i) => i !== ingredientToRemove));
    }
    
    const clearIngredients = () => {
        setIngredients([]);
    }

    return {
        ingredients,
        addIngredients,
        removeIngredient,
        clearIngredients,
        errorMessage,
        loadingText,
        isSearching,
    };
}