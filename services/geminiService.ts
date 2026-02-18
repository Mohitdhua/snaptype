export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("/api/extract-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        base64Image,
        mimeType,
      }),
    });

    if (!response.ok) {
      let message = `OCR request failed (${response.status}).`;
      try {
        const data = (await response.json()) as { error?: string };
        if (data?.error) {
          message = data.error;
        }
      } catch {
        // Ignore parse errors and keep fallback message.
      }
      throw new Error(message);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("OCR API returned an unexpected response. If running locally, use `vercel dev` for API routes.");
    }

    const data = (await response.json()) as { text?: string; error?: string };
    if (data.error) {
      throw new Error(data.error);
    }
    return data.text?.trim() || "No text could be extracted.";
  } catch (error) {
    console.error("Error extracting text:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to extract text from image.");
  } finally {
    clearTimeout(timeoutId);
  }
};
