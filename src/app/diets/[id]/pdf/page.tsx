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

const toPersianDigitsInHTML = (html: string | undefined | null) => {
  if (!html) return ""
  const parts = html.split(/(<[^>]*>)/g)
  return parts
    .map((part) => {
      if (part.startsWith("<") && part.endsWith(">")) {
        return part
      }
      return toPersianDigits(part)
    })
    .join("")
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

export default async function DietPdfPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const search = searchParams ? await searchParams : {}

  const diet = await prisma.dietPlan.findUnique({
    where: { id },
    include: {
      history: {
        take: 1,
        include: { client: true },
      },
    },
  })

  if (!diet) return notFound()

  let client = diet.history[0]?.client
  if (!client && search?.clientId) {
    client = await prisma.client.findUnique({
      where: { id: search.clientId },
    }) as any
  }

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

        .pdf-body {
          font-family: 'Vazirmatn', system-ui, sans-serif;
        }

        .pdf-header-text {
          font-family: 'Morabba', system-ui, sans-serif;
        }

        .gold-line {
          background: linear-gradient(90deg, #0d9488, #059669, #14b8a6, #059669, #0d9488);
        }

        .diet-content h2, .diet-content h3 {
          font-family: 'Morabba', system-ui, sans-serif;
          break-after: avoid;
          page-break-after: avoid;
        }

        .diet-content h2 {
          font-size: 16px;
          font-weight: bold;
          color: #0f766e;
          margin-top: 14px;
          margin-bottom: 6px;
          border-bottom: 1px solid #ccfbf1;
          padding-bottom: 4px;
        }

        .diet-content h3 {
          font-size: 14px;
          font-weight: bold;
          color: #115e59;
          margin-top: 12px;
          margin-bottom: 4px;
        }

        .diet-content p {
          font-size: 12px;
          line-height: 1.6;
          color: #334155;
          margin-bottom: 8px;
        }

        .diet-content ul {
          list-style-type: disc;
          margin-right: 24px;
          margin-bottom: 12px;
          font-size: 11.5px;
          line-height: 1.6;
          color: #334155;
        }

        .diet-content ol {
          list-style-type: persian;
          margin-right: 24px;
          margin-bottom: 12px;
          font-size: 11.5px;
          line-height: 1.6;
          color: #334155;
        }

        .diet-content li {
          margin-bottom: 6px;
        }

        .diet-content blockquote {
          margin-right: 40px !important;
          margin-left: 0 !important;
          border-right: 4px solid #cbd5e1 !important;
          border-left: none !important;
          padding-right: 16px !important;
          padding-left: 0 !important;
          color: #475569;
        }

        .diet-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 11px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .diet-content th {
          background-color: #f0fdf4;
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
        }

        .diet-content td {
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
        }
      `,
        }}
      />

      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-teal-400">پیش‌نمایش سند برنامه تغذیه جهت پرینت و خروجی PDF</span>
          </div>
          <PrintButton />
        </div>
      </div>

      <div className="w-full bg-white">
        <div className="max-w-[190mm] mx-auto py-8 px-4 pdf-body">
          {/* Header */}
          <div className="flex justify-between items-center pb-3 mb-1">
            {/* Right Side: Logo & Brand */}
            <div className="flex items-center gap-3">
              {logoBase64 ? (
                <img src={logoBase64} alt="NutriTrain Logo" className="w-44 h-12 object-contain" />
              ) : (
                <div className="flex flex-col text-right pdf-header-text">
                  <h2 className="text-xl font-black tracking-tight text-teal-800 leading-tight">NutriTrain</h2>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">سامانه هوشمند برنامه‌ریزی تغذیه</p>
                </div>
              )}
            </div>

            {/* Left Side: Diet/Client info */}
            <div className="flex flex-col gap-0.5 items-end text-left pdf-header-text">
              <h1 className="text-lg font-extrabold text-slate-900">{toPersianDigits(diet.title)}</h1>
              {client ? (
                <div className="flex flex-wrap justify-end gap-2 text-[10px] font-bold text-slate-600 mt-0.5">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">نام: {client.name}</span>
                  {client.weight && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                      وزن: {toPersianDigits(client.weight)} کیلوگرم
                    </span>
                  )}
                  {client.height && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                      قد: {toPersianDigits(client.height)} سانتی‌متر
                    </span>
                  )}
                  {client.age && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                      سن: {toPersianDigits(client.age)} سال
                    </span>
                  )}
                  <span className="bg-slate-100 px-2 py-0.5 rounded">
                    تاریخ: {toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(diet.createdAt)))}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1 items-end mt-0.5">
                  <p className="text-[10px] font-medium text-slate-500">
                    {toPersianDigits(diet.description) || "برنامه تغذیه‌ای اختصاصی"}
                  </p>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                    تاریخ: {toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(diet.createdAt)))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Accent line */}
          <div className="gold-line h-[3px] rounded-full mb-5" />

          {/* Body Content */}
          <div
            className="diet-content min-h-[700px] border border-slate-200 rounded-xl p-6 bg-slate-50/30"
            dangerouslySetInnerHTML={{ __html: toPersianDigitsInHTML(diet.content) }}
          />

          {/* Footer */}
          <div className="mt-6 flex justify-between items-center text-[9px] text-slate-400 pdf-header-text border-t pt-3 border-slate-200">
            <span>صفحه ۱ از ۱</span>
            <span>برنامه تغذیه و رژیم غذایی NutriTrain</span>
          </div>
        </div>
      </div>
    </div>
  )
}
