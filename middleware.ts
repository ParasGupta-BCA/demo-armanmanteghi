import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Middleware uses ONLY the Edge-compatible config
// It does NOT import auth-providers.ts (which has database)
export default NextAuth(authConfig).auth;

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
