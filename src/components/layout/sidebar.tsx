"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Video, Library, Settings, Activity, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/generate", label: "Generate Video", icon: Video },
    { href: "/dashboard/library", label: "Video Library", icon: Library },
    { href: "/dashboard/settings", label: "Automation", icon: Settings },
    { href: "/dashboard/logs", label: "Activity Logs", icon: Activity },
];

export function Sidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Mobile Sidebar Trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <div className="flex h-full flex-col p-4">
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl" onClick={() => setOpen(false)}>
                                <Video className="h-6 w-6 text-primary" />
                                <span>AutoVideo.ai</span>
                            </Link>
                        </div>
                        <NavLinks pathname={pathname} setOpen={setOpen} />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
                <div className="p-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                        <Video className="h-6 w-6 text-primary" />
                        <span>AutoVideo.ai</span>
                    </Link>
                </div>
                <div className="flex-1 px-4">
                    <NavLinks pathname={pathname} />
                </div>
            </aside>
        </>
    );
}

function NavLinks({ pathname, setOpen }: { pathname: string; setOpen?: (open: boolean) => void }) {
    return (
        <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen && setOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
