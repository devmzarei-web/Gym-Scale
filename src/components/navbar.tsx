"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Dumbbell, Utensils, Users, BookOpen, ChefHat, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { NavbarUserDropdown } from "./navbar-user-dropdown"

const navItems = [
  { href: "/clients", label: "شاگردان من", icon: Users },
  { href: "/routines", label: "برنامه‌های تمرینی", icon: Dumbbell },
  { href: "/diets", label: "برنامه‌های تغذیه", icon: Utensils },
  { href: "/exercises", label: "بانک حرکات", icon: BookOpen },
  { href: "/recipes", label: "دستورپخت‌ها", icon: ChefHat },
  { href: "/admin", label: "مدیریت سیستم", icon: ShieldCheck },
]

export function Navbar() {
  const pathname = usePathname()

  // Do not render Navbar on PDF printable pages
  if (pathname.includes("/pdf")) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo Image */}
        <Link href="/" className="flex items-center group">
          <div className="relative h-10 w-44">
            <Image
              src="/NutriTrain.png"
              alt="NutriTrain Logo"
              fill
              className="object-contain object-right group-hover:scale-102 transition-transform"
              priority
            />
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all",
                  isActive
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-emerald-600" : "text-slate-400")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Dropdown Button */}
        <div className="flex items-center gap-3">
          <NavbarUserDropdown />
        </div>
      </div>
    </header>
  )
}
