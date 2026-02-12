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

// Fallback mock content generator for when API fails
function generateMockContent(niche: string, topic: string, tone: string, duration: number): VideoContent {
    return {
        script: `Welcome to this ${duration}-second video about ${topic} in the ${niche} niche! This is a demo script generated as a placeholder. In a real implementation, this would be AI-generated content tailored to your specific topic with a ${tone} tone. The script would be perfectly timed for ${duration} seconds of engaging content.`,
        hook: `🔥 You won't believe this ${niche} secret!`,
        title: `${topic} - Must Watch!`,
        description: `Discover everything about ${topic} in this quick ${duration}-second video. Perfect for ${niche} enthusiasts!`,
        hashtags: [niche.toLowerCase(), topic.toLowerCase().replace(/\s+/g, ''), tone.toLowerCase(), "viral", "trending"],
        cta: `Follow for more ${niche} content!`,
        image_prompts: [
            `Eye-catching thumbnail for ${topic}`,
            `Visual representation of ${niche} concept`,
            `Engaging scene related to ${topic}`,
            `Call-to-action graphic with text overlay`
        ]
    };
}

export async function generateVideoContent(
    niche: string,
    topic: string,
    tone: string = "engaging",
    duration: number = 60
): Promise<VideoContent> {
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set - using mock content");
        return generateMockContent(niche, topic, tone, duration);
    }

    console.log("Initializing Gemini AI...");

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Try gemini-1.5-pro (latest) first
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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
        console.error("Gemini API failed, using mock content instead:", error.message);
        // Fallback to mock content instead of throwing error
        return generateMockContent(niche, topic, tone, duration);
    }
}
