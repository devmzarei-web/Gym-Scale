"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { LayoutDashboard, User, LogOut, ShieldCheck, ChevronDown } from "lucide-react"

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
  const isSuperAdmin = (user as any)?.role === "SUPER_ADMIN"

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-xs"
      >
        <LayoutDashboard className="h-4 w-4 text-emerald-100" />
        <span>{user?.name || "داشبورد مربی"}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {user && (
            <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
              <span className="block text-xs font-bold text-slate-900">{user.name}</span>
              <span className="block text-[10px] text-slate-400 font-mono truncate">{user.email}</span>
            </div>
          )}

          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-emerald-600" />
            داشبورد مربی
          </Link>

          {isSuperAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
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
              <LogOut className="h-4 w-4 text-rose-500" />
              خروج از حساب کاربری
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <User className="h-4 w-4 text-emerald-600" />
              ورود به سیستم
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
