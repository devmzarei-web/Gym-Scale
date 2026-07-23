import { notFound } from "next/navigation"
import fs from "fs"
import path from "path"
import prisma from "@/lib/prisma"
import { PrintButton } from "@/components/print-button"

export const revalidate = 0

const toPersianDigits = (num: string | number | undefined | null) => {
  if (num === undefined || num === null) return ""
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
  return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)])
}

function getBase64Asset(assetPath: string, mimeType: string) {
  try {
    const fullPath = path.join(process.cwd(), "public", assetPath)
    const fileBuffer = fs.readFileSync(fullPath)
    return `data:${mimeType};base64,${fileBuffer.toString("base64")}`
  } catch (e) {
    return ""
  }
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ clientId?: string }>
}

export default async function RoutinePdfPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const search = searchParams ? await searchParams : {}

  const routine = await (prisma as any).routine.findUnique({
    where: { id },
    include: {
      trainer: true,
      workoutDays: {
        include: { exercises: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!routine) return notFound()

  let client = null
  if (search?.clientId) {
    client = await (prisma as any).client.findUnique({
      where: { id: search.clientId },
    })
  }

  const routineWithClient = { ...routine, client }

  // Generate suggested PDF filename: NutriTrain.ir-{trainer's name}-{client name if assigned if not routine title}-{date}
  const trainerName = routine.trainer?.name ? routine.trainer.name.replace(/\s+/g, "_") : "مربی"
  const clientOrTitle = client?.name ? client.name.replace(/\s+/g, "_") : routine.title.replace(/\s+/g, "_")
  const dateStr = new Date(routine.createdAt).toLocaleDateString("fa-IR").replace(/\//g, "-")
  const pdfFileName = `NutriTrain.ir-${trainerName}-${clientOrTitle}-${dateStr}`

  // Smart chunking for PDF pages
  const MAX_PAGE_HEIGHT = 960
  const DAY_HEADER_HEIGHT = 36
  const TABLE_HEADER_HEIGHT = 32
  const ROW_HEIGHT = 28
  const DAY_GAP = 20

  const days = routine.workoutDays
  const pages: typeof days[] = []
  let currentPage: typeof days = []
  let currentHeight = 0

  for (const day of days) {
    const dayHeight =
      DAY_HEADER_HEIGHT + TABLE_HEADER_HEIGHT + day.exercises.length * ROW_HEIGHT + DAY_GAP

    if (currentHeight + dayHeight > MAX_PAGE_HEIGHT && currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = [day]
      currentHeight = dayHeight
    } else {
      currentPage.push(day)
      currentHeight += dayHeight
    }
  }
  if (currentPage.length > 0) pages.push(currentPage)
  if (pages.length === 0) pages.push([])

  const logoBase64 = getBase64Asset("NutriTrain.png", "image/png")
  const vazirRegBase64 = getBase64Asset("fonts/Vazirmatn-Regular.woff2", "font/woff2")
  const vazirBoldBase64 = getBase64Asset("fonts/Vazirmatn-Bold.woff2", "font/woff2")
  const morabbaMedBase64 = getBase64Asset("fonts/Morabba-Medium.woff2", "font/woff2")

  return (
    <div className="bg-white text-slate-900" dir="rtl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @font-face {
          font-family: 'Vazirmatn';
          src: url('${vazirRegBase64}') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Vazirmatn';
          src: url('${vazirBoldBase64}') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Morabba';
          src: url('${morabbaMedBase64}') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        * { box-sizing: border-box; }
        
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .page-break { break-after: page; page-break-after: always; }
          .no-print { display: none !important; }
        }

        .break-inside-avoid {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .pdf-body {
          font-family: 'Vazirmatn', system-ui, sans-serif;
        }

        .pdf-header-text {
          font-family: 'Morabba', system-ui, sans-serif;
        }

        .gold-line {
          background: linear-gradient(90deg, #059669, #0d9488, #10b981, #0d9488, #059669);
        }

        .day-table th {
          font-size: 11px;
          padding: 6px 8px;
          white-space: nowrap;
        }

        .day-table td {
          font-size: 11px;
          padding: 5px 8px;
        }

        .day-table tr:nth-child(even) {
          background-color: #f8fafc;
        }

        .day-table tr:nth-child(odd) {
          background-color: #ffffff;
        }
      `,
        }}
      />

      <title>{pdfFileName}</title>
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-400">پیش‌نمایش سند برنامه تمرینی جهت پرینت و خروجی PDF</span>
          </div>
          <PrintButton fileName={pdfFileName} />
        </div>
      </div>

      {pages.map((pageDays, pageIndex) => (
        <div
          key={pageIndex}
          className={`w-full bg-white ${pageIndex < pages.length - 1 ? "page-break" : ""}`}
        >
          <div className="max-w-[190mm] mx-auto py-8 px-4 pdf-body">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 mb-1">
              {/* Right Side: Logo & Brand */}
              <div className="flex items-center gap-3">
                {logoBase64 ? (
                  <img src={logoBase64} alt="NutriTrain Logo" className="w-44 h-12 object-contain" />
                ) : (
                  <div className="flex flex-col text-right pdf-header-text">
                    <h2 className="text-xl font-black tracking-tight text-emerald-800 leading-tight">NutriTrain</h2>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">سامانه هوشمند برنامه‌ریزی ورزشی</p>
                  </div>
                )}
              </div>

              {/* Left Side: Plan/Client info */}
              <div className="flex flex-col gap-0.5 items-end text-left pdf-header-text">
                <h1 className="text-lg font-extrabold text-slate-900">
                  {toPersianDigits(routineWithClient.title)}
                </h1>
                {routineWithClient.client ? (
                  <div className="flex flex-wrap justify-end gap-2 text-[10px] font-bold text-slate-600 mt-0.5">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                      نام: {routineWithClient.client.name}
                    </span>
                    {routineWithClient.client.weight && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded">
                        وزن: {toPersianDigits(routineWithClient.client.weight)} کیلوگرم
                      </span>
                    )}
                    {routineWithClient.client.height && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded">
                        قد: {toPersianDigits(routineWithClient.client.height)} سانتی‌متر
                      </span>
                    )}
                    {routineWithClient.client.age && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded">
                        سن: {toPersianDigits(routineWithClient.client.age)} سال
                      </span>
                    )}
                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                      تاریخ: {toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(routineWithClient.createdAt)))}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 items-end mt-0.5">
                    <p className="text-[10px] font-medium text-slate-500">
                      {toPersianDigits(routineWithClient.description) || "برنامه تمرینی عمومی"}
                    </p>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                      تاریخ: {toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(routineWithClient.createdAt)))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Accent line */}
            <div className="gold-line h-[3px] rounded-full mb-5" />

            {/* Days */}
            <div className="space-y-4">
              {pageDays.map((day: any, dayIndex: number) => (
                <div
                  key={day.id}
                  className="border border-slate-300 rounded-lg overflow-hidden break-inside-avoid"
                >
                  {/* Day Header */}
                  <div className="bg-emerald-900 text-white px-3 py-[7px] flex justify-between items-center">
                    <h3 className="text-[13px] font-bold pdf-header-text">
                      {toPersianDigits(day.label) || `روز ${toPersianDigits(dayIndex + 1)}`}
                    </h3>
                    <span className="text-[10px] opacity-70">
                      {toPersianDigits(day.exercises.length)} حرکت
                    </span>
                  </div>

                  {day.exercises.length > 0 ? (
                    <table className="w-full day-table border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="font-bold w-8 text-center text-slate-600">ردیف</th>
                          <th className="font-bold text-right text-slate-800">نام حرکت</th>
                          <th className="font-bold w-12 text-center text-slate-600">ست</th>
                          <th className="font-bold w-16 text-center text-slate-600">تکرار</th>
                          <th className="font-bold w-16 text-center text-slate-600">استراحت</th>
                          <th className="font-bold w-24 text-right text-slate-600">توضیحات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.exercises.map((ex: any, idx: number) => (
                          <tr key={ex.id} className="border-b border-slate-100 last:border-b-0">
                            <td className="text-center font-bold text-slate-400">
                              {toPersianDigits(idx + 1)}
                            </td>
                            <td className="text-right font-semibold text-slate-900">{ex.name}</td>
                            <td className="text-center font-bold text-slate-700">
                              {toPersianDigits(ex.sets)}
                            </td>
                            <td className="text-center font-medium text-slate-700">
                              {toPersianDigits(ex.repetitions)}
                            </td>
                            <td className="text-center text-slate-500">
                              {toPersianDigits(ex.restTime)}
                            </td>
                            <td className="text-right text-slate-500">
                              {toPersianDigits(ex.customDescription) || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-3 text-center text-slate-400 text-xs font-medium">
                      استراحت
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-5 flex justify-between items-center text-[9px] text-slate-400 pdf-header-text">
              <span>
                صفحه {toPersianDigits(pageIndex + 1)} از {toPersianDigits(pages.length)}
              </span>
              <span>برنامه تمرینی اختصاصی NutriTrain</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
