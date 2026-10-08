import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const cleanBaseUrl = baseUrl.replace("0.0.0.0", "localhost")
      if (url.startsWith("/")) {
        return `${cleanBaseUrl}${url}`
      }
      try {
        const parsed = new URL(url)
        if (parsed.hostname === "0.0.0.0") {
          parsed.hostname = "localhost"
          return parsed.toString()
        }
        return url
      } catch {
        return cleanBaseUrl
      }
    },
    authorized({ auth, request: { nextUrl, headers } }) {
      const isLoggedIn = !!auth?.user
      const role = (auth?.user as any)?.role
      const pathname = nextUrl.pathname

      const getSafeUrl = (targetPath: string) => {
        const url = new URL(targetPath, nextUrl)
        if (url.hostname === "0.0.0.0") {
          const reqHost = headers.get("host") || "localhost:3000"
          const cleanHost = reqHost.startsWith("0.0.0.0") ? reqHost.replace("0.0.0.0", "localhost") : reqHost
          url.host = cleanHost
        }
        return url
      }

      const isPublicApi = pathname.startsWith("/api/trainers/public")
      const isAccessDenied = pathname.startsWith("/access-denied")
      const isExpiredPage = pathname.startsWith("/subscription-expired")
      const isOnLogin = pathname.startsWith("/login")

      if (isPublicApi || isAccessDenied || isExpiredPage) {
        return true
      }

      if (isOnLogin) {
        if (isLoggedIn) {
          if (role === "CLIENT") {
            return Response.redirect(getSafeUrl("/client"))
          }
          return Response.redirect(getSafeUrl("/"))
        }
        return true
      }

      if (!isLoggedIn) {
        return Response.redirect(getSafeUrl("/login"))
      }

      // Role-Based Access Control (RBAC)
      if (role === "TRAINER") {
        // System administration is reserved exclusively for SUPER_ADMIN
        if (pathname.startsWith("/admin")) {
          return Response.redirect(getSafeUrl("/access-denied"))
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
          return Response.redirect(getSafeUrl("/access-denied"))
        }

        if (pathname === "/") {
          return Response.redirect(getSafeUrl("/client"))
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
