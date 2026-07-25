"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Dumbbell, Utensils, Users, BookOpen, ChefHat, ShieldCheck, Home, TrendingUp, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { NavbarUserDropdown } from "./navbar-user-dropdown"

const trainerNavItems = [
  { href: "/clients", label: "شاگردان من", icon: Users },
  { href: "/messages", label: "پیام‌ها", icon: MessageSquare, isMessages: true },
  { href: "/routines", label: "برنامه‌های تمرینی", icon: Dumbbell },
  { href: "/diets", label: "برنامه‌های تغذیه", icon: Utensils },
  { href: "/food-bank", label: "بانک مواد غذایی", icon: Utensils },
  { href: "/exercises", label: "بانک حرکات", icon: BookOpen },
  { href: "/recipes", label: "دستورپخت‌ها", icon: ChefHat },
]


const clientNavItems = [
  { href: "/client", label: "داشبورد من", icon: Home },
  { href: "/client/progress", label: "ثبت پیشرفت", icon: TrendingUp },
  { href: "/client/messages", label: "پیام‌ها", icon: MessageSquare, isMessages: true },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState<number>(0)

  useEffect(() => {
    if (!session?.user?.id) return

    function fetchUnread() {
      fetch("/api/messages/unread")
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount)
          }
        })
        .catch(() => {})
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 15000) // Poll every 15 seconds
    return () => clearInterval(interval)
  }, [session?.user?.id, pathname])

  // Do not render Navbar on PDF printable pages or login page
  if (pathname.includes("/pdf") || pathname === "/login") {
    return null
  }

  const role = (session?.user as any)?.role
  const isClient = role === "CLIENT"
  const isSuperAdmin = role === "SUPER_ADMIN"

  let currentNavItems = isClient ? clientNavItems : [...trainerNavItems]
  if (isSuperAdmin && !isClient) {
    currentNavItems.push({ href: "/admin", label: "مدیریت سیستم", icon: ShieldCheck })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo Image */}
        <Link href={isClient ? "/client" : "/"} className="flex items-center group">
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
          {currentNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/client" && item.href !== "/" && pathname.startsWith(item.href))
            const isMsg = (item as any).isMessages

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all",
                  isActive
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-emerald-600" : "text-slate-400")} />
                {item.label}

                {/* Unread Messages Badge */}
                {isMsg && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
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
