import fs from "fs"
import path from "path"
import puppeteer, { Browser } from "puppeteer"
import { acquirePdfPage, releasePdfPage, getExecutablePath, PUPPETEER_VPS_ARGS } from "./puppeteer-pool"

const toPersianDigits = (num: string | number | undefined | null) => {
  if (num === undefined || num === null) return ""
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
  return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)])
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

export async function generateRoutinePdfBuffer(routine: any, client?: any, trainer?: any): Promise<Buffer> {
  const trainerData = trainer || routine.trainer
  const trainerLogo = getAssetDataUri(trainerData?.logoUrl)
  const logoBase64 = getAssetDataUri("NutriTrain.png", "image/png")
  const vazirRegBase64 = getAssetDataUri("fonts/Vazirmatn-Regular.woff2", "font/woff2")
  const vazirBoldBase64 = getAssetDataUri("fonts/Vazirmatn-Bold.woff2", "font/woff2")
  const morabbaMedBase64 = getAssetDataUri("fonts/Morabba-Medium.woff2", "font/woff2")

  const trainerName = trainerData?.name || "مربی تخصصی NutriTrain"

  const groupBadgesMap: Record<string, string> = {
    SUPERSET: "سوپرست",
    TRISET: "تری‌ست",
    CIRCUIT: "سیرکت (چرخه‌ای)",
    DROPSET: "دراپ‌ست",
    REST_PAUSE: "رست-پاز",
    TEMPO: "تمپو",
  }

  const workoutDaysHtml = routine.workoutDays
    .map((day: any, dayIdx: number) => {
      const groupedRows = getGroupedRowsForDay(day.exercises)

      const exercisesHtml = groupedRows
        .map((row, idx) => {
          const isGrouped = row.exercises.length > 1 || row.groupType !== "NORMAL"
          const mainEx = row.exercises[0] || {}
          const finalRest = row.exercises[row.exercises.length - 1]?.restTime

          const cleanedRest = (finalRest || mainEx.restTime || "")
            .replace(/بلافاصله\s*\(بدون استراحت\)/g, "بلافاصله")
            .replace(/بدون استراحت/g, "بلافاصله")

          const exNameHtml = isGrouped
            ? `<div style="display: flex; flex-direction: column; gap: 2px;">
                 <span style="font-size: 9px; font-weight: bold; color: #92400e; background-color: #fef3c7; border: 1px solid #fcd34d; padding: 1px 4px; border-radius: 4px; width: fit-content;">
                   ${groupBadgesMap[row.groupType] || row.groupType}
                 </span>
                 ${row.exercises
                   .map(
                     (sEx: any, sIdx: number) =>
                       `<div style="font-size: 11px; font-weight: bold; color: #0f172a;">
                          <span style="color: #065f46;">${toPersianDigits(sIdx + 1)}.</span> ${sEx.name || "حرکت"}
                        </div>`
                   )
                   .join("")}
               </div>`
            : `<div style="font-weight: bold; color: #0f172a;">
                 ${mainEx.name || "حرکت تمرینی"}
               </div>`

          const repsHtml = isGrouped
            ? row.exercises.map((e: any) => toPersianDigits(e.repetitions)).join(" + ")
            : toPersianDigits(mainEx.repetitions || "10-12")

          const notesHtml = toPersianDigits(
            row.exercises
              .map((e: any) => e.customDescription)
              .filter(Boolean)
              .join(" | ")
          ) || "—"

          return `
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
              <td style="text-align: center; font-weight: bold; color: #64748b; padding: 6px 4px; border-left: 1px solid #e2e8f0; white-space: nowrap;">${toPersianDigits(idx + 1)}</td>
              <td style="text-align: right; padding: 6px 8px; border-left: 1px solid #e2e8f0;">${exNameHtml}</td>
              <td style="text-align: center; font-weight: bold; color: #1e293b; padding: 6px 4px; border-left: 1px solid #e2e8f0; white-space: nowrap;">${toPersianDigits(mainEx.sets || 3)}</td>
              <td style="text-align: center; font-weight: 600; color: #334155; padding: 6px 4px; border-left: 1px solid #e2e8f0; white-space: nowrap;">${repsHtml}</td>
              <td style="text-align: center; font-weight: 600; color: #475569; padding: 6px 4px; border-left: 1px solid #e2e8f0; white-space: nowrap;">${toPersianDigits(cleanedRest)}</td>
              <td style="text-align: right; color: #475569; font-size: 10px; line-height: 1.5; padding: 6px 8px;">${notesHtml}</td>
            </tr>
          `
        })
        .join("")

      return `
      <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 16px; page-break-inside: avoid;">
        <div style="background-color: #065f46; color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-family: 'Morabba', serif; font-size: 13px; font-weight: bold;">
          <span>${toPersianDigits(day.label) || `روز ${toPersianDigits(dayIdx + 1)}`}</span>
        </div>
        ${
          groupedRows.length > 0
            ? `
          <table style="width: 100%; table-layout: auto; border-collapse: collapse; text-align: right; font-size: 11px;">
            <colgroup>
              <col style="width: 36px;" />
              <col style="width: 28%;" />
              <col style="width: 46px;" />
              <col style="width: 70px;" />
              <col style="width: 76px;" />
              <col style="width: auto;" />
            </colgroup>
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; color: #334155;">
                <th style="text-align: center; padding: 6px 4px; border-left: 1px solid #e2e8f0; white-space: nowrap;">#</th>
                <th style="text-align: right; padding: 6px 8px; border-left: 1px solid #e2e8f0;">نام حرکت</th>
                <th style="text-align: center; padding: 6px 4px; border-left: 1px solid #e2e8f0; white-space: nowrap;">ست</th>
                <th style="text-align: center; padding: 6px 4px; border-left: 1px solid #e2e8f0; white-space: nowrap;">تکرار</th>
                <th style="text-align: center; padding: 6px 4px; border-left: 1px solid #e2e8f0; white-space: nowrap;">استراحت</th>
                <th style="text-align: right; padding: 6px 8px;">توضیحات و نکات اجرایی</th>
              </tr>
            </thead>
            <tbody>
              ${exercisesHtml}
            </tbody>
          </table>
        `
            : `<div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 11px;">استراحت</div>`
        }
      </div>
    `
    })
    .join("")

  const html = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="utf-8">
      <style>
        @font-face {
          font-family: 'Vazirmatn';
          src: url('${vazirRegBase64}') format('woff2');
          font-weight: 400;
        }
        @font-face {
          font-family: 'Vazirmatn';
          src: url('${vazirBoldBase64}') format('woff2');
          font-weight: 700;
        }
        @font-face {
          font-family: 'Morabba';
          src: url('${morabbaMedBase64}') format('woff2');
          font-weight: 500;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Vazirmatn', system-ui, sans-serif;
          background: #ffffff;
          color: #0f172a;
          padding: 24px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 8px;
          margin-bottom: 4px;
        }
        .right-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo {
          max-height: 48px;
          max-width: 140px;
          object-fit: contain;
        }
        .trainer-meta {
          font-family: 'Morabba', serif;
          text-align: right;
        }
        .title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .client-info {
          font-size: 10px;
          font-weight: bold;
          color: #475569;
          margin-top: 4px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .badge {
          background-color: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .gold-line {
          height: 3px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #059669, #0d9488, #10b981, #0d9488, #059669);
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="display: flex; flex-direction: column; gap: 8px; text-align: right;">
          <div class="right-header">
            ${
              trainerLogo
                ? `<img src="${trainerLogo}" class="logo" alt="${trainerName}" style="border-radius: 6px;" />`
                : logoBase64
                ? `<img src="${logoBase64}" class="logo" alt="NutriTrain Logo" style="height: 40px; width: 144px;" />`
                : `<h2 style="font-family: 'Morabba'; font-size: 20px; color: #065f46;">NutriTrain</h2>`
            }
            <div style="display: flex; flex-direction: column; text-align: right; border-right: 2px solid #059669; padding-right: 10px; margin-right: 6px;">
              <span style="font-family: 'Morabba', serif; font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.2; white-space: nowrap;">${trainerName}</span>
              <span style="font-family: 'Vazirmatn', sans-serif; font-size: 9px; font-weight: 700; color: #047857; margin-top: 2px; white-space: nowrap;">${trainerData?.bio ? toPersianDigits(trainerData.bio) : "مربی رسمی فدراسیون بدنسازی و پرورش اندام"}</span>
            </div>
          </div>
        </div>

        <div class="trainer-meta" style="display: flex; flex-direction: column; align-items: flex-end; text-align: left;">
          <div class="title" style="font-family: 'Morabba', serif; font-size: 18px; font-weight: 800; color: #0f172a; white-space: nowrap;">${toPersianDigits(routine.title)}</div>
          <div style="display: flex; align-items: center; gap: 6px; font-family: 'Vazirmatn', sans-serif; font-size: 10px; font-weight: 700; color: #64748b; margin-top: 2px; white-space: nowrap;">
            <span>تاریخ صدور: ${toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(routine.createdAt)))}</span>
            ${trainerLogo && logoBase64 ? `<span style="color: #cbd5e1;">•</span><span style="color: #047857;">سامانه NutriTrain</span>` : ""}
          </div>
        </div>
      </div>

      ${client ? `
        <div class="client-info" style="font-family: 'Vazirmatn', sans-serif; display: flex; gap: 6px; flex-wrap: wrap; text-align: right; justify-content: flex-start; padding-bottom: 8px;">
          <span class="badge" style="border-radius: 9999px; white-space: nowrap;">نام ورزشکار: ${client.name}</span>
          ${client.primarySport ? `<span class="badge" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-weight: bold; border-radius: 9999px; white-space: nowrap;">ورزش تخصصی: ${toPersianDigits(client.primarySport)}</span>` : ""}
          ${client.weight ? `<span class="badge" style="border-radius: 9999px; white-space: nowrap;">وزن: ${toPersianDigits(client.weight)} کیلوگرم</span>` : ""}
          ${client.height ? `<span class="badge" style="border-radius: 9999px; white-space: nowrap;">قد: ${toPersianDigits(client.height)} سانتی‌متر</span>` : ""}
          ${client.age ? `<span class="badge" style="border-radius: 9999px; white-space: nowrap;">سن: ${toPersianDigits(client.age)} سال</span>` : ""}
        </div>
      ` : ""}

      <div class="gold-line"></div>

      ${(() => {
        const sportCtx = routine.sportContext as any || (routine.description ? { description: routine.description } : null)
        const sportName = sportCtx?.primarySport || client?.primarySport

        if (!sportCtx && !sportName) return ""

        const rawCoachNotes = String(sportCtx?.coachNotes || "")
          .replace(/^(دستورالعمل اجرایی مربی|دستورالعمل اجرایی|دستورالعمل اجرا|توصیه مربی)\s*[:：]\s*/gi, "")
          .replace(/^(توصیه مربی|دستورالعمل اجرایی|دستورالعمل اجرا)\s*[:：]\s*/gi, "")
          .trim()

        return `
          <div style="background-color: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 10px; padding: 8px 12px; margin-bottom: 14px; font-size: 10.5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: bold; color: #065f46; font-size: 11px;">
                🎯 تحلیل علمی و اهداف برنامه مکمل ${sportName ? `(ورزش اصلی: ${toPersianDigits(sportName)})` : ""}
              </span>
              ${sportCtx?.targetMuscleGroups && Array.isArray(sportCtx.targetMuscleGroups) ? `
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                  ${sportCtx.targetMuscleGroups.map((m: string) => `<span style="background-color: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">${toPersianDigits(m)}</span>`).join("")}
                </div>
              ` : ""}
            </div>
            ${sportCtx?.description ? `<p style="color: #334155; margin-top: 3px; line-height: 1.5; font-size: 10px;">${toPersianDigits(sportCtx.description)}</p>` : ""}
            ${rawCoachNotes ? `<div style="background-color: #fffbeb; border-right: 3px solid #f59e0b; padding: 4px 8px; margin-top: 6px; border-radius: 4px; color: #78350f; font-weight: bold; font-size: 10px;">💡 توصیه مربی: ${toPersianDigits(rawCoachNotes)}</div>` : ""}
          </div>
        `
      })()}

      ${workoutDaysHtml}
    </body>
    </html>
  `

  try {
    const { page } = await acquirePdfPage()
    try {
      await page.setContent(html, { waitUntil: "domcontentloaded" })
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "15mm", right: "12mm", bottom: "15mm", left: "12mm" },
      })
      return Buffer.from(pdfBuffer)
    } finally {
      await releasePdfPage(page)
    }
  } catch (poolErr) {
    console.warn("Puppeteer pool fallback activated for routine PDF:", poolErr)
    const execPath = getExecutablePath()
    let browser: Browser
    try {
      browser = await puppeteer.launch({
        headless: "shell",
        args: PUPPETEER_VPS_ARGS,
        ...(execPath ? { executablePath: execPath } : {}),
      })
    } catch {
      browser = await puppeteer.launch({
        headless: true,
        args: PUPPETEER_VPS_ARGS,
        ...(execPath ? { executablePath: execPath } : {}),
      })
    }
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: "domcontentloaded" })
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "15mm", right: "12mm", bottom: "15mm", left: "12mm" },
      })
      return Buffer.from(pdfBuffer)
    } finally {
      await browser.close()
    }
  }
}

