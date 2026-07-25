"use client"

import { useState } from "react"
import { FoodSubstitutionModal } from "./food-substitution-modal"
import { ArrowRightLeft } from "lucide-react"

export function ClientDietContent({ dietPlan }: { dietPlan: any }) {
  const [substitutionRow, setSubstitutionRow] = useState<any | null>(null)
  
  const sections = dietPlan.sectionsJson

  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return (
      <div
        className="prose prose-emerald max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: dietPlan.content }}
      />
    )
  }

  return (
    <div className="space-y-8">
      {sections.map((section: any, idx: number) => (
        <div key={section.id || idx} className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 px-4 py-2 rounded-xl">
            {section.mealName}
          </h3>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">ماده غذایی</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">مقدار</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">توضیحات</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap w-24">جایگزین</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {section.rows?.map((row: any, rIdx: number) => {
                  const isSupp = section.mealName?.includes("مکمل") || section.id === "m5"
                  return (
                    <tr key={row.id || rIdx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">{row.name}</td>
                      <td className="px-4 py-3 text-slate-600">{row.amount}</td>
                      <td className="px-4 py-3 text-slate-500">{row.note}</td>
                      <td className="px-4 py-3">
                        {!isSupp && (
                          <button
                            onClick={() => setSubstitutionRow(row)}
                            className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 sm:px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 whitespace-nowrap"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                            جایگزین
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {section.textNotes && (
            <p className="text-xs text-slate-500 pr-2 border-r-2 border-slate-300">
              {section.textNotes}
            </p>
          )}
        </div>
      ))}

      <FoodSubstitutionModal 
        isOpen={!!substitutionRow} 
        onClose={() => setSubstitutionRow(null)} 
        row={substitutionRow} 
      />
    </div>
  )
}
