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

type GroupedRow = {
  id: string
  groupType: string
  groupId: string | null
  exercises: any[]
}

function getGroupedRowsForDay(rawExercises: any[]): GroupedRow[] {
  const rows: GroupedRow[] = []
  let currentGroup: any[] = []
  let currentGroupId: string | null = null

  for (const ex of rawExercises) {
    if (ex.groupId && (ex.groupType === "SUPERSET" || ex.groupType === "TRISET" || ex.groupType === "CIRCUIT")) {
      if (currentGroupId === ex.groupId) {
        currentGroup.push(ex)
      } else {
        if (currentGroup.length > 0) {
          rows.push({
            id: currentGroup[0].id,
            groupType: currentGroup[0].groupType,
            groupId: currentGroupId,
            exercises: currentGroup,
          })
        }
        currentGroupId = ex.groupId
        currentGroup = [ex]
      }
    } else {
      if (currentGroup.length > 0) {
        rows.push({
          id: currentGroup[0].id,
          groupType: currentGroup[0].groupType,
          groupId: currentGroupId,
          exercises: currentGroup,
        })
        currentGroup = []
        currentGroupId = null
      }
      rows.push({
        id: ex.id,
        groupType: ex.groupType || "NORMAL",
        groupId: null,
        exercises: [ex],
      })
    }
  }

  if (currentGroup.length > 0) {
    rows.push({
      id: currentGroup[0].id,
      groupType: currentGroup[0].groupType,
      groupId: currentGroupId,
      exercises: currentGroup,
    })
  }

  return rows
}

