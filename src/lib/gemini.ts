import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export interface VideoContent {
    script: string;
    hook: string;
    title: string;
    description: string;
    hashtags: string[];
    cta: string;
    image_prompts: string[];
}

export async function generateVideoContent(
    niche: string,
    topic: string,
    tone: string = "engaging",
    duration: number = 60
): Promise<VideoContent> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Create a viral ${duration}-second vertical video script for TikTok/Reels/Shorts.
    
    Niche: ${niche}
    Topic: ${topic}
    Tone: ${tone}

    Return ONLY a JSON object with the following structure (no markdown, no extra text):
    {
      "script": "The spoken script for the video. Keep it paced for ${duration} seconds.",
      "hook": "A catchy 3-second hook to start the video.",
      "title": "A clickbait but relevant title.",
      "description": "A short video description.",
      "hashtags": ["list", "of", "5", "hashtags"],
      "cta": "A strong Call to Action.",
      "image_prompts": ["list of 3-5 visual prompts for an AI image generator to match the script scenes"]
    }
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up markdown if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText) as VideoContent;
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        throw new Error("Failed to generate video content");
    }
}
