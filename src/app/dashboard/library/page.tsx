"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Copy, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Video {
    id: string;
    title: string;
    script_content: string;
    description: string;
    hashtags: string[];
    status: string;
    video_url: string | null;
    thumbnail_url: string | null;
    created_at: string;
    metadata: any;
    error_message?: string;
}

export default function LibraryPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVideos = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/videos');
            if (!response.ok) {
                throw new Error('Failed to fetch videos');
            }
            const data = await response.json();
            setVideos(data.videos || []);
        } catch (err: any) {
            console.error('Error fetching videos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleCopyScript = (script: string) => {
        navigator.clipboard.writeText(script);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Video Library</h2>
                <Button variant="outline" onClick={fetchVideos}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4 text-red-800">
                    Error loading videos: {error}
                </div>
            )}

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Preview</TableHead>
                            <TableHead>Topic / Script</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {videos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No videos found. Generate one to get started!
                                </TableCell>
                            </TableRow>
                        ) : (
                            videos.map((video) => (
                                <TableRow key={video.id}>
                                    <TableCell>
                                        <div className="relative h-16 w-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                                            {video.thumbnail_url ? (
                                                <img src={video.thumbnail_url} alt="Thumbnail" className="object-cover h-full w-full" />
                                            ) : (
                                                <div className="text-xs text-muted-foreground">No Preview</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium truncate max-w-[200px] mb-1">
                                            {video.metadata?.topic || video.title || "Untitled Video"}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                                            {video.metadata?.niche} • {video.metadata?.duration}s
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            video.status === 'completed' ? 'default' :
                                                video.status === 'processing' ? 'secondary' :
                                                    video.status === 'failed' ? 'destructive' : 'outline'
                                        }>
                                            {video.status === 'processing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                            {video.status}
                                        </Badge>
                                        {video.status === 'failed' && video.error_message && (
                                            <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={video.error_message}>
                                                {video.error_message}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(video.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {video.status === 'completed' && video.video_url && (
                                                <Link href={video.video_url} target="_blank" download>
                                                    <Button size="icon" variant="ghost" title="Download Video">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            )}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                title="Copy Script"
                                                onClick={() => handleCopyScript(video.script_content)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
