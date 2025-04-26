import OpenAI from "openai";

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
Example: "Classic Italian pasta with garlic oil. Ready in 15 minutes."`
};

// Cache setup with 24-hour expiry
const getCache = (key) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { response, timestamp } = JSON.parse(cached);
    return (Date.now() - timestamp < 86400000) ? response : null;
};

export const clearValidationCache = () => {
    Object.keys(localStorage)
        .filter(key => key.startsWith('ai-validate-'))
        .forEach(key => localStorage.removeItem(key));
};

export const getGaladrielResponse = async (message, mode = "validate") => {
    // Client-side pre-validation
    if (mode === "validate") {
        if (message.length > 50) {
            return "Error: Input too long";
        }

        const dangerousInputTest = /(\b\d+\b|profanity|slurs)(?!\s*(proof|%))/i.test(message);
        if (dangerousInputTest) {
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

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: "system", content: PROMPTS[mode] },
                { role: "user", content: message }
            ],
            temperature: 0.7
        });

        const responseText = completion.choices[0]?.message?.content.trim();

        // Cache and return response
        localStorage.setItem(cacheKey, JSON.stringify({
            response: responseText,
            timestamp: Date.now()
        }));

        return responseText;

    } catch (error) {
        console.error("AI Error:", error);
        // Fallback strategies
        return mode === "validate"
            ? message // Assume valid if API fails
            : "Description unavailable (API error)";
    }
};

// Batch Version
export const batchGaladrielResponse = async (messages, mode = "validate") => {
    const batchMessage = `${mode === "validate"
        ? "Validate these ingredients:\n"
        : "Summarize these dishes:\n"}${messages.join("\n")}`;

    return getGaladrielResponse(batchMessage, mode);
};