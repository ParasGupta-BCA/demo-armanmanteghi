import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const result = await db.query("SELECT * FROM automation_settings WHERE user_id = $1", [session.user.id]);
    const settings = result.rows[0] || {};

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Automation Settings</h2>
            <SettingsForm settings={settings} />
        </div>
    );
}