export async function generateDietPdfBuffer(diet: any, client?: any, trainer?: any): Promise<Buffer> {
  const trainerData = trainer || diet.trainer
  const trainerLogo = getAssetDataUri(trainerData?.logoUrl)
  const logoBase64 = getAssetDataUri("NutriTrain.png", "image/png")
  const vazirRegBase64 = getAssetDataUri("fonts/Vazirmatn-Regular.woff2", "font/woff2")
  const vazirBoldBase64 = getAssetDataUri("fonts/Vazirmatn-Bold.woff2", "font/woff2")
  const morabbaMedBase64 = getAssetDataUri("fonts/Morabba-Medium.woff2", "font/woff2")

  const trainerName = trainerData?.name || "مربی تخصصی NutriTrain"

  const html = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="utf-8">
      <style>
        @font-face {
          font-family: 'Vazirmatn';
          src: url('${vazirRegBase64}') format('woff2');
          font-weight: 400;
        }
        @font-face {
          font-family: 'Vazirmatn';
          src: url('${vazirBoldBase64}') format('woff2');
          font-weight: 700;
        }
        @font-face {
          font-family: 'Morabba';
          src: url('${morabbaMedBase64}') format('woff2');
          font-weight: 500;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Vazirmatn', system-ui, sans-serif;
          background: #ffffff;
          color: #0f172a;
          padding: 24px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 8px;
        }
        .title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .diet-content {
          font-size: 13px;
          line-height: 1.8;
          color: #334155;
          margin-top: 16px;
        }
        .diet-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 11px;
          table-layout: auto;
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
      </style>
    </head>
    <body>
      <div class="header">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${
            trainerLogo
              ? `<img src="${trainerLogo}" style="max-height: 48px; max-width: 140px; object-fit: contain; border-radius: 6px;" alt="${trainerName}" />`
              : logoBase64
              ? `<img src="${logoBase64}" style="height: 48px; width: 176px; object-fit: contain;" alt="NutriTrain Logo" />`
              : `<div style="display: flex; flex-direction: column; text-align: right;"><h2 style="font-family: 'Morabba'; font-size: 20px; font-weight: 900; color: #115e59; margin: 0;">NutriTrain</h2><span style="font-size: 10px; font-weight: 700; color: #64748b; margin-top: 2px;">سامانه هوشمند برنامه‌ریزی تغذیه</span></div>`
          }
          <div style="display: flex; flex-direction: column; text-align: right; border-right: 2px solid #0d9488; padding-right: 10px; margin-right: 6px;">
            <span style="font-family: 'Morabba', serif; font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.2; white-space: nowrap;">${trainerName}</span>
            <span style="font-family: 'Vazirmatn', sans-serif; font-size: 9px; font-weight: 700; color: #0d9488; margin-top: 2px; white-space: nowrap;">${trainerData?.bio ? toPersianDigits(trainerData.bio) : "مشاور تخصصی تغذیه ورزشی و مربیگری"}</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; text-align: left;">
          <div class="title" style="font-family: 'Morabba', serif; font-size: 18px; font-weight: 800; color: #0f172a; white-space: nowrap;">${toPersianDigits(diet.title)}</div>
          <div style="display: flex; align-items: center; gap: 6px; font-family: 'Vazirmatn', sans-serif; font-size: 10px; font-weight: 700; color: #64748b; margin-top: 2px; white-space: nowrap;">
            <span>تاریخ صدور: ${toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(diet.createdAt)))}</span>
            ${trainerLogo && logoBase64 ? `<span style="color: #cbd5e1;">•</span><span style="color: #0f766e;">سامانه NutriTrain</span>` : ""}
          </div>
        </div>
      </div>

      ${client ? `
        <div style="font-family: 'Vazirmatn', sans-serif; display: flex; gap: 6px; flex-wrap: wrap; text-align: right; justify-content: flex-start; padding-bottom: 8px;">
          <span style="background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; color: #334155; white-space: nowrap;">نام ورزشکار: ${client.name}</span>
          ${client.weight ? `<span style="background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; color: #334155; white-space: nowrap;">وزن: ${toPersianDigits(client.weight)} کیلوگرم</span>` : ""}
          ${client.height ? `<span style="background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; color: #334155; white-space: nowrap;">قد: ${toPersianDigits(client.height)} سانتی‌متر</span>` : ""}
          ${client.age ? `<span style="background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; color: #334155; white-space: nowrap;">سن: ${toPersianDigits(client.age)} سال</span>` : ""}
        </div>
      ` : diet.description ? `
        <div style="display: flex; justify-content: flex-start; padding-bottom: 8px;">
          <div style="font-family: 'Vazirmatn', sans-serif; font-size: 10px; color: #64748b; white-space: nowrap; background-color: #f1f5f9; padding: 2px 8px; border-radius: 9999px;">
            ${toPersianDigits(diet.description)}
          </div>
        </div>
      ` : ""}
      
      <div style="height: 3px; border-radius: 9999px; background: linear-gradient(90deg, #059669, #0d9488, #10b981, #0d9488, #059669); margin-bottom: 20px;"></div>

      ${diet.description ? `<p style="font-size: 12px; color: #64748b; margin-bottom: 16px;">${toPersianDigits(diet.description)}</p>` : ""}

      <div class="diet-content">
        ${diet.content}
      </div>
    </body>
    </html>
  `

  try {
    const { page } = await acquirePdfPage()
    try {
      await page.setContent(html, { waitUntil: "domcontentloaded" })
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "15mm", right: "12mm", bottom: "15mm", left: "12mm" },
      })
      return Buffer.from(pdfBuffer)
    } finally {
      await releasePdfPage(page)
    }
  } catch (poolErr) {
    console.warn("Puppeteer pool fallback activated for diet PDF:", poolErr)
    const execPath = getExecutablePath()
    let browser: Browser
    try {
      browser = await puppeteer.launch({
        headless: "shell",
        args: PUPPETEER_VPS_ARGS,
        ...(execPath ? { executablePath: execPath } : {}),
      })
    } catch {
      browser = await puppeteer.launch({
        headless: true,
        args: PUPPETEER_VPS_ARGS,
        ...(execPath ? { executablePath: execPath } : {}),
      })
    }
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: "domcontentloaded" })
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "15mm", right: "12mm", bottom: "15mm", left: "12mm" },
      })
      return Buffer.from(pdfBuffer)
    } finally {
      await browser.close()
    }
  }
}



