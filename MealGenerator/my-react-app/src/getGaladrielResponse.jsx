import OpenAI from "openai";
/**
 * Generates AI responses for ingredient validation or recipe summaries.
 * @param {string} message - The input message (either ingredients or a recipe name).
 * @param {string} mode - "validate" for ingredient verification, "summary" for AI-generated summaries.
 * @returns {Promise<string>} - The AI-generated response.
 */

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_AI_MODEL_ID,
    dangerouslyAllowBrowser: true,
    baseURL: "https://api.galadriel.com/v1/verified",
});

// Pre-defined prompts (optimized for token efficiency)
const PROMPTS = {
    validate: `Validate food ingredients per these rules:
1. Accept: Edible items, alcohol, brand foods, non-English names
2. Correct: Only obvious typos (pinaple→pineapple)
3. Reject: Non-foods, dangerous items, profanity
4. Output: Return as-is if valid, corrected if typo, or "Error: [item] not food"

Examples:
appl→apple
rum→rum
whiskey→whiskey
rock→Error: rock is not food
pinaple→pineapple`,

    summary: `Brief recipe summary (2 sentences max):
- Key flavors
- Cooking method
- Cultural origin if relevant
Example: "Classic Italian pasta with garlic oil. Ready in 15 minutes."`,

    nutrition: `ONLY respond with this JSON format:
{
"cal":number,"pro":number,"fat":number,"carb":number,
"size":number,"unit":"g"|"ml"
}
Include alcohol calories when relevant. Examples:
{"cal":50,"pro":2,"fat":1,"carb":5,"size":100,"unit":"g"}
{"cal":150,"pro":0,"fat":0,"carb":10,"size":30,"unit":"ml"}`
};

// Cache setup with 24-hour expiry
const getCache = (key) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { response, timestamp } = JSON.parse(cached);
    return (Date.now() - timestamp < 86400000) ? response : null;
};


export const clearValidationCache = () => {
    // Remove all items with 'ai-validate-' prefix
    Object.keys(localStorage)
        .filter(key => key.startsWith('ai-validate-'))
        .forEach(key => localStorage.removeItem(key));
    //console.log('Validation cache cleared');
};

export const clearNutritionCache = () => {
    Object.keys(localStorage)
        .filter(key =>
            key.startsWith('ai-nutrition-') ||
            key.includes('nutrition') ||
            key.includes('ai-nutrition') // covers fallback keys too
        )
        .forEach(key => localStorage.removeItem(key));
    //console.log("🧹 Cleared all AI nutrition cache.");
};


export const getGaladrielResponse = async (message, mode = "validate") => {
    // Client-side pre-validation
    if (mode === "validate") {
        if (message.length > 50) {
            ///console.log(`❌ Rejected: Input too long (${message.length} characters)`);
            return "Error: Input too long";
        }
        // Enhanced logging for regex test
        const dangerousInputTest = /(\b\d+\b|profanity|slurs)(?!\s*(proof|%))/i.test(message);
        //console.log(`Dangerous Input Test Result: ${dangerousInputTest}`);
        if (dangerousInputTest) {
            console.log(`❌ Rejected: Contains potentially dangerous input`);
            return "Error: Invalid input";
        }
    }
    
    // Check cache
    const cacheKey = `ai-${mode}-${message.toLowerCase().trim()}`;
    const cachedResponse = getCache(cacheKey);
    if (cachedResponse) return cachedResponse;

    try {
        // Dynamic model selection
        const model = mode === "validate" ? "gpt-3.5-turbo" : "gpt-4o";
        // API call with timeout fallback
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: "system", content: PROMPTS[mode] },
                { role: "user", content: message }
            ],
            temperature: 0.7,
            signal: controller.signal
        });

        clearTimeout(timeout);
        
        // Process and cache response
        let responseText = completion.choices[0]?.message?.content.trim();
        let response;

        if (mode === "nutrition") {
            console.log("Raw AI Nutrition Response:", responseText);
            try {
                // First parse the response if it's a string
                const responseData = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;

                // Then standardize property names
                response = {
                    calories: responseData.cal || responseData.calories || 0,
                    protein: responseData.pro || responseData.protein || 0,
                    fat: responseData.fat || 0,
                    carbs: responseData.carb || responseData.carbs || 0,
                    servingSize: responseData.size || 100,
                    servingUnit: responseData.unit || "g",
                    source: "AI"
                };
                console.log("Processed nutrition data:", response); // Add this
            } catch (e) {
                console.warn("Failed to parse nutrition response:", e, "Response:", responseText);
                response = {
                    calories: 0, protein: 0, fat: 0, carbs: 0,
                    servingSize: 100, servingUnit: "g", source: "error"
                };
            }
        }
        
        localStorage.setItem(cacheKey, JSON.stringify({
            response,
            timestamp: Date.now()
        }));

        return response;

    } catch (error) {
        console.error("AI Error:", error);
        // Fallback strategies
        return mode === "validate"
            ? message // Assume valid if API fails
            : "Description unavailable (API error)";
    }
};

//Batch Version
export const batchGaladrielResponse = async (messages, mode = "validate") => {
    const batchMessage = `${mode === "validate"
        ? "Validate these ingredients:\n"
        : "Summarize these dishes:\n"}${messages.join("\n")}`;

    return getGaladrielResponse(batchMessage, mode);
};

