import NextAuth from "next-auth";
import { authConfig } from "../auth.config";
import { apiAuthConfig } from "./auth-providers";

// Merge the Edge-compatible config with the API-only providers
export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    ...apiAuthConfig,
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
    },
});
