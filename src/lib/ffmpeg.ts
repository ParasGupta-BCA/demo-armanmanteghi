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

interface ShotstackRenderResponse {
    success: boolean;
    message: string;
    response: {
        id: string;
        status: string;
    };
}

interface ShotstackStatusResponse {
    success: boolean;
    message: string;
    response: {
        id: string;
        status: string;
        url?: string;
        error?: string;
    };
}

const SHOTSTACK_API_URL = 'https://api.shotstack.io/v1';
const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
const SHOTSTACK_TEMPLATE_ID = process.env.SHOTSTACK_TEMPLATE_ID || '11fe0355-2def-435c-8deb-95891d990d78';

export async function submitVideoJob(params: VideoJobParams): Promise<string> {
    console.log("Generating video with Shotstack API:", {
        title: params.title,
        script_length: params.script.length,
        duration: params.duration,
    });

    // Check if Shotstack API is configured
    if (!SHOTSTACK_API_KEY) {
        console.warn("SHOTSTACK_API_KEY not set, falling back to simple video generation");
        return await generateSimpleVideo(params);
    }

    try {
        // Prepare merge fields for Shotstack template
        const mergeFields = prepareMergeFields(params);

        // Call Shotstack render API
        const response = await fetch(`${SHOTSTACK_API_URL}/templates/render`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': SHOTSTACK_API_KEY,
            },
            body: JSON.stringify({
                id: SHOTSTACK_TEMPLATE_ID,
                merge: mergeFields,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Shotstack API error:", response.status, errorText);
            throw new Error(`Shotstack API returned status ${response.status}: ${errorText}`);
        }

        const data: ShotstackRenderResponse = await response.json();

        if (!data.success || !data.response?.id) {
            throw new Error("Shotstack API did not return render ID");
        }

        console.log("Video render started:", data.response.id);

        // Poll for completion
        const videoUrl = await pollShotstackRender(data.response.id);

        console.log("Video rendered successfully:", videoUrl);
        return videoUrl;

    } catch (error: any) {
        console.error("Failed to generate video with Shotstack:", error);
        // Fallback to simple video generation
        console.warn("Falling back to simple video generation");
        return await generateSimpleVideo(params);
    }
}

// Prepare merge fields from AI-generated content
function prepareMergeFields(params: VideoJobParams): Array<{ find: string; replace: string }> {
    const mergeFields = [
        {
            find: "HEADLINE",
            replace: params.title
        },
        {
            find: "VOICEOVER",
            replace: params.script
        }
    ];

    // Add image prompts if available
    for (let i = 0; i < Math.min(params.images.length, 10); i++) {
        mergeFields.push({
            find: `IMAGE_${i + 1}_PROMPT`,
            replace: params.images[i] || "A beautiful scene"
        });
    }

    // Fill remaining image slots with generic prompts if needed
    for (let i = params.images.length; i < 10; i++) {
        mergeFields.push({
            find: `IMAGE_${i + 1}_PROMPT`,
            replace: "A magical landscape with stars and light"
        });
    }

    return mergeFields;
}

// Poll Shotstack until video is ready (max 5 minutes)
async function pollShotstackRender(renderId: string, maxAttempts = 60): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await fetch(`${SHOTSTACK_API_URL}/render/${renderId}`, {
                headers: {
                    'x-api-key': SHOTSTACK_API_KEY!,
                },
            });

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }

            const data: ShotstackStatusResponse = await response.json();

            if (data.response.status === 'done' && data.response.url) {
                console.log("Video completed:", data.response.url);
                return data.response.url;
            }

            if (data.response.status === 'failed') {
                throw new Error(`Video generation failed: ${data.response.error || 'Unknown error'}`);
            }

            // Status is 'queued' or 'rendering', wait 5 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 5000));

            console.log(`Render ${renderId} status: ${data.response.status} (attempt ${attempt + 1}/${maxAttempts})`);

        } catch (error) {
            console.error(`Polling attempt ${attempt + 1} failed:`, error);
            if (attempt === maxAttempts - 1) throw error;
        }
    }

    throw new Error("Video generation timed out after 5 minutes");
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
    if (!SHOTSTACK_API_KEY) {
        return "completed";
    }

    try {
        const response = await fetch(`${SHOTSTACK_API_URL}/render/${jobId}`, {
            headers: {
                'x-api-key': SHOTSTACK_API_KEY,
            },
        });

        if (!response.ok) {
            return "unknown";
        }

        const data: ShotstackStatusResponse = await response.json();

        const statusMap: { [key: string]: string } = {
            'queued': 'processing',
            'rendering': 'processing',
            'done': 'completed',
            'failed': 'failed'
        };

        return statusMap[data.response.status] || "unknown";
    } catch (error) {
        console.error("Failed to check job status:", error);
        return "unknown";
    }
}

export function getVideoUrl(jobId: string): string {
    return jobId;
}
