"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import {
  X,
  User,
  LogOut,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Dumbbell,
  Utensils,
  BookOpen,
  ChefHat,
  Users,
  MessageSquare,
  Home,
  TrendingUp,
  History,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
  unreadCount: number
  pathname: string
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  unreadCount,
  pathname,
}: MobileNavDrawerProps) {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock background scroll when drawer is open
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

  // Swipe to dismiss gesture in RTL (dragging rightwards toward origin closes)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const currentX = e.touches[0].clientX
    const diff = currentX - touchStartX.current
    if (diff > 0) {
      setTouchDeltaX(diff)
    }
  }

  function handleTouchEnd() {
    if (touchDeltaX > 70) {
      onClose()
    }
    touchStartX.current = null
    setTouchDeltaX(0)
  }

  if (!mounted) return null

  const user = session?.user
  const role = (user as any)?.role
  const isClient = role === "CLIENT"
  const isSuperAdmin = role === "SUPER_ADMIN"
  const isTrainer = role === "TRAINER" || (!isClient && !isSuperAdmin)

  const roleTitle = isSuperAdmin
    ? "مدیر ارشد سامانه"
    : isClient
    ? "ورزشکار"
    : "مربی ورزشی"

  const drawerContent = (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden transition-all duration-300 select-none",
        isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
      )}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Slide-out Drawer Panel (Mounted directly on body, 100% full screen height) */}
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
          transition: touchDeltaX > 0 ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 will-change-transform"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
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
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 active:scale-95 transition-all"
            aria-label="بستن منو"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Card */}
        {user && (
          <div className="p-3.5 mx-3 my-2.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0">
                {user.name ? user.name.charAt(0) : "ک"}
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
                <p className="text-[11px] text-slate-500 truncate mt-0.5 dir-ltr text-right">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Profile & Logo Upload shortcut */}
            {!isClient && (
              <Link
                href="/profile"
                onClick={onClose}
                className="w-full flex items-center justify-between text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs mt-1"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>پروفایل و لوگوی مربی</span>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-emerald-600" />
              </Link>
            )}
          </div>
        )}

        {/* Full Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Trainer / Admin Navigation */}
          {!isClient && (
            <>
              {/* Category 1: Main Workflows */}
              <div className="space-y-1">
                <span className="block px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  بخش‌های اصلی
                </span>

                <Link
                  href="/clients"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                    pathname === "/clients" || pathname === "/" || pathname.startsWith("/clients/")
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span>شاگردان من</span>
                </Link>

                <Link
                  href="/routines"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                    pathname.startsWith("/routines")
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Dumbbell className="h-4 w-4 shrink-0" />
                  <span>برنامه‌های تمرینی</span>
                </Link>

                <Link
                  href="/diets"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                    pathname.startsWith("/diets")
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Utensils className="h-4 w-4 shrink-0" />
                  <span>برنامه‌های تغذیه</span>
                </Link>

                <Link
                  href="/messages"
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                    pathname.startsWith("/messages")
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>پیام‌ها و گفتگو</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Category 2: Knowledge Bank */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="block px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  بانک اطلاعات و منابع
                </span>

                <Link
                  href="/exercises"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                    pathname.startsWith("/exercises")
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span>بانک حرکات ورزشی</span>
                </Link>

                <Link
                  href="/food-bank"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                    pathname.startsWith("/food-bank")
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Utensils className="h-4 w-4 shrink-0" />
                  <span>بانک مواد غذایی</span>
                </Link>

                <Link
                  href="/recipes"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                    pathname.startsWith("/recipes")
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <ChefHat className="h-4 w-4 shrink-0" />
                  <span>دستورپخت‌های رژیمی</span>
                </Link>
              </div>

              {/* Category 3: Admin & Settings */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="block px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  مدیریت و حساب
                </span>

                {isSuperAdmin && (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                      pathname.startsWith("/admin")
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>مدیریت سیستم</span>
                  </Link>
                )}

                <Link
                  href="/profile"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                    pathname === "/profile"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span>پروفایل و لوگوی مربی</span>
                </Link>
              </div>
            </>
          )}

          {/* Client Navigation */}
          {isClient && (
            <div className="space-y-1">
              <span className="block px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                منوی ورزشکار
              </span>

              <Link
                href="/client"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                  pathname === "/client"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Home className="h-4 w-4 shrink-0" />
                <span>داشبورد و تمرین من</span>
              </Link>

              <Link
                href="/client/progress"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                  pathname.startsWith("/client/progress")
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span>ثبت پیشرفت و اندازه‌گیری</span>
              </Link>

              <Link
                href="/client/messages"
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                  pathname.startsWith("/client/messages")
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span>پیام با مربی</span>
                </div>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/client/history"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                  pathname.startsWith("/client/history")
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <History className="h-4 w-4 shrink-0" />
                <span>تاریخچه برنامه‌ها</span>
              </Link>

              <Link
                href="/profile"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                  pathname === "/profile"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <User className="h-4 w-4 shrink-0" />
                <span>اطلاعات کاربری</span>
              </Link>
            </div>
          )}

          {/* Sign Out Action */}
          <div className="pt-2 border-t border-slate-100">
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

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center font-semibold">
          <p className="font-heading font-bold text-slate-700">سامانه هوشمند NutriTrain</p>
          <p className="text-[9px] text-slate-400">طراحی اختصاصی مربیان و ورزشکاران</p>
        </div>
      </div>
    </div>
  )

  return createPortal(drawerContent, document.body)
}
