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
    validate: `You are an ultra-permissive food ingredient validator. Your rules:

1. ACCEPT ALL:
   - Any edible item (plant, animal, mineral-based foods)
   - All forms of alcohol(liquors, beers, wines) - Remember Rum is is liquors
   - Any spelling variation that could reasonably represent food
   - Non-English food names (e.g. "shiitake", "quinoa")
   - Brand names when clearly food (e.g. "Tabasco", "Oreo")

2. CORRECT GENTLY:
   - Only fix obvious single-character typos:
     "pinaple" → "pineapple"
     "tomatto" → "tomato"
   - Preserve regional spelling differences:
     "eggplant" vs "aubergine"
     "cilantro" vs "coriander"

3. REJECT ONLY:
   - Clearly non-food items (e.g. "wood", "plastic")
   - Dangerous substances (e.g. "poison", "bleach")
   - Profanity/slurs (e.g. explicit bad words)

4. OUTPUT FORMAT:
   - Return validated ingredient exactly as phrased if valid
   - For typos: return corrected version
   - For rejects: "Error: [item] is not a food ingredient"

Examples:
"appl" → "apple"
"rum" → "rum"
"whiskey" → "whiskey"
"rock" → "Error: rock is not a food ingredient"
"pinaple" → "pineapple"`,

    summary: `Generate 2-sentence recipe summaries highlighting:
- Key flavor profiles
- Cooking techniques
- Cultural origins (when relevant)
Keep under 30 words. Examples:
"Classic Italian pasta with garlic and olive oil. Ready in 15 minutes."
"Tropical cocktail blending rum, pineapple and coconut. Served chilled with a cherry garnish."`
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
export const getGaladrielResponse = async (message, mode = "validate") => {
    // Client-side pre-validation
    //console.group(`🔍 Validation Request for: ${message}`);
   // console.log(`Mode: ${mode}`);

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
        const response = completion.choices[0]?.message?.content.trim()
            || (mode === "validate" ? message : "Description unavailable");

        //console.log("Raw AI Response:", response);


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

