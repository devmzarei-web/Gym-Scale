import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = String(credentials.email).trim()
        const password = String(credentials.password)

        // Find trainer or client in DB
        let user: any = await prisma.trainer.findUnique({
          where: { email },
        })

        if (!user) {
          user = await prisma.client.findUnique({
            where: { email },
          })
        }

        if (!user || !user.password) {
          return null
        }

        // Compare password with hashed password
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
          return null
        }

        // Check if trainer account is approved by SuperAdmin
        if (user.role === "TRAINER" && user.isApproved === false) {
          throw new Error("حساب مربیگری شما در انتظار تایید مدیریت ارشد سیستم قرار دارد.")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "CLIENT",
          isDemo: user.isDemo ?? false,
        } as any
      },
    }),
  ],
})
