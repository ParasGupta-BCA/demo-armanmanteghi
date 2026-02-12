import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Create a separate auth instance for Edge Runtime (middleware)
// This instance does NOT have database or bcryptjs - only the edge-compatible config
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
