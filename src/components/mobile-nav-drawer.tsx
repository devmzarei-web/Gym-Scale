"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { X } from "lucide-react"
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
  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer Panel (RTL: right side) */}
      <div className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 ease-out border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
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
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="بستن منو"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
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
                className={cn(
                  "flex items-center justify-between px-3.5 py-3 text-xs font-bold rounded-2xl transition-all whitespace-nowrap",
                  isActive
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-emerald-600" : "text-slate-400"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {isMsg && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Drawer Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 text-center font-semibold">
          سامانه هوشمند NutriTrain
        </div>
      </div>
    </div>
  )
}
