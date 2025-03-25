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
    validate: `Validate ingredients:
1. Allow edible items only (e.g., "apple" ✅)
2. Correct typos (e.g., "chese" → "cheese")
3. Reject non-food with "Error: [item] invalid"`,

    summary: `Generate a 2-sentence recipe summary with:
- Key ingredients
- Cooking method
Max 30 words. Example: "Creamy pasta with garlic and parmesan. Ready in 15 minutes."`
};

// Cache setup with 24-hour expiry
const getCache = (key) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { response, timestamp } = JSON.parse(cached);
    return (Date.now() - timestamp < 86400000) ? response : null;
};

export const getGaladrielResponse = async (message, mode = "validate") => {
    // Client-side pre-validation
    if (mode === "validate") {
        if (message.length > 50) return "Error: Input too long";
        if (/(\b\d+\b|profanity|slurs)/i.test(message)) return "Error: Invalid input";
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
        const response = completion.choices[0]?.message?.content.trim()
            || (mode === "validate" ? message : "Description unavailable");

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

