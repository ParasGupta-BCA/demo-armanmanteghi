"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const SettingsSchema = z.object({
    niche: z.string().min(1, "Niche is required"),
    topic: z.string().optional(),
    tone: z.string().optional(),
    duration: z.coerce.number().min(5).max(300),
    videosPerDay: z.coerce.number().min(1).max(10),
    isActive: z.coerce.boolean(),
});

export type SettingsState = {
    errors?: {
        niche?: string[];
        topic?: string[];
        tone?: string[];
        duration?: string[];
        videosPerDay?: string[];
    };
    message?: string | null;
    success?: boolean;
};

export async function updateSettings(prevState: SettingsState, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: "Unauthorized" };
    }

    const validatedFields = SettingsSchema.safeParse({
        niche: formData.get("niche"),
        topic: formData.get("topic"),
        tone: formData.get("tone"),
        duration: formData.get("duration"),
        videosPerDay: formData.get("videosPerDay"),
        isActive: formData.get("isActive") === "on",
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Invalid configuration.",
        };
    }

    const { niche, topic, tone, duration, videosPerDay, isActive } = validatedFields.data;

    try {
        await db.query(
            `INSERT INTO automation_settings (user_id, niche, topic, tone, video_duration, videos_per_day, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         niche = EXCLUDED.niche,
         topic = EXCLUDED.topic,
         tone = EXCLUDED.tone,
         video_duration = EXCLUDED.video_duration,
         videos_per_day = EXCLUDED.videos_per_day,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()`,
            [session.user.id, niche, topic, tone, duration, videosPerDay, isActive]
        );

        await db.query(
            `INSERT INTO activity_logs (user_id, action_type, details) VALUES ($1, 'SETTINGS_UPDATED', $2)`,
            [session.user.id, JSON.stringify({ niche, videosPerDay, isActive })]
        );

    } catch (error) {
        console.error("Settings update error:", error);
        return {
            message: "Database Error: Failed to update settings.",
        };
    }

    revalidatePath("/dashboard");
    return { success: true, message: "Settings updated successfully!" };
}
