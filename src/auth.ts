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

        const input = String(credentials.email).trim()
        const password = String(credentials.password)

        // Convert Persian/Arabic digits to English digits
        const cleanInput = input
          .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
          .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())

        const configuredAdmin = process.env.ADMIN_USERNAME?.toLowerCase() || "admin"
        const isAdminAlias =
          input.toLowerCase() === configuredAdmin ||
          input.toLowerCase() === "admin-nutri" ||
          input.toLowerCase() === "admin"

        // Find trainer or client in DB by email, username prefix, or phone
        let user: any = await prisma.trainer.findFirst({
          where: {
            OR: [
              { email: input.toLowerCase() },
              { email: cleanInput.toLowerCase() },
              { email: `${input.toLowerCase()}@nutritrain.ir` },
              { phone: input },
              { phone: cleanInput },
              ...(isAdminAlias ? [{ role: "SUPER_ADMIN" as const }] : []),
            ],
          },
        })

        if (!user) {
          user = await prisma.client.findFirst({
            where: {
              OR: [
                { email: input.toLowerCase() },
                { email: cleanInput.toLowerCase() },
                { phone: input },
                { phone: cleanInput },
              ],
            },
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
