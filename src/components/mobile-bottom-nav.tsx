"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Users,
  Dumbbell,
  Utensils,
  MessageSquare,
  User,
  TrendingUp,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileBottomNav() {
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
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [session?.user?.id, pathname])

  // Exclusion Rules: Do not render during print, login, or focused live workout session
  if (
    !session ||
    pathname.includes("/pdf") ||
    pathname === "/login" ||
    pathname.startsWith("/client/workout")
  ) {
    return null
  }

  const role = (session?.user as any)?.role
  const isClient = role === "CLIENT"

  const trainerTabs = [
    {
      id: "clients",
      href: "/clients",
      label: "شاگردان",
      icon: Users,
      isActive:
        pathname === "/" ||
        pathname === "/clients" ||
        pathname.startsWith("/clients/"),
    },
    {
      id: "routines",
      href: "/routines",
      label: "برنامه‌ها",
      icon: Dumbbell,
      isActive: pathname.startsWith("/routines"),
    },
    {
      id: "diets",
      href: "/diets",
      label: "تغذیه",
      icon: Utensils,
      isActive: pathname.startsWith("/diets"),
    },
    {
      id: "messages",
      href: "/messages",
      label: "پیام‌ها",
      icon: MessageSquare,
      isMessages: true,
      isActive: pathname.startsWith("/messages"),
    },
    {
      id: "profile",
      href: "/profile",
      label: "پروفایل",
      icon: User,
      isActive: pathname === "/profile",
    },
  ]

  const clientTabs = [
    {
      id: "dashboard",
      href: "/client",
      label: "تمرین من",
      icon: Dumbbell,
      isActive: pathname === "/client",
    },
    {
      id: "progress",
      href: "/client/progress",
      label: "پیشرفت",
      icon: TrendingUp,
      isActive: pathname.startsWith("/client/progress"),
    },
    {
      id: "messages",
      href: "/client/messages",
      label: "پیام‌ها",
      icon: MessageSquare,
      isMessages: true,
      isActive: pathname.startsWith("/client/messages"),
    },
    {
      id: "diets",
      href: "/client#diets",
      label: "رژیم من",
      icon: Utensils,
      isActive: pathname.startsWith("/client/diets"),
    },
    {
      id: "profile",
      href: "/profile",
      label: "حساب",
      icon: User,
      isActive: pathname === "/profile",
    },
  ]

  const tabs = isClient ? clientTabs : trainerTabs

  return (
    <nav
      aria-label="ناوبری اصلی موبایل"
      className="lg:hidden fixed bottom-2.5 inset-x-3 sm:inset-x-6 max-w-md mx-auto z-40 select-none no-print transition-all duration-300"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="relative flex items-center justify-around bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-950/10 rounded-3xl p-1.5 transition-all">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.isActive
          const isMsg = tab.isMessages

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-95",
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20 font-bold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive ? "scale-105 stroke-[2.2]" : "stroke-[1.8]"
                  )}
                />
                {isMsg && unreadCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -left-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-extrabold ring-2 ring-white animate-pulse",
                      isActive
                        ? "bg-rose-500 text-white ring-emerald-700"
                        : "bg-rose-500 text-white"
                    )}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 tracking-tight whitespace-nowrap",
                  isActive ? "font-black" : "font-semibold text-slate-500"
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
