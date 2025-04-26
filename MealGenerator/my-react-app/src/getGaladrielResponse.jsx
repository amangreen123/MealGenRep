import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_AI_MODEL_ID,
    dangerouslyAllowBrowser: true,
    baseURL: "https://api.galadriel.com/v1/verified",
});

// Pre-defined prompts for different modes
const PROMPTS = {
    validate: `Validate food ingredients per these rules:
1. Accept: Edible items, alcohol, brand foods, non-English names
2. Correct: Only obvious typos (pinaple→pineapple)
3. Reject: Non-foods, dangerous items, profanity
4. Output: Return as-is if valid, corrected if typo, or "Error: [item] not food"`,

    summary: `Brief recipe summary (2 sentences max):
- Key flavors
- Cooking method
- Cultural origin if relevant`,
};

// Cache setup with 24-hour expiry
const getCache = (key) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { response, timestamp } = JSON.parse(cached);
    return (Date.now() - timestamp < 86400000) ? response : null;
};

export const getGaladrielResponse = async (message, mode = "validate", customPrompt = null) => {
    // Client-side pre-validation
    if (mode === "validate") {
        if (message.length > 50) return "Error: Input too long";
        if (/(\b\d+\b|profanity|slurs)(?!\s*(proof|%))/i.test(message)) {
            return "Error: Invalid input";
        }
    }

    // Check cache
    const cacheKey = `ai-${mode}-${message.toLowerCase().trim()}`;
    const cachedResponse = getCache(cacheKey);
    if (cachedResponse) return cachedResponse;

    try {
        // Configuration for different modes
        const params = {
            model: mode === "validate" ? "gpt-3.5-turbo" : "gpt-4",
            messages: [
                {
                    role: "system",
                    content: customPrompt || PROMPTS[mode]
                },
                { role: "user", content: message }
            ],
            temperature: 0.3,
            // Only force JSON if explicitly requested
            ...(mode === "nutrition" && customPrompt?.includes('JSON') && {
                response_format: { type: "json_object" }
            })
        };

        const completion = await openai.chat.completions.create(params);
        let response = completion.choices[0]?.message?.content?.trim();

        // Cache the response
        localStorage.setItem(cacheKey, JSON.stringify({
            response,
            timestamp: Date.now()
        }));

        return response;

    } catch (error) {
        console.error("Galadriel API error:", error);

        // Special handling for nutrition mode
        if (mode === "nutrition") {
            return "Calories: 0\nProtein: 0g\nFat: 0g\nCarbs: 0g\nServing: 100g";
        }

        // Default fallbacks
        switch (mode) {
            case "validate":
                return message; // Assume valid if API fails
            default:
                return "Description unavailable (API error)";
        }
    }
};

// Batch version
export const batchGaladrielResponse = async (messages, mode = "validate") => {
    const batchMessage = `${mode === "validate"
        ? "Validate these ingredients:\n"
        : "Summarize these dishes:\n"}${messages.join("\n")}`;

    return getGaladrielResponse(batchMessage, mode);
};

// Cache clearing
export const clearGaladrielCache = (prefix = "") => {
    Object.keys(localStorage)
        .filter(key => key.startsWith(`ai-${prefix}`))
        .forEach(key => localStorage.removeItem(key));
};