import { notFound } from "next/navigation"
import Link from "next/link"
import fs from "fs"
import path from "path"
import prisma from "@/lib/prisma"
import { PrintButton } from "@/components/print-button"
import { AutoPrintTrigger } from "@/components/auto-print-trigger"
import { ArrowRight } from "lucide-react"

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

function getAssetDataUri(assetPathOrUrl: string | null | undefined, defaultMime = "image/png"): string {
  if (!assetPathOrUrl) return ""
  if (assetPathOrUrl.startsWith("data:")) return assetPathOrUrl
  try {
    const cleanPath = assetPathOrUrl.replace(/^[/\\]+/, "")
    const fullPath = path.join(process.cwd(), "public", cleanPath)
    if (!fs.existsSync(fullPath)) return ""
    const fileBuffer = fs.readFileSync(fullPath)
    const ext = path.extname(cleanPath).toLowerCase()
    let mime = defaultMime
    if (ext === ".svg") mime = "image/svg+xml"
    else if (ext === ".webp") mime = "image/webp"
    else if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg"
    else if (ext === ".png") mime = "image/png"
    return `data:${mime};base64,${fileBuffer.toString("base64")}`
  } catch (e) {
    return ""
  }
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ clientId?: string; autoPrint?: string; error?: string }>
}

export default async function DietPdfPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const search = searchParams ? await searchParams : {}

  const diet = await prisma.dietPlan.findUnique({
    where: { id },
    include: {
      trainer: true,
    },
  })

  if (!diet) return notFound()

  let client = null
  if (search?.clientId) {
    client = await prisma.client.findUnique({
      where: { id: search.clientId },
    })
  }

  // Generate suggested PDF filename: NutriTrain.ir-{trainer's name}-{client name if assigned if not diet title}-{date}
  const trainerName = diet.trainer?.name ? diet.trainer.name.replace(/\s+/g, "_") : "مربی"
  const clientOrTitle = client?.name ? client.name.replace(/\s+/g, "_") : diet.title.replace(/\s+/g, "_")
  const dateStr = new Date(diet.createdAt).toLocaleDateString("fa-IR").replace(/\//g, "-")
  const pdfFileName = `NutriTrain.ir-${trainerName}-${clientOrTitle}-${dateStr}`

  const trainer = diet.trainer
  const trainerLogo = getAssetDataUri(trainer?.logoUrl)
  const logoBase64 = getAssetDataUri("NutriTrain.png", "image/png")
  const vazirRegBase64 = getAssetDataUri("fonts/Vazirmatn-Regular.woff2", "font/woff2")
  const vazirBoldBase64 = getAssetDataUri("fonts/Vazirmatn-Bold.woff2", "font/woff2")
  const morabbaMedBase64 = getAssetDataUri("fonts/Morabba-Medium.woff2", "font/woff2")

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
          table-layout: auto;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .diet-content th {
          background-color: #f0fdf4;
          padding: 6px 10px;
          border: 1px solid #cbd5e1;
          font-weight: bold;
          white-space: nowrap;
          text-align: right;
        }

        .diet-content td {
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          vertical-align: middle;
          text-align: right;
        }
      `,
        }}
      />

      <title>{pdfFileName}</title>
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print bg-slate-900 text-white px-4 py-3 sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Link
              href={search?.clientId ? `/clients/${search.clientId}` : `/diets/${id}`}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors shrink-0"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>بازگشت به برنامه</span>
            </Link>
            <span className="text-teal-400 text-xs font-bold hidden sm:inline">پیش‌نمایش سند برنامه تغذیه جهت پرینت و خروجی PDF</span>
          </div>
          <PrintButton fileName={pdfFileName} />
        </div>
      </div>

      {search?.error === "server_engine_fallback" && (
        <div className="no-print max-w-4xl mx-auto mt-3 mx-4 p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xs">
          <span>✨ نسخه استاندارد چاپی لود شد. پنجره چاپ/ذخیره PDF آماده فراخوانی است.</span>
        </div>
      )}

      {search?.autoPrint === "true" && <AutoPrintTrigger delay={500} />}

      <div className="w-full bg-slate-100 min-h-screen py-4 sm:py-8 overflow-x-auto print:bg-white print:p-0 print:overflow-visible">
        <div className="min-w-[720px] max-w-[190mm] mx-auto px-2 sm:px-4 print:min-w-0 print:max-w-none print:px-0">
          {/* Scroll hint for mobile screens */}
          <div className="no-print sm:hidden text-center text-[11px] font-bold text-slate-500 py-1 mb-2">
            👈 برای مشاهده کامل جزئیات به چپ و راست اسکرول کنید
          </div>
          <div className="w-full bg-white shadow-md sm:rounded-2xl p-6 sm:p-8 print:shadow-none print:rounded-none print:p-0">
            <div className="w-full pdf-body">
          {/* Header */}
          <div className="flex justify-between items-end pb-2">
            {/* Right Side: Logo & Brand */}
            <div className="flex items-center gap-3">
              {trainerLogo ? (
                <img
                  src={trainerLogo}
                  alt={trainer?.name || "لوگوی مربی"}
                  className="max-h-12 max-w-[140px] object-contain rounded-md"
                />
              ) : logoBase64 ? (
                <img src={logoBase64} alt="NutriTrain Logo" className="w-44 h-12 object-contain" />
              ) : (
                <div className="flex flex-col text-right pdf-header-text">
                  <h2 className="text-xl font-black tracking-tight text-teal-800 leading-tight">NutriTrain</h2>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">سامانه هوشمند برنامه‌ریزی تغذیه</p>
                </div>
              )}

              <div className="flex flex-col text-right pr-3 border-r-2 border-teal-600/40">
                <span className="text-sm font-extrabold text-slate-900 leading-tight pdf-header-text whitespace-nowrap">
                  {trainer?.name || "مربی"}
                </span>
                <span className="text-[9px] font-bold text-teal-700 mt-0.5 tracking-wide pdf-body whitespace-nowrap">
                  {trainer?.bio ? toPersianDigits(trainer.bio) : "مشاور تخصصی تغذیه ورزشی و مربیگری"}
                </span>
              </div>
            </div>

            {/* Left Side: Diet Title & Date */}
            <div className="flex flex-col gap-0.5 items-end text-left pdf-header-text">
              <h1 className="text-lg font-extrabold text-slate-900">{toPersianDigits(diet.title)}</h1>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 pdf-body whitespace-nowrap">
                <span>تاریخ صدور: {toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(diet.createdAt)))}</span>
                {trainerLogo && logoBase64 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-teal-700 font-semibold">سامانه NutriTrain</span>
                  </>
                )}
              </div>
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
          ) : diet.description ? (
            <div className="flex justify-start pb-2">
              <span className="text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full pdf-body whitespace-nowrap">
                {toPersianDigits(diet.description)}
              </span>
            </div>
          ) : null}

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
  </div>
</div>
  )
}
