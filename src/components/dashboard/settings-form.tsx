"use client";

import { useActionState, useEffect } from "react";
import { updateSettings, SettingsState } from "@/app/actions/update-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SettingsForm({ settings }: { settings: any }) {
    const initialState: SettingsState = { message: null, errors: {} };
    const [state, formAction, isPending] = useActionState(updateSettings, initialState);

    useEffect(() => {
        if (state.success) {
            toast.success(state.message);
        } else if (state.message) {
            toast.error(state.message);
        }
    }, [state]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configure Automation</CardTitle>
                <CardDescription>
                    Set your preferences for automatic video generation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable Automation</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically generate videos based on schedule.
                            </p>
                        </div>
                        <Switch name="isActive" defaultChecked={settings.is_active} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="niche">Niche</Label>
                            <Input id="niche" name="niche" defaultValue={settings.niche} placeholder="e.g., Tech, Health" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tone">Tone</Label>
                            <Select name="tone" defaultValue={settings.tone || "engaging"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="engaging">Engaging</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="funny">Funny</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="topic">Topic (Optional)</Label>
                        <Input id="topic" name="topic" defaultValue={settings.topic} placeholder="Specific topic or leave empty for AI decision" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="duration">Target Duration (seconds)</Label>
                            <Select name="duration" defaultValue={settings.video_duration?.toString() || "60"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 Seconds</SelectItem>
                                    <SelectItem value="30">30 Seconds</SelectItem>
                                    <SelectItem value="60">60 Seconds</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="videosPerDay">Videos Per Day</Label>
                            <Input id="videosPerDay" name="videosPerDay" type="number" min="1" max="10" defaultValue={settings.videos_per_day || 1} required />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving... </> : "Save Settings"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
