import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "NutriTrain - پلتفرم مدیریت مربیان و برنامه‌ریزی ورزشی",
  description: "سامانه هوشمند مدیریت برنامه تمرینی، رژیم غذایی و شاگردان مربیان ورزشی",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" className="light">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-600 selection:text-white">
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
