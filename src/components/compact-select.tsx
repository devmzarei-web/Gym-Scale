"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { ChevronDown, Check, Search } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
  subLabel?: string
  badge?: string
}

interface CompactSelectProps {
  value: string
  onChange: (value: string) => void
  options: (SelectOption | string)[]
  placeholder?: string
  searchable?: boolean
  className?: string
  dropdownClassName?: string
  disabled?: boolean
  name?: string
  size?: "xs" | "sm" | "md"
}

export function CompactSelect({
  value,
  onChange,
  options,
  placeholder = "انتخاب کنید...",
  searchable,
  className = "",
  dropdownClassName = "",
  disabled = false,
  name,
  size = "sm",
}: CompactSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt }
      }
      return opt
    })
  }, [options])

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions
    const q = searchQuery.trim().toLowerCase()
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
        (opt.value && opt.value.toLowerCase().includes(q))
    )
  }, [normalizedOptions, searchQuery])

  // Current selected option
  const selectedOption = normalizedOptions.find((opt) => opt.value === value)

  // Automatically enable search if options count is large (> 8) unless explicitly disabled
  const shouldSearch = searchable ?? normalizedOptions.length > 8

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && shouldSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery("")
    }
  }, [isOpen, shouldSearch])

  // Keyboard navigation for ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Size styling
  const sizeClasses = {
    xs: "py-1 px-2 text-[11px]",
    sm: "py-1.5 px-3 text-xs",
    md: "py-2 px-3.5 text-xs",
  }[size]

  return (
    <div className={`relative inline-block w-full text-right ${className}`} ref={containerRef}>
      {name && <input type="hidden" name={name} value={value} />}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-800 transition-all font-bold ${sizeClasses} ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"
        } ${isOpen ? "border-emerald-600 ring-2 ring-emerald-500/10 shadow-xs" : ""}`}
      >
        <span className="truncate flex-1 text-right">
          {selectedOption ? (
            <span className="text-slate-900">{selectedOption.label}</span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full right-0 mt-1.5 w-full min-w-[200px] z-50 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${dropdownClassName}`}
        >
          {/* Optional Search Input */}
          {shouldSearch && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/70">
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در گزینه‌ها..."
                  className="w-full bg-white border border-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar text-xs">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs">موردی یافت نشد</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                      setSearchQuery("")
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-right transition-colors ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-950 font-extrabold border border-emerald-200/80 shadow-2xs"
                        : "text-slate-700 hover:bg-slate-100/80 font-medium"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded-sm shrink-0">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.subLabel && (
                        <span className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mr-1" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
