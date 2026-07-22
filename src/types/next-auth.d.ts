import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "SUPER_ADMIN" | "TRAINER" | "CLIENT"
      isDemo?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: "SUPER_ADMIN" | "TRAINER" | "CLIENT"
    isDemo?: boolean
  }
}
