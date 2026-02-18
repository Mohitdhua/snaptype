import { GoogleGenAI } from "@google/genai";

const PROMPT =
  "Extract the visible text from this image. Return ONLY the text found in the image. If the text is broken into paragraphs, preserve the paragraph breaks. Do not add any introductory or concluding remarks. If there is no text, return a default string: 'No text found in image.'";

type ExtractTextRequest = {
  base64Image?: string;
  mimeType?: string;
};

let aiClient: GoogleGenAI | null = null;

function getClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

function parseBody(body: unknown): ExtractTextRequest {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (typeof body === "object") {
    return body as ExtractTextRequest;
  }
  return {};
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { base64Image, mimeType } = parseBody(req.body);
    if (typeof base64Image !== "string" || typeof mimeType !== "string") {
      return res.status(400).json({ error: "base64Image and mimeType are required." });
    }
    if (!mimeType.startsWith("image/")) {
      return res.status(400).json({ error: "mimeType must be an image/* type." });
    }

    const base64Data = base64Image.split(",")[1] || base64Image;
    if (base64Data.length > 15_000_000) {
      return res.status(413).json({ error: "Image payload is too large." });
    }
    const client = getClient();
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: PROMPT },
        ],
      },
    });

    const text = response.text?.trim() || "No text could be extracted.";
    return res.status(200).json({ text });
  } catch (error) {
    console.error("extract-text error:", error);
    return res.status(500).json({ error: "Failed to extract text from image." });
  }
}
