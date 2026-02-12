// Export the auth middleware from the main auth instance
// This ensures middleware and API routes share the same session
export { auth as default } from "./src/auth";

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
