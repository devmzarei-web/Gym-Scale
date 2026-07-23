import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const role = (auth?.user as any)?.role
      const pathname = nextUrl.pathname

      const isPublicApi = pathname.startsWith("/api/trainers/public")
      const isAccessDenied = pathname.startsWith("/access-denied")
      const isOnLogin = pathname.startsWith("/login")

      if (isPublicApi || isAccessDenied) {
        return true
      }

      if (isOnLogin) {
        if (isLoggedIn) {
          if (role === "CLIENT") {
            return Response.redirect(new URL("/client", nextUrl))
          }
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl))
      }

      // Role-Based Access Control (RBAC)
      if (role === "TRAINER") {
        // System administration is reserved exclusively for SUPER_ADMIN
        if (pathname.startsWith("/admin")) {
          return Response.redirect(new URL("/access-denied", nextUrl))
        }
      }

      if (role === "CLIENT") {
        const isPdfRoute = pathname.includes("/pdf")

        if (isPdfRoute) {
          return true
        }

        const isTrainerOrAdminRoute =
          pathname.startsWith("/admin") ||
          pathname.startsWith("/clients") ||
          pathname.startsWith("/exercises") ||
          pathname.startsWith("/recipes") ||
          pathname.endsWith("/new") ||
          pathname.endsWith("/edit")

        if (isTrainerOrAdminRoute) {
          return Response.redirect(new URL("/access-denied", nextUrl))
        }

        if (pathname === "/") {
          return Response.redirect(new URL("/client", nextUrl))
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.isDemo = (user as any).isDemo
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).isDemo = token.isDemo
      }
      return session
    },
  },
  providers: [],
}
