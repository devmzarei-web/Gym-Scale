"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { AlertCircle, Clock, ExternalLink, Sparkles } from "lucide-react"

export function SubscriptionWarningBanner() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const [status, setStatus] = useState<{
    state: "ACTIVE" | "GRACE_PERIOD" | "LOCKED"
    isGracePeriod: boolean
    isLocked: boolean
    daysRemaining: number | null
    graceDaysRemaining: number | null
  } | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    const role = (session.user as any)?.role
    if (role === "SUPER_ADMIN" || role === "CLIENT") return

    let isMounted = true

    fetch("/api/subscription/status")
      .then((res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        if (!isMounted || !data) return
        setStatus({
          state: data.state,
          isGracePeriod: data.isGracePeriod,
          isLocked: data.isLocked,
          daysRemaining: data.daysRemaining,
          graceDaysRemaining: data.graceDaysRemaining,
        })

        // If account is fully locked and not already on the expired or login page, redirect
        if (
          data.isLocked &&
          pathname !== "/subscription-expired" &&
          pathname !== "/login" &&
          !pathname.includes("/pdf")
        ) {
          router.replace("/subscription-expired")
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [session?.user?.id, pathname, router])

  // Don't render banner on login, PDF or subscription-expired pages
  if (
    !status ||
    pathname === "/subscription-expired" ||
    pathname === "/login" ||
    pathname.includes("/pdf")
  ) {
    return null
  }

  // Active Grace Period: Red/Amber persistent banner
  if (status.isGracePeriod) {
    return (
      <div className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white px-4 py-2.5 shadow-md">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 animate-bounce" />
            <span>
              اعتبار اشتراک شما به پایان رسیده است و در مهلت ۳ روزه تمدید هستید{" "}
              {status.graceDaysRemaining !== null && (
                <span className="underline decoration-white/60">
                  (تنها {status.graceDaysRemaining} روز فرصت باقی‌مانده)
                </span>
              )}
              . جهت جلوگیری از قفل شدن حساب کاربری، لطفاً اشتراک خود را تمدید فرمایید.
            </span>
          </div>

          <a
            href="https://nutritrain.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-rose-600 hover:bg-slate-100 rounded-lg text-xs font-black shadow-xs transition-colors shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            تمدید آنی در NutriTrain
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    )
  }

  // Expiring Soon (3 days or fewer remaining on active plan)
  if (
    status.state === "ACTIVE" &&
    status.daysRemaining !== null &&
    status.daysRemaining <= 3 &&
    status.daysRemaining > 0
  ) {
    return (
      <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              یادآوری: اشتراک شما تا <strong>{status.daysRemaining} روز دیگر</strong> به پایان می‌رسد.
            </span>
          </div>

          <a
            href="https://nutritrain.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline shrink-0"
          >
            تمدید پیش از موعد
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    )
  }

  return null
}
