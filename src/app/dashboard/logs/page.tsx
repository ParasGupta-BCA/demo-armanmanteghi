import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { redirect } from "next/navigation";

async function getLogs(userId: string) {
    const result = await db.query(
        "SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
        [userId]
    );
    return result.rows;
}

export default async function LogsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const logs = await getLogs(session.user.id);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Activity Logs</h2>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="text-right">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No activity recorded yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.action_type}</TableCell>
                                    <TableCell>
                                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-w-[400px] overflow-hidden">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {new Date(log.created_at).toLocaleString()}
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