export default async function RoutinePdfPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const search = searchParams ? await searchParams : {}

  const routine = await prisma.routine.findUnique({
    where: { id },
    include: {
      trainer: true,
      history: {
        include: { client: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      workoutDays: {
        include: { exercises: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!routine) return notFound()

  let client: any = null
  if (search?.clientId) {
    client = await prisma.client.findUnique({
      where: { id: search.clientId },
    })
  }

  const routineWithClient = { ...routine, client }

  const trainerName = routine.trainer?.name ? routine.trainer.name.replace(/\s+/g, "_") : "مربی"
  const clientOrTitle = client?.name ? client.name.replace(/\s+/g, "_") : routine.title.replace(/\s+/g, "_")
  const dateStr = new Date(routine.createdAt).toLocaleDateString("fa-IR").replace(/\//g, "-")
  const pdfFileName = `NutriTrain.ir-${trainerName}-${clientOrTitle}-${dateStr}`

  // Smart chunking for PDF pages using GroupedRows
  const MAX_PAGE_HEIGHT = 960
  const DAY_HEADER_HEIGHT = 36
  const TABLE_HEADER_HEIGHT = 32
  const BASE_ROW_HEIGHT = 30
  const DAY_GAP = 20

  const days = routine.workoutDays
  const pages: typeof days[] = []
  let currentPage: typeof days = []
  let currentHeight = 0

  for (const day of days) {
    const groupedRows = getGroupedRowsForDay(day.exercises)
    const dayHeight =
      DAY_HEADER_HEIGHT + TABLE_HEADER_HEIGHT + groupedRows.length * BASE_ROW_HEIGHT + DAY_GAP

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

  const groupBadgesMap: Record<string, string> = {
    SUPERSET: "سوپرست",
    TRISET: "تری‌ست",
    CIRCUIT: "سیرکت (چرخه‌ای)",
    DROPSET: "دراپ‌ست",
    REST_PAUSE: "رست-پاز",
    TEMPO: "تمپو",
  }

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
          padding: 6px 8px;
          vertical-align: middle;
        }
        `,
        }}
      />

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
            <div className="flex justify-between items-end pb-2">
              {/* Right Side (RTL Right): Logo + Trainer Info */}
              <div className="flex flex-col gap-2 text-right">
                <div className="flex items-center gap-3">
                  {logoBase64 ? (
                    <img src={logoBase64} alt="NutriTrain Logo" className="w-36 h-10 object-contain" />
                  ) : (
                    <h2 className="text-xl font-black text-emerald-800 pdf-header-text">NutriTrain</h2>
                  )}

                  <div className="flex flex-col text-right pr-3 border-r-2 border-emerald-600/40">
                    <span className="text-sm font-extrabold text-slate-900 leading-tight pdf-header-text whitespace-nowrap">
                      {trainerName}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 mt-0.5 tracking-wide pdf-body whitespace-nowrap">
                      مربی رسمی فدراسیون بدنسازی و پرورش اندام
                    </span>
                  </div>
                </div>
              </div>

              {/* Left Side (RTL Left): Routine Title (Morabba) & Date (Vazirmatn) */}
              <div className="flex flex-col items-end text-left space-y-1">
                <h1 className="text-lg font-extrabold text-slate-900 leading-tight pdf-header-text whitespace-nowrap">
                  {toPersianDigits(routine.title)}
                </h1>

                <span className="text-[10px] font-bold text-slate-500 pdf-body whitespace-nowrap">
                  تاریخ صدور: {toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(routine.createdAt)))}
                </span>
              </div>
            </div>

            {/* Client Metadata Pills placed neatly above the accent line on the right */}
            {client ? (
              <div className="flex flex-wrap items-center justify-start gap-1.5 text-[10px] font-bold text-slate-700 pb-2 pdf-body">
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                  نام ورزشکار: {client.name}
                </span>
                {client.weight && (
                  <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                    وزن: {toPersianDigits(client.weight)} کیلوگرم
                  </span>
                )}
                {client.height && (
                  <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                    قد: {toPersianDigits(client.height)} سانتی‌متر
                  </span>
                )}
                {client.age && (
                  <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                    سن: {toPersianDigits(client.age)} سال
                  </span>
                )}
              </div>
            ) : routine.description ? (
              <div className="flex justify-start pb-2">
                <span className="text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full pdf-body whitespace-nowrap">
                  {toPersianDigits(routine.description)}
                </span>
              </div>
            ) : null}

            {/* Accent line */}
            <div className="gold-line h-[3px] rounded-full mb-5" />

            {/* Days */}
            <div className="space-y-4">
              {pageDays.map((day: any, dayIndex: number) => {
                const groupedRows = getGroupedRowsForDay(day.exercises)

                return (
                  <div
                    key={day.id}
                    className="border border-slate-300 rounded-lg overflow-hidden break-inside-avoid"
                  >
                    {/* Day Header */}
                    <div className="bg-emerald-900 text-white px-3 py-[7px] flex justify-between items-center">
                      <h3 className="text-[13px] font-bold pdf-header-text">
                        {toPersianDigits(day.label) || `روز ${toPersianDigits(dayIndex + 1)}`}
                      </h3>
                    </div>

                    {groupedRows.length > 0 ? (
                      <table className="w-full day-table border-collapse" style={{ tableLayout: "fixed" }}>
                        <colgroup>
                          <col style={{ width: "5%" }} />
                          <col style={{ width: "48%" }} />
                          <col style={{ width: "8%" }} />
                          <col style={{ width: "12%" }} />
                          <col style={{ width: "13%" }} />
                          <col style={{ width: "14%" }} />
                        </colgroup>
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300">
                            <th className="font-bold text-center text-slate-600">ردیف</th>
                            <th className="font-bold text-right text-slate-800">نام حرکت</th>
                            <th className="font-bold text-center text-slate-600">ست</th>
                            <th className="font-bold text-center text-slate-600">تکرار</th>
                            <th className="font-bold text-center text-slate-600">استراحت</th>
                            <th className="font-bold text-right text-slate-600">توضیحات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedRows.map((row, idx) => {
                            const isGrouped = row.exercises.length > 1 || row.groupType !== "NORMAL"
                            const mainEx = row.exercises[0]
                            const finalRest = row.exercises[row.exercises.length - 1]?.restTime

                            // Clean rest time text (replace "بلافاصله (بدون استراحت)" with "بلافاصله")
                            const cleanedRest = (finalRest || mainEx.restTime || "")
                              .replace(/بلافاصله\s*\(بدون استراحت\)/g, "بلافاصله")
                              .replace(/بدون استراحت/g, "بلافاصله")

                            return (
                              <tr key={row.id} className="border-b border-slate-200 last:border-b-0">
                                {/* 1. Row Index Number (Counts as 1 row for the entire superset/triset) */}
                                <td className="text-center font-bold text-slate-500 border-l border-slate-200">
                                  {toPersianDigits(idx + 1)}
                                </td>

                                {/* 2. Exercise Name Cell (Grouped stacked if superset/triset) */}
                                <td className="text-right border-l border-slate-200 py-2">
                                  {isGrouped ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                                          {groupBadgesMap[row.groupType] || row.groupType}
                                        </span>
                                      </div>
                                      {row.exercises.map((subEx, sIdx) => (
                                        <div key={subEx.id || sIdx} className="flex items-center gap-1 text-[11px]">
                                          <span className="font-bold text-emerald-800">
                                            {toPersianDigits(sIdx + 1)}.
                                          </span>
                                          <span className="font-bold text-slate-900">{subEx.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="font-semibold text-slate-900">
                                      {mainEx.name}
                                    </div>
                                  )}
                                </td>

                                {/* 3. Sets */}
                                <td className="text-center font-bold text-slate-800 border-l border-slate-200">
                                  {toPersianDigits(mainEx.sets)}
                                </td>

                                {/* 4. Repetitions */}
                                <td className="text-center font-medium text-slate-700 border-l border-slate-200">
                                  {isGrouped
                                    ? row.exercises.map((e) => toPersianDigits(e.repetitions)).join(" + ")
                                    : toPersianDigits(mainEx.repetitions)}
                                </td>

                                {/* 5. Rest Time */}
                                <td className="text-center text-slate-600 border-l border-slate-200 font-semibold">
                                  {toPersianDigits(cleanedRest)}
                                </td>

                                {/* 6. Custom Notes */}
                                <td className="text-right text-slate-500">
                                  {toPersianDigits(
                                    row.exercises
                                      .map((e) => e.customDescription)
                                      .filter(Boolean)
                                      .join(" | ")
                                  ) || "—"}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-3 text-center text-slate-400 text-xs font-medium">
                        استراحت
                      </div>
                    )}
                  </div>
                )
              })}
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
