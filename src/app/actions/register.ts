"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const RegisterSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
});

export type RegisterState = {
    errors?: {
        email?: string[];
        password?: string[];
        fullName?: string[];
    };
    message?: string | null;
};

export async function register(prevState: RegisterState, formData: FormData) {
    const validatedFields = RegisterSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        fullName: formData.get("fullName"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Register.",
        };
    }

    const { email, password, fullName } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Check if user exists
        const existingUser = await db.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return {
                message: "Email already in use.",
            };
        }

        await db.query(
            "INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3)",
            [email, hashedPassword, fullName]
        );
    } catch (error) {
        console.error("Registration error:", error);
        return {
            message: "Database Error: Failed to Register.",
        };
    }

    redirect("/login");
}
