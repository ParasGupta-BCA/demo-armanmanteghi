import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

export async function Header() {
    const session = await auth();
    const user = session?.user;

    return (
        <header className="flex h-16 items-center justify-between border-b px-6 bg-card">
            <div className="lg:hidden w-6" /> {/* Spacer for mobile menu trigger */}
            <h1 className="font-semibold text-lg hidden lg:block">Dashboard</h1>

            <div className="flex items-center gap-4 ml-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                                <AvatarFallback>{user?.email?.[0]?.toUpperCase() || <User className="h-4 w-4" />}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <form action={async () => {
                                "use server"
                                await signOut();
                            }} className="w-full">
                                <button type="submit" className="w-full text-left">Log out</button>
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
