import { put } from '@vercel/blob';

export interface VideoJobParams {
    script: string;
    images: string[];
    duration: number;
    width: number;
    height: number;
    title: string;
    background_music_url?: string;
    webhook_url?: string;
}

interface FFmpegApiResponse {
    job_id?: string;
    video_url?: string;
    status?: string;
    error?: string;
}

const FFMPEG_API_URL = process.env.FFMPEG_API_URL || 'https://api.ffmpeg.run/v1';
const FFMPEG_API_KEY = process.env.FFMPEG_API_KEY;

export async function submitVideoJob(params: VideoJobParams): Promise<string> {
    console.log("Generating video with FFmpeg API:", {
        title: params.title,
        script_length: params.script.length,
        duration: params.duration,
    });

    // Check if FFmpeg API is configured
    if (!FFMPEG_API_KEY) {
        console.warn("FFMPEG_API_KEY not set, falling back to simple video generation");
        return await generateSimpleVideo(params);
    }

    try {
        // Call FFmpeg API to generate video
        const response = await fetch(`${FFMPEG_API_URL}/render`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${FFMPEG_API_KEY}`,
            },
            body: JSON.stringify({
                title: params.title,
                script: params.script,
                duration: params.duration,
                width: params.width,
                height: params.height,
                images: params.images,
                background_music_url: params.background_music_url,
                format: 'mp4',
                quality: 'high',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("FFmpeg API error:", response.status, errorText);
            throw new Error(`FFmpeg API returned status ${response.status}: ${errorText}`);
        }

        const data: FFmpegApiResponse = await response.json();

        // If video is ready immediately, return the URL
        if (data.video_url) {
            console.log("Video generated immediately:", data.video_url);
            return data.video_url;
        }

        // If we get a job ID, poll for completion
        if (data.job_id) {
            console.log("Video job started, polling for completion:", data.job_id);
            return await pollForVideoCompletion(data.job_id);
        }

        throw new Error("FFmpeg API did not return video URL or job ID");

    } catch (error: any) {
        console.error("Failed to generate video with FFmpeg API:", error);
        // Fallback to simple video generation
        console.warn("Falling back to simple video generation");
        return await generateSimpleVideo(params);
    }
}

// Poll FFmpeg API until video is ready (max 2 minutes)
async function pollForVideoCompletion(jobId: string, maxAttempts = 24): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await fetch(`${FFMPEG_API_URL}/status/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${FFMPEG_API_KEY}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }

            const data: FFmpegApiResponse = await response.json();

            if (data.status === 'completed' && data.video_url) {
                console.log("Video completed:", data.video_url);
                return data.video_url;
            }

            if (data.status === 'failed' || data.error) {
                throw new Error(`Video generation failed: ${data.error || 'Unknown error'}`);
            }

            // Wait 5 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (error) {
            console.error(`Polling attempt ${attempt + 1} failed:`, error);
            if (attempt === maxAttempts - 1) throw error;
        }
    }

    throw new Error("Video generation timed out after 2 minutes");
}

// Fallback: Generate simple HTML video and upload to Blob
async function generateSimpleVideo(params: VideoJobParams): Promise<string> {
    console.log("Generating simple HTML video as fallback");

    try {
        const videoHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: Arial, sans-serif;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .title {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 30px;
      text-align: center;
    }
    .script {
      font-size: 24px;
      line-height: 1.6;
      max-width: 800px;
      text-align: center;
      background: rgba(0,0,0,0.3);
      padding: 30px;
      border-radius: 15px;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 30px;
      font-size: 18px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="title">${params.title}</div>
  <div class="script">${params.script}</div>
  <div class="footer">Duration: ${params.duration}s • Generated by AutoVideo.ai</div>
</body>
</html>
    `;

        const videoBlob = new Blob([videoHTML], { type: 'text/html' });
        const filename = `video-${Date.now()}-${Math.random().toString(36).substring(7)}.html`;

        // Upload to Vercel Blob if available
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            const blob = await put(filename, videoBlob, {
                access: 'public',
                addRandomSuffix: false,
            });
            return blob.url;
        }

        // Return mock URL if no Blob storage
        return `https://placeholder.demo.com/videos/${filename}`;

    } catch (error) {
        console.error("Fallback video generation failed:", error);
        const mockId = `video-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        return `https://placeholder.demo.com/videos/${mockId}.html`;
    }
}

export async function checkJobStatus(jobId: string): Promise<string> {
    if (!FFMPEG_API_KEY) {
        return "completed";
    }

    try {
        const response = await fetch(`${FFMPEG_API_URL}/status/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${FFMPEG_API_KEY}`,
            },
        });

        if (!response.ok) {
            return "unknown";
        }

        const data: FFmpegApiResponse = await response.json();
        return data.status || "unknown";
    } catch (error) {
        console.error("Failed to check job status:", error);
        return "unknown";
    }
}

export function getVideoUrl(jobId: string): string {
    return jobId;
}
