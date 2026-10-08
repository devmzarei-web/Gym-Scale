"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  ExternalLink,
} from "lucide-react"
import { TIER_CONFIGS, SubscriptionTierType } from "@/lib/subscription"

export function NavbarUserDropdown() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const user = session?.user
  const role = (user as any)?.role
  const isSuperAdmin = role === "SUPER_ADMIN"
  const isTrainer = role === "TRAINER"
  const userTier: SubscriptionTierType = (user as any)?.tier || "TRIAL"
  const tierConfig = TIER_CONFIGS[userTier] || TIER_CONFIGS.TRIAL

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Profile Trigger Button: Strictly Single-Line & Truncated */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 sm:px-3.5 py-2 rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0 max-w-[150px] sm:max-w-[210px]"
        title={user?.name || "حساب کاربری"}
      >
        <LayoutDashboard className="h-4 w-4 text-emerald-100 shrink-0" />
        <span className="truncate max-w-[80px] sm:max-w-[140px] text-right font-medium">
          {user?.name || "داشبورد مربی"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-emerald-200 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {user && (
            <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="block text-xs font-bold text-slate-900 truncate">
                  {user.name}
                </span>
                {isSuperAdmin ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                    مدیر ارشد
                  </span>
                ) : isTrainer ? (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 ${tierConfig.badgeColor}`}
                  >
                    {tierConfig.label}
                  </span>
                ) : null}
              </div>
              <span className="block text-[10px] text-slate-400 font-mono truncate">
                {user.email}
              </span>
            </div>
          )}

          <Link
            href={role === "CLIENT" ? "/client" : "/"}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-emerald-600 shrink-0" />
            داشبورد اصلی
          </Link>

          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
          >
            <User className="h-4 w-4 text-emerald-600 shrink-0" />
            ویرایش پروفایل
          </Link>

          {isTrainer && (
            <a
              href="https://nutritrain.ir"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50/60 hover:bg-amber-100/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                ارتقا / تمدید اشتراک
              </div>
              <ExternalLink className="h-3 w-3 text-amber-500 shrink-0" />
            </a>
          )}

          {isSuperAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              مدیریت ارشد سیستم
            </Link>
          )}

          <div className="my-1 border-t border-slate-100" />

          {session ? (
            <button
              onClick={() => {
                setIsOpen(false)
                signOut({ callbackUrl: "/login" })
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
              خروج از حساب کاربری
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <User className="h-4 w-4 text-emerald-600 shrink-0" />
              ورود به سیستم
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
