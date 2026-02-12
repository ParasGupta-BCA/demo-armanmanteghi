import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { badgeVariants } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Copy, Play, Loader2, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import Image from "next/image";

async function getVideos(userId: string) {
    const result = await db.query(
        "SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
    );
    return result.rows;
}

export default async function LibraryPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const videos = await getVideos(session.user.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Video Library</h2>
                <Button variant="outline">Refresh</Button>
            </div>

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
                                        {video.status === 'failed' && (
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
                                            {video.status === 'completed' && (
                                                <Button size="icon" variant="ghost" title="Download">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button size="icon" variant="ghost" title="Copy Script">
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
