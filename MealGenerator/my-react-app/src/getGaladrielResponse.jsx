import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_AI_MODEL_ID,
    dangerouslyAllowBrowser: true,
    baseURL: "https://api.galadriel.com/v1/verified",
});

export const getGaladrielResponse = async (message) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an advanced ingredient validator for recipe searches. Your primary functions are:
                    1. Strictly filter out any profanity, vulgar language, or inappropriate words.
                    2. Remove any non-food items or substances not used in cooking.
                    3. Correct misspellings of valid ingredients.
                    4. Only allow common, edible ingredients used in cooking.
                    5. If an input is ambiguous but could be a valid ingredient, interpret it as the ingredient.
                    6. If an ingredient is a type of food (e.g. "fruit" or "vegetable"), interpret it as a specific food (e.g. "apple" or "carrot").
                    7. For each input item, return the validated ingredient name if it is recognized. If the item is not a valid food ingredient, return an error message in the format: 'Error: [input item] is not a valid ingredient.`
                },
                {
                    role: "user",
                    content: `Strictly verify these ingredients for a recipe search: ${message}.`
                }
            ],
        });


        // Extract the response text from the completion
        let responseText = completion.choices[0]?.message?.content.trim();

        // Split the response into individual items
        const validatedItems = responseText.split(',').map(item => item.trim());

        // Filter out any empty strings
        const filteredItems = validatedItems.filter(item => item !== '');

        // If no items remain after filtering, return a "no valid ingredients" message
        if (filteredItems.length === 0) {
            return "No valid ingredients found";
        }

        // Join the filtered items back into a single string
        return filteredItems.join(', ');

    } catch (error) {
        console.error("Error fetching completion:", error);
        throw new Error("Error fetching ingredients from AI model.");
    }
};
