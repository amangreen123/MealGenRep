import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_AI_MODEL_ID,
    dangerouslyAllowBrowser: true,
    baseURL: "https://api.galadriel.com/v1/verified",
});

const PROMPTS = {
    validate: `Strictly validate food ingredients:
1. Return EXACT input if valid
2. Return corrected spelling if obvious typo (max 1 change)
3. Return "Error: [reason]" if invalid
4. Never add explanations`,
    
    summary: `Brief recipe summary (2 sentences):
1. Cooking method
2. Key flavors
3. Cultural origin if notable`
};

// More reliable cache with size limits
const cacheManager = {
    get: (key) => {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;

            const { response, timestamp } = JSON.parse(cached);
            return (Date.now() - timestamp < 86400000) ? response : null;
        } catch {
            return null;
        }
    },

    set: (key, value) => {
        try {
            // Prevent cache bloating
            if (localStorage.length > 500) {
                clearGaladrielCache();
            }
            localStorage.setItem(key, JSON.stringify({
                response: value,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn("Cache write failed", error);
        }
    }
};

export const getGaladrielResponse = async (message, mode = "validate", customPrompt = null) => {
    // Input sanitization
    if (typeof message !== "string" || message.trim() === "") {
        return mode === "nutrition"
            ? "Calories: 0\nProtein: 0g\nFat: 0g\nCarbs: 0g"
            : "Error: Empty input";
    }

    // Check cache with normalized key
    const cacheKey = `ai-${mode}-${message.toLowerCase().trim().replace(/\s+/g, '-')}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;

    try {
        // Build optimized request
        const payload = {
            model: mode === "nutrition" ? "gpt-4" : "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: customPrompt || PROMPTS[mode] || PROMPTS.validate
                },
                {
                    role: "user",
                    content: mode === "nutrition"
                        ? `Nutrition for 100g ${message}`
                        : message
                }
            ],
            temperature: 0.2,
            max_tokens: mode === "nutrition" ? 100 : 150
        };

        const response = await fetch("https://api.galadriel.com/v1/verified/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.VITE_AI_MODEL_ID}`
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000) // Timeout after 5s
        });

        if (!response.ok) {
            throw new Error(`API Error ${response.status}`);
        }

        const data = await response.json();
        let result = data.choices[0]?.message?.content?.trim();

        // Post-processing
        if (mode === "nutrition") {
            result = result.replace(/[{}]/g, ''); // Remove any JSON artifacts
        }

        cacheManager.set(cacheKey, result);
        return result;

    } catch (error) {
        console.error(`Galadriel error (${mode}):`, error.message);

        // Specialized fallbacks
        switch (mode) {
            case "nutrition":
                return `Calories: 100\nProtein: 10g\nFat: 5g\nCarbs: 2g`;
            case "validate":
                return message; // Fail-open for validation
            default:
                return "Error: Service unavailable";
        }
    }
};

// Batch processing with chunking
export const batchGaladrielResponse = async (messages, mode = "validate") => {
    const CHUNK_SIZE = 5;
    const results = [];

    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
        const chunk = messages.slice(i, i + CHUNK_SIZE);
        const batchPrompt = `${mode === "validate"
            ? "Validate these items:\n"
            : "Process these:\n"}${chunk.join("\n")}`;

        results.push(await getGaladrielResponse(batchPrompt, mode));
    }

    return results.flat();
};

// Enhanced cache clearing
export const clearGaladrielCache = (prefix = "") => {
    const prefixKey = `ai-${prefix}`;
    Object.keys(localStorage)
        .filter(key => key.startsWith(prefixKey))
        .forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`Failed to clear ${key}`, error);
            }
        });
};