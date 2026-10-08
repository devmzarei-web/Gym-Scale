"use client"

import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { AlertTriangle, ExternalLink, LogOut, Sparkles } from "lucide-react"

export default function SubscriptionExpiredPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="relative mx-auto h-12 w-48 mb-6">
          <Image
            src="/NutriTrain.png"
            alt="NutriTrain Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-5">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="text-xl font-black text-slate-900 mb-2">
          اشتراک شما به پایان رسیده است
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          مهلت استفاده از پنل و مهلت ۳ روزه تمدید حساب کاربری شما به اتمام رسیده است. کلیه اطلاعات و پرونده‌های شاگردان شما محفوظ است. جهت فعال‌سازی مجدد و دسترسی کامل به امکانات، لطفاً اشتراک خود را تمدید فرمایید.
        </p>

        <div className="space-y-3">
          <a
            href="https://nutritrain.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 shadow-md transition-all"
          >
            <Sparkles className="h-4 w-4" />
            تمدید یا ارتقای اشتراک در NutriTrain
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            خروج از حساب کاربری
          </button>
        </div>
      </div>
    </div>
  )
}
