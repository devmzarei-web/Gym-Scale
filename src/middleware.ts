import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, NutriTrain.png, fonts, etc.
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|NutriTrain.png|NutriTrainLogo.png|fonts|sw.js).*)",
  ],
}
