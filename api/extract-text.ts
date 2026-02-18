import { GoogleGenAI } from "@google/genai";

const PROMPT =
  "Extract the visible text from this image. Return ONLY the text found in the image. If the text is broken into paragraphs, preserve the paragraph breaks. Do not add any introductory or concluding remarks. If there is no text, return a default string: 'No text found in image.'";

type ExtractTextRequest = {
  base64Image?: string;
  mimeType?: string;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { json: (payload: unknown) => void };
};

let aiClient: GoogleGenAI | null = null;
const OCR_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
const SUPPORTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

type ApiErrorLike = {
  status?: number;
  message?: string;
};

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

function parseApiError(error: unknown): { status?: number; message: string } {
  const fallback = "Failed to extract text from image.";
  if (!error || typeof error !== "object") {
    return { message: fallback };
  }

  const candidate = error as ApiErrorLike;
  return {
    status: typeof candidate.status === "number" ? candidate.status : undefined,
    message: typeof candidate.message === "string" ? candidate.message : fallback,
  };
}

const isRetryableStatus = (status?: number) => status === 429 || status === 503;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { base64Image, mimeType } = parseBody(req.body);
    if (typeof base64Image !== "string" || typeof mimeType !== "string") {
      return res.status(400).json({ error: "base64Image and mimeType are required." });
    }
    if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({ error: "Unsupported image type. Please use PNG, JPG, or WEBP." });
    }

    const base64Data = base64Image.split(",")[1] || base64Image;
    if (base64Data.length > 15_000_000) {
      return res.status(413).json({ error: "Image payload is too large." });
    }
    const client = getClient();
    const parts = [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: PROMPT },
    ];

    let response: Awaited<ReturnType<typeof client.models.generateContent>> | null = null;
    let lastError: { status?: number; message: string } | null = null;

    for (const model of OCR_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await client.models.generateContent({
            model,
            contents: { parts },
          });
          break;
        } catch (error) {
          const parsed = parseApiError(error);
          lastError = parsed;
          if (isRetryableStatus(parsed.status) && attempt === 0) {
            await sleep(500);
            continue;
          }
          if (!isRetryableStatus(parsed.status)) {
            throw error;
          }
        }
      }
      if (response) break;
    }

    if (!response) {
      const status = lastError?.status ?? 500;
      if (status === 429 || status === 503) {
        return res.status(503).json({ error: "OCR service is busy right now. Please retry in a few seconds." });
      }
      throw new Error(lastError?.message || "Failed to extract text from image.");
    }

    const text = response.text?.trim() || "No text could be extracted.";
    return res.status(200).json({ text });
  } catch (error) {
    console.error("extract-text error:", error);
    const parsed = parseApiError(error);
    if (parsed.message.includes("Missing GEMINI_API_KEY")) {
      return res.status(500).json({ error: "Server OCR is not configured. Add GEMINI_API_KEY in environment variables." });
    }
    if (parsed.status === 400) {
      return res.status(400).json({ error: "Unable to process this image. Try a clear PNG/JPG/WEBP image." });
    }
    if (parsed.status === 429 || parsed.status === 503) {
      return res.status(503).json({ error: "OCR service is busy right now. Please retry in a few seconds." });
    }
    return res.status(500).json({ error: "Failed to extract text from image." });
  }
}
