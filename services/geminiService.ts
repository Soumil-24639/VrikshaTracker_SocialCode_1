import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { GroundingMetadata, WeatherData } from '../types';

// Assume API_KEY is set in the environment
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY not found in environment variables. Gemini features will not work.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const urlToGenerativePart = async (url: string) => {
  try {
      const response = await fetch(url);
      if (!response.ok) { // Check if the fetch was successful
          // Fallback for Base64 URLs or if fetch fails
          if (url.startsWith('data:image')) {
              return {
                  inlineData: { data: url.split(',')[1], mimeType: url.split(';')[0].split(':')[1] },
              };
          }
          throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
      return {
          inlineData: { data: await base64EncodedDataPromise, mimeType: blob.type || 'image/jpeg' },
      };
  } catch (error) {
       console.warn(`Could not fetch image from URL: ${url}. This might be a local object URL. Trying to handle as Base64.`, error);
       // If the URL is a local blob URL, fetch will fail. If it's a Base64 string, we can parse it.
       if (url.startsWith('data:image')) {
           return {
               inlineData: { data: url.split(',')[1], mimeType: url.split(';')[0].split(':')[1] },
           };
       }
       // If it's neither, we can't process it.
       throw new Error(`Invalid image URL format for processing: ${url}`);
  }
};


// --- AI FUSION ENGINE ---
export const analyzeSaplingUpdate = async (
    newImageFile: File,
    weather: WeatherData,
    soil: string,
    previousImageUrl?: string
): Promise<{ status: string, confidence: number, recommendation: string }> => {
  if (!API_KEY) return { status: "Healthy", confidence: 0, recommendation: "API Key not configured. Please assess manually." };
  try {
    const newImagePart = await fileToGenerativePart(newImageFile);
    
    const parts = [];
    let promptContext = `Current weather: ${weather.temp}°C, ${weather.humidity}% humidity, ${weather.rainfall}mm rain. Soil is inferred as '${soil}'.`;
    
    let prompt = "";

    if (previousImageUrl) {
        const previousImagePart = await urlToGenerativePart(previousImageUrl);
        parts.push(previousImagePart, {text: "This is the previous photo of the sapling."}, newImagePart, {text: "This is the current photo."});
        prompt = `You are an environmental AI expert. Given the context, analyze the current sapling image.
        1.  **Health Status**: Determine if it's 'Healthy', 'Needs Water', 'Damaged', or 'Lost'.
        2.  **Confidence Score**: Provide a confidence score (0.0 to 1.0) for your health assessment.
        3.  **Recommendation**: Fusing the image analysis, weather data, soil condition, and comparison to the previous photo, provide a short, actionable recommendation (max 25 words) with an emoji.
        Return a single JSON object: {"status": "...", "confidence": ..., "recommendation": "..."}`;
    } else {
        parts.push(newImagePart);
        prompt = `You are an environmental AI expert. Given the context, analyze this new sapling image.
        1.  **Health Status**: Determine if it's 'Healthy', 'Needs Water', 'Damaged', or 'Lost'.
        2.  **Confidence Score**: Provide a confidence score (0.0 to 1.0) for your health assessment.
        3.  **Recommendation**: Fusing the image analysis with the weather and soil data, provide a short, actionable recommendation for a newly planted sapling (max 25 words) with an emoji.
        Return a single JSON object: {"status": "...", "confidence": ..., "recommendation": "..."}`;
    }
    parts.push({text: `Context: ${promptContext}. Task: ${prompt}`});
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });

    const text = response.text.trim();
    const result = JSON.parse(text);
    return result;

  } catch (error) {
    console.error("Error analyzing sapling:", error);
    return {
      status: "Healthy",
      confidence: 0,
      recommendation: "AI analysis failed. Please assess manually."
    };
  }
};

// --- PREDICTIVE 7-DAY FORECAST ---
export type Forecast = {
    percentage: number;
    direction: 'increase' | 'decrease';
    explanation: string;
};

export const getHealthForecast = async (currentStatus: string, weather: WeatherData): Promise<Forecast> => {
    if (!API_KEY) return { percentage: 0, direction: 'increase', explanation: "API Key not configured." };
    try {
        const prompt = `
        You are a predictive environmental AI. A sapling's current health is '${currentStatus}'.
        The local weather is ${weather.temp}°C, ${weather.humidity}% humidity, with ${weather.rainfall}mm of recent rain.
        Based on this, and assuming a typical 7-day weather forecast for this climate (hot, potentially dry), predict the likely health change.
        
        Return a single JSON object with the following structure:
        {
          "percentage": <predicted % change, e.g., 20>,
          "direction": <"increase" or "decrease">,
          "explanation": "<A short sentence explaining why, e.g., 'With low rain and high temperature, health may decrease...'>"
        }
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        percentage: { type: Type.NUMBER },
                        direction: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ['percentage', 'direction', 'explanation']
                }
            }
        });

        const text = response.text.trim();
        return JSON.parse(text);

    } catch (error) {
        console.error("Error fetching health forecast:", error);
        return {
            percentage: 0,
            direction: 'increase',
            explanation: 'Could not generate an AI forecast at this time.'
        };
    }
};

// --- AI CHATBOT ---
export const getAiChatResponse = async (text: string, image?: File): Promise<string> => {
    if (!API_KEY) return "I'm sorry, the AI assistant is currently offline as the API key is not configured.";
    try {
        const parts: any[] = [{ text: `You are Vriksha, a friendly and knowledgeable plant care AI assistant for the "Vriksha Tracker" app. Keep your answers concise, helpful, and use emojis. User prompt: "${text}"` }];

        if (image) {
            const imagePart = await fileToGenerativePart(image);
            parts.unshift(imagePart);
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts }
        });
        return response.text;
    } catch (error) {
        console.error("Error in AI Chat:", error);
        return "I'm having a little trouble connecting right now. Please try again later.";
    }
};

// --- SOCIAL FEED AI ---
export const generatePostCaption = async (image: File): Promise<string> => {
    if (!API_KEY) return "My beautiful sapling! 🌱";
    try {
        const imagePart = await fileToGenerativePart(image);
        const prompt = "Analyze this image of a sapling. Write a short, enthusiastic, and creative social media caption for it (max 30 words). Include 1-2 relevant emojis like 🌱, 🌿, 💧, or 🌞.";
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating caption:", error);
        return "Enjoying a beautiful day with my sapling! 🌿";
    }
};
