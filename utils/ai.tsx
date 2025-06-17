// utils/ai.ts
import { GOOGLE_API_KEY } from '@env';

const GOOGLE_AI_API_KEY = GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;

export const getAIResponse = async (prompt: string): Promise<string> => {
    if (!GOOGLE_AI_API_KEY ) {
        throw new Error("AI Key not configured.");
    }
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            console.error("Gemini API Error:", await response.json());
            throw new Error("Gemini API request failed");
        }
        const result = await response.json();
        return result.candidates[0]?.content?.parts[0]?.text || "";
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
};

export const getWeatherSummaryFromAI = async (weatherData: any) => {
    const prompt = `You are Ohayo, a friendly and witty AI buddy...`; // This function remains the same
    try {
        const responseText = await getAIResponse(prompt);
        const cleanedResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedResponse);
    } catch (error) {
        return {
            summary: `It's currently ${Math.round(weatherData.main.temp)}°C and ${weatherData.weather[0].description}.`,
            joke: "Why did the cloud break up with the fog? He was too down to earth."
        };
    }
};

// NEW FUNCTION: Add this to your file
export const fetchDailyQuote = async (): Promise<string> => {
    const prompt = `You are Ohayo, a friendly AI buddy. Give me one short, inspirational, and friendly quote for the day. Keep it under 15 words. Do not add quotation marks or any extra text, just the quote and the author if known (e.g., The best way to predict the future is to create it. - Peter Drucker).`;
    try {
        const quote = await getAIResponse(prompt);
        return quote.trim();
    } catch (error) {
        // Provide a fallback quote if the API fails
        return "The secret of getting ahead is getting started. - Mark Twain";
    }
};