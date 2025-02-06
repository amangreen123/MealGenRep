import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_AI_MODEL_ID, dangerouslyAllowBrowser: true,
    baseURL:"https://api.galadriel.com/v1/verified",
});


export const getGaladrielResponse = async (message) => {

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a helpful assistant that verifies ingredients for recipe searches." },
                { role: "user", content: `Please verify these ingredients: ${message}. If any of them are invalid or misspelled, suggest corrections or remove them.` },
            ],
        });

        return completion;

    } catch (error) {
        console.error("Error fetching completion:", error);
        throw error;
    }
};


