import { db } from "@/lib/db";
import { generateVideoContent } from "@/lib/gemini";
import { submitVideoJob } from "@/lib/ffmpeg";
import { NextResponse } from "next/server";

export const maxDuration = 300; // Allow 5 minutes for cron execution

export async function GET(req: Request) {
    // Verify Cron secret if needed (e.g. for Vercel Cron)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    try {
        // 1. Get users with active automation and quota remaining
        const settings = await db.query(
            `SELECT * FROM automation_settings 
       WHERE is_active = TRUE 
       AND (last_run_at IS NULL OR last_run_at < CURRENT_DATE)`
        );

        if (settings.rows.length === 0) {
            return NextResponse.json({ message: "No scheduled videos due." });
        }

        const results = [];

        // 2. Process each user
        for (const setting of settings.rows) {
            try {
                // Generate logic
                const user_id = setting.user_id;
                const niche = setting.niche;
                const topic = setting.topic || `${setting.niche} trends 2024`;
                const tone = setting.tone || "engaging";
                const duration = setting.video_duration || 60;

                // A. Generate Content via Gemini
                const content = await generateVideoContent(niche, topic, tone, duration);

                // B. Submit to FFmpeg Service
                const jobId = await submitVideoJob({
                    script: content.script,
                    images: content.image_prompts || [],
                    duration: duration,
                    width: 1080,
                    height: 1920,
                });

                // C. Save Video Record
                await db.query(
                    `INSERT INTO videos (user_id, title, script_content, description, hashtags, cta_text, status, ffmpeg_job_id, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7, $8)`,
                    [
                        user_id,
                        content.title,
                        content.script,
                        content.description,
                        content.hashtags,
                        content.cta,
                        jobId,
                        JSON.stringify(content)
                    ]
                );

                // D. Update Settings (Last Run)
                await db.query(
                    "UPDATE automation_settings SET last_run_at = NOW() WHERE id = $1",
                    [setting.id]
                );

                // E. Log Activity
                await db.query(
                    `INSERT INTO activity_logs (user_id, action_type, details) VALUES ($1, 'SCHEDULED_GENERATION_SUCCESS', $2)`,
                    [user_id, JSON.stringify({ jobId, title: content.title })]
                );

                results.push({ userId: user_id, status: "success", jobId });

            } catch (err: any) {
                console.error(`Error processing user ${setting.user_id}:`, err);

                await db.query(
                    `INSERT INTO activity_logs (user_id, action_type, details) VALUES ($1, 'SCHEDULED_GENERATION_FAILED', $2)`,
                    [setting.user_id, JSON.stringify({ error: err.message })]
                );
                results.push({ userId: setting.user_id, status: "failed", error: err.message });
            }
        }

        return NextResponse.json({ processed: results.length, details: results });
    } catch (error: any) {
        console.error("Cron Job Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
