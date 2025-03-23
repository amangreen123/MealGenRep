import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_AI_MODEL_ID,
    dangerouslyAllowBrowser: true,
    baseURL: "https://api.galadriel.com/v1/verified",
});

/**
 * Generates AI responses for ingredient validation or recipe summaries.
 * @param {string} message - The input message (either ingredients or a recipe name).
 * @param {string} mode - "validate" for ingredient verification, "summary" for AI-generated summaries.
 * @returns {Promise<string>} - The AI-generated response.
 */

export const getGaladrielResponse = async (message, mode = "validate") => {
    try {
        let systemPrompt = "";

        if (mode === "validate") {
            systemPrompt = `You are an advanced ingredient validator for recipe searches. Your primary functions are:
            1. Strictly filter out any profanity, vulgar language, or inappropriate words.
            2. Remove any non-food items or substances not used in cooking.
            3. Correct misspellings of valid ingredients.
            4. Only allow common, edible ingredients used in cooking.
            5. If an input is ambiguous but could be a valid ingredient, interpret it as the ingredient.
            6. If an ingredient is a type of food (e.g. "fruit" or "vegetable"), interpret it as a specific food (e.g. "apple" or "carrot").
            7. For each input item, return the validated ingredient name if it is recognized. If the item is not a valid food ingredient, return an error message in the format: 'Error: [input item] is not a valid ingredient.'
            8. Include juices and alcoholic beverages as valid ingredients; do not filter them out.
            `;
        } else if (mode === "summary") {
            systemPrompt = `You are an expert food AI that provides short, engaging descriptions of recipes. Your task is:
            1. Generate a short summary (2-3 sentences) for the given dish or drink.
            2. Mention key ingredients or the general cooking method.
            3. Make it engaging and appealing to readers.
            4. Keep it concise and under 50 words.
            `;
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
        });

        return completion.choices[0]?.message?.content.trim();

    } catch (error) {
        console.error("Error fetching AI response:", error);
        return "No summary available.";
    }
};
