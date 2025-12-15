import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key no configurada.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeImageContent = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // We use the vision-capable flash model for speed and efficiency
    const modelId = "gemini-2.5-flash"; 

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Describe esta imagen brevemente en una sola frase concisa en español para usarla como pie de foto en un documento PDF. Sé directo."
          }
        ]
      }
    });

    return response.text?.trim() || "Descripción no disponible.";
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
};