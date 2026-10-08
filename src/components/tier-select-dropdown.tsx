"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Sparkles, Shield, Trophy } from "lucide-react"
import { SubscriptionTierType } from "@/lib/subscription"

export interface TierOption {
  value: SubscriptionTierType
  title: string
  badgeText: string
  badgeColor: string
  description: string
  details: string
  icon: any
}

export const TIER_OPTIONS: TierOption[] = [
  {
    value: "TRIAL",
    title: "پلن آزمایشی",
    badgeText: "آزمایشی",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    description: "مناسب برای بررسی اولیه و تست امکانات سامانه",
    details: "۵ شاگرد • ۳ برنامه هوش مصنوعی • اعتبار ۱۴ روز",
    icon: Sparkles,
  },
  {
    value: "STARTER",
    title: "پلن مربی پایه",
    badgeText: "مربی پایه",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    description: "مناسب برای مربیان فعال و کار با شاگردان حضوری و آنلاین",
    details: "۲۵ شاگرد • ۳۰ برنامه هوش مصنوعی • اعتبار ۳۰ روز",
    icon: Shield,
  },
  {
    value: "PRO",
    title: "پلن باشگاه حرفه‌ای",
    badgeText: "باشگاه حرفه‌ای",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "مناسب برای باشگاه‌ها، مجموعه‌های ورزشی و مربیان حرفه‌ای",
    details: "۱۰۰ شاگرد • ۱۰۰ برنامه هوش مصنوعی • اعتبار ۱ سال",
    icon: Trophy,
  },
]

interface TierSelectDropdownProps {
  value: SubscriptionTierType
  onChange: (value: SubscriptionTierType) => void
  name?: string
}

export function TierSelectDropdown({
  value,
  onChange,
  name = "tier",
}: TierSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Map legacy FREE to TRIAL for display
  const currentTierValue = value === "FREE" ? "TRIAL" : value
  const selectedOption =
    TIER_OPTIONS.find((opt) => opt.value === currentTierValue) || TIER_OPTIONS[0]
  const SelectedIcon = selectedOption.icon

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Hidden input to ensure FormData gets the selected value */}
      <input type="hidden" name={name} value={currentTierValue} />

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white border border-emerald-200/90 hover:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all text-right"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <SelectedIcon className="h-4 w-4" />
          </div>

          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 truncate">
                {selectedOption.title}
              </span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border shrink-0 ${selectedOption.badgeColor}`}
              >
                {selectedOption.badgeText}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium truncate">
              {selectedOption.details}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 mr-2 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1.5 w-full z-50 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {TIER_OPTIONS.map((option) => {
            const isSelected = option.value === currentTierValue
            const OptionIcon = option.icon

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-colors ${
                  isSelected
                    ? "bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 shadow-2xs"
                    : "hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <OptionIcon className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex flex-col min-w-0 items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{option.title}</span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${option.badgeColor}`}
                      >
                        {option.badgeText}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {option.details}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-1" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
