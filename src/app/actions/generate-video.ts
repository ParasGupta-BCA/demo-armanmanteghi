"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateVideoContent } from "@/lib/gemini";
import { submitVideoJob } from "@/lib/ffmpeg";

const GenerateVideoSchema = z.object({
    niche: z.string().min(1, "Niche is required"),
    topic: z.string().min(1, "Topic is required"),
    tone: z.string().optional(),
    duration: z.coerce.number().min(5).max(300),
});

export type GenerateState = {
    errors?: {
        niche?: string[];
        topic?: string[];
        tone?: string[];
        duration?: string[];
    };
    message?: string | null;
    success?: boolean;
};

export async function generateVideo(prevState: GenerateState, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: "Unauthorized" };
    }

    const validatedFields = GenerateVideoSchema.safeParse({
        niche: formData.get("niche"),
        topic: formData.get("topic"),
        tone: formData.get("tone"),
        duration: formData.get("duration"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to generate video.",
        };
    }

    const { niche, topic, tone, duration } = validatedFields.data;

    try {
        // 1. Generate Content via Gemini
        const content = await generateVideoContent(niche, topic, tone || "engaging", duration);

        // 2. Submit to FFmpeg Service (mock for demo)
        const jobId = await submitVideoJob({
            script: content.script,
            images: content.image_prompts || [],
            duration: duration,
            width: 1080,
            height: 1920,
        });

        // 3. Save Video Record as COMPLETED (demo mode - no actual video processing)
        // In production, this would start as 'processing' and be updated by a webhook
        const mockVideoUrl = `https://storage.demo.com/videos/${jobId}.mp4`;

        await db.query(
            `INSERT INTO videos (user_id, title, script_content, description, hashtags, cta_text, status, video_url, ffmpeg_job_id, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, $8, $9)`,
            [
                session.user.id,
                content.title,
                content.script,
                content.description,
                content.hashtags,
                content.cta,
                mockVideoUrl,
                jobId,
                JSON.stringify({ ...content, niche, tone, duration, source: "manual" })
            ]
        );

        // 4. Log the activity
        await db.query(
            `INSERT INTO activity_logs (user_id, action_type, details) VALUES ($1, 'VIDEO_GENERATION_TRIGGERED', $2)`,
            [session.user.id, JSON.stringify({ topic, niche, jobId })]
        );

    } catch (error: any) {
        console.error("Video generation trigger error:", error);
        return {
            message: `Error: ${error.message || "Failed to trigger generation."}`,
        };
    }

    revalidatePath("/dashboard/library");
    return { success: true, message: "Video generation started successfully!" };
}
