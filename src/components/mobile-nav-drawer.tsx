"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import {
  X,
  User,
  LogOut,
  ChevronLeft,
  Sparkles,
  Shield,
  Dumbbell,
  Utensils,
  BookOpen,
  ChefHat,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
  navItems: Array<{
    href: string
    label: string
    icon: any
    isMessages?: boolean
  }>
  unreadCount: number
  pathname: string
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  navItems,
  unreadCount,
  pathname,
}: MobileNavDrawerProps) {
  const { data: session } = useSession()
  const touchStartX = useRef<number | null>(null)
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0)

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  // Swipe right to dismiss gesture (RTL: right side is origin)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const currentX = e.touches[0].clientX
    const diff = currentX - touchStartX.current
    // In RTL right-side drawer: dragging toward right (positive diff) closes the drawer
    if (diff > 0) {
      setTouchDeltaX(diff)
    }
  }

  function handleTouchEnd() {
    if (touchDeltaX > 75) {
      onClose()
    }
    touchStartX.current = null
    setTouchDeltaX(0)
  }

  const user = session?.user
  const role = (user as any)?.role
  const isTrainer = role === "TRAINER" || !role
  const isSuperAdmin = role === "SUPER_ADMIN"

  const roleTitle = isSuperAdmin
    ? "مدیر ارشد سامانه"
    : isTrainer
    ? "مربی ورزشی"
    : "ورزشکار"

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden transition-all duration-300 select-none",
        isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
      )}
      aria-hidden={!isOpen}
    >
      {/* Glassmorphic Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Slide-out Drawer Panel (RTL: right side) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: !isOpen
            ? "translateX(100%)"
            : touchDeltaX > 0
            ? `translateX(${touchDeltaX}px)`
            : "translateX(0px)",
          transition: touchDeltaX > 0 ? "none" : "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="fixed inset-y-0 right-0 z-50 w-80 max-w-[88vw] bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col border-l border-slate-200/80 will-change-transform"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="relative h-8 w-36">
            <Image
              src="/NutriTrain.png"
              alt="NutriTrain Logo"
              fill
              className="object-contain object-right"
              priority
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 active:scale-95 transition-all"
            aria-label="بستن منو"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Card */}
        {user && (
          <div className="p-4 mx-3 my-2 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 border border-emerald-500/20 shadow-xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
                {user.name ? user.name.charAt(0) : "م"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-900 truncate">
                    {user.name || "کاربر گرامی"}
                  </span>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full shrink-0">
                    {roleTitle}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Direct Trainer Profile & Logo Upload Link */}
            {isTrainer && (
              <Link
                href="/profile"
                onClick={onClose}
                className="mt-2 w-full flex items-center justify-between text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>تنظیمات پروفایل و لوگوی اختصاصی</span>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-emerald-600" />
              </Link>
            )}
          </div>
        )}

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <span className="block px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            بخش‌های اصلی
          </span>

          {navItems.map((item, idx) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== "/client" && item.href !== "/" && pathname.startsWith(item.href))
            const isMsg = item.isMessages

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  transitionDelay: `${idx * 25}ms`,
                }}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all duration-200 whitespace-nowrap active:scale-98",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-white" : "text-slate-400"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {isMsg && unreadCount > 0 && (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black animate-pulse",
                      isActive
                        ? "bg-white text-emerald-700 ring-2 ring-emerald-500"
                        : "bg-rose-500 text-white"
                    )}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Quick Links Section */}
          <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
            <span className="block px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              دسترسی سریع
            </span>

            <Link
              href="/profile"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                pathname === "/profile"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <User
                className={cn(
                  "h-4 w-4 shrink-0",
                  pathname === "/profile" ? "text-white" : "text-slate-400"
                )}
              />
              <span>پروفایل و اطلاعات کاربری</span>
            </Link>

            <button
              onClick={() => {
                onClose()
                signOut({ callbackUrl: "/login" })
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-all whitespace-nowrap"
            >
              <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
              <span>خروج از حساب کاربری</span>
            </button>
          </div>
        </div>

        {/* Drawer Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-[10px] text-slate-400 text-center font-semibold space-y-0.5">
          <p className="font-heading font-bold text-slate-600">سامانه هوشمند NutriTrain</p>
          <p className="text-[9px]">ورژن ۲.۴.۰ • طراحی ویژه موبایل و تبلت</p>
        </div>
      </div>
    </div>
  )
}
