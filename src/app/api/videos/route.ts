import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await db.query(
            "SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC",
            [session.user.id]
        );

        return NextResponse.json({ videos: result.rows });
    } catch (error: any) {
        console.error("Error fetching videos:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch videos" },
            { status: 500 }
        );
    }
}
