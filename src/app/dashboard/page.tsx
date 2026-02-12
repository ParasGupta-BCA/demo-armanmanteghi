import { auth } from "@/auth";
import { db } from "@/lib/db";
import { StatsCard } from "@/components/dashboard/stats-cards";
import { Video, Activity, Zap, Clock } from "lucide-react";
import { redirect } from "next/navigation";

async function getStats(userId: string) {
    // Parallelize queries for better performance
    const [videoCountRes, recentActivityRes, settingsRes] = await Promise.all([
        db.query("SELECT COUNT(*) FROM videos WHERE user_id = $1", [userId]),
        db.query("SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5", [userId]),
        db.query("SELECT * FROM automation_settings WHERE user_id = $1", [userId])
    ]);

    return {
        totalVideos: videoCountRes.rows[0].count,
        recentActivity: recentActivityRes.rows,
        settings: settingsRes.rows[0]
    };
}

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const stats = await getStats(session.user.id);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Overview</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Videos"
                    value={stats.totalVideos}
                    icon={Video}
                    description="All time generated videos"
                />
                <StatsCard
                    title="Daily Limit"
                    value={stats.settings?.videos_per_day?.toString() || "0"}
                    icon={Zap}
                    description="Videos per day quota"
                />
                <StatsCard
                    title="Avg Duration"
                    value={stats.settings?.video_duration ? `${stats.settings.video_duration}s` : "60s"}
                    icon={Clock}
                    description="Target video length"
                />
                <StatsCard
                    title="Active Status"
                    value={stats.settings?.is_active ? "Active" : "Paused"}
                    icon={Activity}
                    description="Automation system status"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    {/* We can add a chart here later */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow h-[300px] flex items-center justify-center text-muted-foreground">
                        Chart Placeholder
                    </div>
                </div>
                <div className="col-span-3">
                    {/* We can add recent activity list here */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow h-[300px] p-6">
                        <h3 className="font-semibold leading-none tracking-tight mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {stats.recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent activity.</p>
                            ) : (
                                stats.recentActivity.map((log: any) => (
                                    <div key={log.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{log.action_type}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
