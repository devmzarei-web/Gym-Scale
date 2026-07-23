"use client"

import Link from "next/link"
import { ShieldAlert, ArrowRight, Home } from "lucide-react"

export default function AccessDeniedPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-slate-900 font-heading">
            دسترسی به این بخش محدود شده است
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            این بخش مخصوص مربیان یا مدیریت ارشد سیستم می‌باشد. حساب کاربری شما به‌عنوان شاگرد ثبت شده است.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/client"
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md"
          >
            <Home className="h-4 w-4" />
            ورود به داشبورد شاگرد
          </Link>
        </div>
      </div>
    </div>
  )
}
