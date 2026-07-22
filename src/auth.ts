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

        // Find trainer/user in DB
        const trainer = await prisma.trainer.findUnique({
          where: { email },
        })

        if (!trainer) {
          return null
        }

        // Compare password with hashed password
        const isValid = await bcrypt.compare(password, trainer.password)
        if (!isValid) {
          return null
        }

        return {
          id: trainer.id,
          name: trainer.name,
          email: trainer.email,
          role: trainer.role,
          isDemo: trainer.isDemo,
        } as any
      },
    }),
  ],
})
