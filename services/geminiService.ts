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
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = (await response.json()) as { text?: string };
    return data.text?.trim() || "No text could be extracted.";
  } catch (error) {
    console.error("Error extracting text:", error);
    throw new Error("Failed to extract text from image.");
  } finally {
    clearTimeout(timeoutId);
  }
};
