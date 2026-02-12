"use client";

import { useActionState, useEffect } from "react";
import { generateVideo } from "@/app/actions/generate-video";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GenerateState } from "@/app/actions/generate-video";

export default function GeneratePage() {
    const initialState: GenerateState = { message: null, errors: {} };
    const [state, formAction, isPending] = useActionState(generateVideo, initialState);
    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            toast.success(state.message);
            router.push("/dashboard/library");
        } else if (state.message) {
            toast.error(state.message);
        }
    }, [state, router]);

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-6">Generate Video</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Video</CardTitle>
                    <CardDescription>
                        Manually trigger a video generation based on your inputs.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="niche">Niche</Label>
                                <Input id="niche" name="niche" placeholder="e.g., Tech, Health, Finance" required />
                                {state.errors?.niche && (
                                    <p className="text-sm text-red-500">{state.errors.niche.join(", ")}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tone">Tone</Label>
                                <Select name="tone" defaultValue="engaging">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select tone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="engaging">Engaging</SelectItem>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="funny">Funny</SelectItem>
                                        <SelectItem value="dramatic">Dramatic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="topic">Topic</Label>
                            <Input id="topic" name="topic" placeholder="e.g., Top 5 AI Tools in 2024" required />
                            {state.errors?.topic && (
                                <p className="text-sm text-red-500">{state.errors.topic.join(", ")}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (seconds)</Label>
                            <Select name="duration" defaultValue="60">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 Seconds</SelectItem>
                                    <SelectItem value="30">30 Seconds</SelectItem>
                                    <SelectItem value="60">60 Seconds (1 min)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating... </> : "Generate Video"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
