import { GoogleGenerativeAI } from "@google/generative-ai";

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
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set in environment variables");
        throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    console.log("Initializing Gemini AI...");

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

        console.log("Sending request to Gemini API...");
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log("Received response from Gemini API");

        // Clean up markdown if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(cleanText) as VideoContent;
        console.log("Successfully parsed video content");

        return parsed;
    } catch (error: any) {
        console.error("Gemini Generation Error Details:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
        });
        throw new Error(`Failed to generate video content: ${error.message}`);
    }
}
