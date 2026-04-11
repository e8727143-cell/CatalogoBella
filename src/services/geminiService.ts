import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function tryOnShoe(footImageBase64: string, shoeImageUrl: string, shoeName: string) {
  try {
    // Using gemini-3.1-flash-image-preview which is specifically designed for high-quality image generation and editing
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: footImageBase64.split(',')[1],
              mimeType: "image/jpeg",
            },
          },
          {
            text: `I am providing a photo of a person's feet. I want you to generate a NEW image where the person is wearing the specific shoes described below. 

SHOE TO WEAR: ${shoeName}
SHOE REFERENCE IMAGE: ${shoeImageUrl}

INSTRUCTIONS:
1. Identify the position and orientation of the feet in the provided photo.
2. Replace the feet/socks/existing shoes with the ${shoeName} shown in the reference image.
3. Ensure the lighting, shadows, and perspective of the shoes match the original photo perfectly for a hyper-realistic look.
4. The person should look like they are actually wearing the shoes.
5. Return ONLY the final generated image in the response.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    // If no inlineData was found, check if there's text explaining why (sometimes happens with safety filters)
    const textPart = response.candidates[0].content.parts.find(p => p.text);
    if (textPart) {
      throw new Error(`Model returned text instead of image: ${textPart.text}`);
    }

    throw new Error("No image data found in the response");
  } catch (error) {
    console.error("Error in tryOnShoe:", error);
    throw error;
  }
}
