"use client"

import { useState } from "react"
import Link from "next/link"
import { Utensils, FileText, Layers, X, ChevronLeft } from "lucide-react"

interface ClientDietsSectionProps {
  assignedDiets: any[]
  clientId: string
}

export function ClientDietsSection({ assignedDiets, clientId }: ClientDietsSectionProps) {
  const [isOpenModal, setIsOpenModal] = useState(false)

  if (assignedDiets.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="inline-flex items-center gap-2 text-xs font-bold bg-teal-50 text-teal-700 px-3 py-1 rounded-xl border border-teal-200">
              <Utensils className="h-4 w-4" />
              برنامه تغذیه فعال
            </span>
          </div>
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            هنوز برنامه تغذیه‌ای برای شما ثبت نشده است.
          </div>
        </div>
      </div>
    )
  }

  const activeDiet = assignedDiets[0]

  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Top Card Header with Compact Multi-Diet Trigger */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="inline-flex items-center gap-2 text-xs font-bold bg-teal-50 text-teal-700 px-3 py-1 rounded-xl border border-teal-200">
            <Utensils className="h-4 w-4" />
            برنامه تغذیه جاری شما
          </span>

          {assignedDiets.length > 1 && (
            <button
              type="button"
              onClick={() => setIsOpenModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1 rounded-xl transition-all shadow-2xs"
            >
              <Layers className="h-3.5 w-3.5 text-teal-600" />
              <span>همه برنامه‌ها ({assignedDiets.length}) ▾</span>
            </button>
          )}
        </div>

        {/* Active Diet Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3
              onClick={() => {
                if (assignedDiets.length > 1) setIsOpenModal(true)
              }}
              className={`text-lg font-bold text-slate-900 font-heading ${
                assignedDiets.length > 1 ? "cursor-pointer hover:text-teal-700 transition-colors" : ""
              }`}
            >
              {activeDiet.title}
            </h3>
          </div>

          {activeDiet.description && (
            <p className="text-xs text-slate-500 line-clamp-2">
              {activeDiet.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <Link
              href={`/client/diets/${activeDiet.id}`}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-sm"
            >
              مشاهده کامل برنامه
              <ChevronLeft className="h-4 w-4" />
            </Link>

            <a
              href={`/api/diets/${activeDiet.id}/pdf?clientId=${clientId}`}
              download
              className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-3 px-4 rounded-xl transition-all"
            >
              <FileText className="h-4 w-4 text-teal-600" />
              دانلود مستقیم PDF
            </a>
          </div>
        </div>
      </div>

      {/* Diets Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-600" />
                برنامه‌های تغذیه اختصاصی شما ({assignedDiets.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {assignedDiets.map((diet, dIdx) => (
                <div
                  key={diet.id || dIdx}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 font-heading">
                      {diet.title}
                    </h4>
                  </div>

                  {diet.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {diet.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/client/diets/${diet.id}`}
                      onClick={() => setIsOpenModal(false)}
                      className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs"
                    >
                      مشاهده کامل برنامه
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Link>

                    <a
                      href={`/api/diets/${diet.id}/pdf?clientId=${clientId}`}
                      download
                      className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all"
                    >
                      <FileText className="h-3.5 w-3.5 text-teal-600" />
                      دانلود مستقیم PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
