"use client";

import { useActionState } from "react";
import { register } from "@/app/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { RegisterState } from "@/app/actions/register";

export default function SignupPage() {
    const initialState: RegisterState = { message: null, errors: {} };
    const [state, formAction, isPending] = useActionState(register, initialState);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                    <CardDescription className="text-center">
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" name="fullName" placeholder="John Doe" required aria-describedby="name-error" />
                            {state.errors?.fullName && (
                                <p id="name-error" className="text-sm text-red-500">
                                    {state.errors.fullName.join(", ")}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" name="email" placeholder="m@example.com" required aria-describedby="email-error" />
                            {state.errors?.email && (
                                <p id="email-error" className="text-sm text-red-500">
                                    {state.errors.email.join(", ")}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" name="password" required aria-describedby="password-error" />
                            {state.errors?.password && (
                                <p id="password-error" className="text-sm text-red-500">
                                    {state.errors.password.join(", ")}
                                </p>
                            )}
                        </div>
                        {state.message && (
                            <div className="text-sm text-red-500 font-medium">
                                {state.message}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account... </> : "Sign Up"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-sm text-muted-foreground">
                        Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
