import { GoogleGenAI } from "@google/genai";

// Lazy initialization to avoid crashes on module load if env vars aren't ready
let ai: GoogleGenAI | null = null;

const getAi = () => {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const client = getAi();
    // Remove header from base64 string if present (e.g., "data:image/png;base64,")
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Extract the visible text from this image. Return ONLY the text found in the image. If the text is broken into paragraphs, preserve the paragraph breaks. Do not add any introductory or concluding remarks. If there is no text, return a default string: 'No text found in image.'"
          }
        ]
      }
    });

    return response.text?.trim() || "No text could be extracted.";
  } catch (error) {
    console.error("Error extracting text:", error);
    throw new Error("Failed to extract text from image.");
  }
};