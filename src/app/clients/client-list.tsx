"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, X, Users, Phone, ArrowLeft, Dumbbell, Utensils, AlertTriangle, Clock, CheckCircle2, Ban } from "lucide-react"

interface ClientListProps {
  initialClients: any[]
}

export function ClientList({ initialClients }: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "NONE">("ALL")

  const now = new Date()

  // Computed filtering
  const filteredClients = useMemo(() => {
    return initialClients.filter((client) => {
      // Text match search
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        client.name?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.goals?.toLowerCase().includes(query)

      if (!matchesSearch) return false

      // Status filter
      const sub = client.subscriptions[0]
      if (statusFilter === "ALL") return true

      if (statusFilter === "NONE") {
        return !sub
      }

      if (!sub) return false

      const endDate = new Date(sub.endDate)
      const isActive = endDate >= now && sub.status === "ACTIVE"

      if (statusFilter === "ACTIVE") return isActive
      if (statusFilter === "EXPIRED") return !isActive || sub.status === "CANCELLED" || sub.status === "EXPIRED"

      return true
    })
  }, [initialClients, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام شاگرد، شماره تماس، ایمیل یا هدف..."
            className="w-full pr-10 pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0 text-xs">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            همه ({initialClients.length})
          </button>

          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              statusFilter === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            اشتراک فعال
          </button>

          <button
            onClick={() => setStatusFilter("EXPIRED")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              statusFilter === "EXPIRED"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            منقضی / لغو شده
          </button>

          <button
            onClick={() => setStatusFilter("NONE")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === "NONE"
                ? "bg-slate-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            بدون اشتراک
          </button>
        </div>
      </div>

      {/* Results Header / Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          نمایش <strong className="text-slate-900 font-bold">{filteredClients.length}</strong> از {initialClients.length} شاگرد
        </span>
        {(searchQuery || statusFilter !== "ALL") && (
          <button
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("ALL")
            }}
            className="text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            پاکسازی فیلترها
          </button>
        )}
      </div>

      {/* Clients Grid / Empty state */}
      {filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">شاگردی با این مشخصات یافت نشد</h3>
            <p className="text-xs text-slate-500 mt-1">
              عبارت دیگری را جستجو کنید یا فیلترهای اعمال شده را تغییر دهید.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const sub = client.subscriptions[0]
            const lastRoutine = client.routineHistory[0]?.routine
            const lastDiet = client.dietHistory[0]?.dietPlan

            // Subscription status badge calculation
            let subBadge = {
              label: "بدون اشتراک",
              className: "bg-slate-100 text-slate-500 border-slate-200",
              icon: null as any,
            }

            if (sub) {
              const endDate = new Date(sub.endDate)
              const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24))

              if (sub.status === "CANCELLED") {
                subBadge = {
                  label: "اشتراک لغو شده",
                  className: "bg-slate-100 text-slate-700 border-slate-300 font-bold",
                  icon: <Ban className="h-3 w-3 text-slate-600 inline ml-1" />,
                }
              } else if (endDate < now || sub.status === "EXPIRED") {
                subBadge = {
                  label: "منقضی شده (نیازمند تمدید)",
                  className: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
                  icon: <AlertTriangle className="h-3 w-3 text-rose-600 inline ml-1" />,
                }
              } else if (diffDays <= 7) {
                subBadge = {
                  label: `${diffDays} روز تا انقضا`,
                  className: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
                  icon: <Clock className="h-3 w-3 text-amber-600 inline ml-1" />,
                }
              } else {
                subBadge = {
                  label: "اشتراک فعال",
                  className: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
                  icon: <CheckCircle2 className="h-3 w-3 text-emerald-600 inline ml-1" />,
                }
              }
            }

            return (
              <div
                key={client.id}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md"
              >
                <div className="space-y-4">
                  {/* Avatar & Basic Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-lg shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-bold text-base text-slate-900 hover:text-emerald-600 transition-colors"
                        >
                          {client.name}
                        </Link>
                        {client.phone && (
                          <span className="block text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] border px-2 py-1 rounded-lg shrink-0 flex items-center ${subBadge.className}`}>
                      {subBadge.icon}
                      {subBadge.label}
                    </span>
                  </div>

                  {/* Body Stats */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <div>
                      <span className="block text-[10px] text-slate-400">سن</span>
                      <span className="text-xs font-bold text-slate-800">{client.age ? `${client.age} سال` : "-"}</span>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="block text-[10px] text-slate-400">وزن</span>
                      <span className="text-xs font-bold text-slate-800">{client.weight ? `${client.weight} kg` : "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">قد</span>
                      <span className="text-xs font-bold text-slate-800">{client.height ? `${client.height} cm` : "-"}</span>
                    </div>
                  </div>

                  {/* Goals & Programs */}
                  <div className="space-y-2 text-xs">
                    {client.goals && (
                      <p className="text-slate-600 line-clamp-1">
                        <span className="text-slate-400">هدف: </span>
                        {client.goals}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Dumbbell className="h-3.5 w-3.5 text-emerald-600" />
                          تمرین:
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {lastRoutine ? lastRoutine.title : "تعیین نشده"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Utensils className="h-3.5 w-3.5 text-teal-600" />
                          تغذیه:
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {lastDiet ? lastDiet.title : "تعیین نشده"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    ثبت: {new Date(client.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group-hover:translate-x-[-2px] transition-all"
                  >
                    مشاهده پرونده کامل
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
