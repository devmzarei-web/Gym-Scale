import fs from "fs"
import path from "path"
import puppeteer from "puppeteer"

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

export async function generateRoutinePdfBuffer(routine: any, client?: any, trainer?: any): Promise<Buffer> {
  const logoBase64 = getBase64Asset("NutriTrain.png", "image/png")
  const vazirRegBase64 = getBase64Asset("fonts/Vazirmatn-Regular.woff2", "font/woff2")
  const vazirBoldBase64 = getBase64Asset("fonts/Vazirmatn-Bold.woff2", "font/woff2")
  const morabbaMedBase64 = getBase64Asset("fonts/Morabba-Medium.woff2", "font/woff2")

  const trainerName = trainer?.name || routine.trainer?.name || "مربی تخصصی NutriTrain"

  const workoutDaysHtml = routine.workoutDays
    .map((day: any, dayIdx: number) => {
      const exercisesHtml = day.exercises
        .map(
          (ex: any, idx: number) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="text-align: center; font-weight: bold; color: #94a3b8; padding: 6px 8px;">${toPersianDigits(idx + 1)}</td>
          <td style="text-align: right; font-weight: bold; color: #0f172a; padding: 6px 8px;">${ex.name}</td>
          <td style="text-align: center; font-weight: bold; color: #334155; padding: 6px 8px;">${toPersianDigits(ex.sets)}</td>
          <td style="text-align: center; font-weight: bold; color: #334155; padding: 6px 8px;">${toPersianDigits(ex.repetitions)}</td>
          <td style="text-align: center; color: #475569; padding: 6px 8px;">${toPersianDigits(ex.restTime) || "-"}</td>
          <td style="text-align: right; color: #475569; padding: 6px 8px;">${toPersianDigits(ex.customDescription) || "—"}</td>
        </tr>
      `
        )
        .join("")

      return `
      <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 16px; page-break-inside: avoid;">
        <div style="background-color: #065f46; color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-family: 'Morabba', serif; font-size: 13px; font-weight: bold;">
          <span>${toPersianDigits(day.label) || `روز ${toPersianDigits(dayIdx + 1)}`}</span>
          <span style="font-size: 10px; opacity: 0.8;">${toPersianDigits(day.exercises.length)} حرکت</span>
        </div>
        ${
          day.exercises.length > 0
            ? `
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 11px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1; color: #475569;">
                <th style="width: 32px; text-align: center; padding: 6px 8px;">#</th>
                <th style="text-align: right; padding: 6px 8px;">نام حرکت</th>
                <th style="width: 48px; text-align: center; padding: 6px 8px;">ست</th>
                <th style="width: 64px; text-align: center; padding: 6px 8px;">تکرار</th>
                <th style="width: 64px; text-align: center; padding: 6px 8px;">استراحت</th>
                <th style="text-align: right; padding: 6px 8px;">توضیحات</th>
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
          align-items: center;
          padding-bottom: 12px;
          margin-bottom: 4px;
        }
        .right-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo {
          height: 48px;
          width: 176px;
          object-fit: contain;
        }
        .trainer-meta {
          font-family: 'Morabba', serif;
          text-align: right;
        }
        .trainer-name {
          font-size: 14px;
          font-weight: 800;
          color: #065f46;
        }
        .trainer-sub {
          font-size: 10px;
          color: #64748b;
        }
        .info {
          text-align: left;
          font-family: 'Morabba', serif;
        }
        .info h1 {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
        }
        .client-tags {
          display: flex;
          gap: 6px;
          margin-top: 4px;
          font-size: 10px;
          font-weight: bold;
          color: #475569;
        }
        .tag {
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .accent-line {
          height: 3px;
          background: linear-gradient(90deg, #059669, #0d9488, #10b981, #0d9488, #059669);
          border-radius: 999px;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #94a3b8;
          font-family: 'Morabba', serif;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="right-header">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="NutriTrain Logo" />` : `<h2 style="font-family: 'Morabba'; color: #059669;">NutriTrain</h2>`}
          <div class="trainer-meta">
            <span class="trainer-name">${trainerName}</span>
            <span class="trainer-sub block">مربی رسمی فدراسیون بدنسازی</span>
          </div>
        </div>
        <div class="info">
          <h1>${toPersianDigits(routine.title)}</h1>
          ${
            client
              ? `
            <div class="client-tags">
              <span class="tag">نام: ${client.name}</span>
              ${client.weight ? `<span class="tag">وزن: ${toPersianDigits(client.weight)} kg</span>` : ""}
              ${client.height ? `<span class="tag">قد: ${toPersianDigits(client.height)} cm</span>` : ""}
              ${client.age ? `<span class="tag">سن: ${toPersianDigits(client.age)} سال</span>` : ""}
              <span class="tag">تاریخ: ${toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(routine.createdAt)))}</span>
            </div>
          `
              : `
            <div class="client-tags">
              <span class="tag">برنامه عمومی</span>
              <span class="tag">تاریخ: ${toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(routine.createdAt)))}</span>
            </div>
          `
          }
        </div>
      </div>

      <div class="accent-line"></div>

      <div>
        ${workoutDaysHtml}
      </div>

      <div class="footer">
        <span>سامانه هوشمند برنامه‌ریزی ورزشی NutriTrain - مربی: ${trainerName}</span>
        <span>صفحه ۱ از ۱</span>
      </div>
    </body>
    </html>
  `

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "domcontentloaded" })
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    })
    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

export async function generateDietPdfBuffer(diet: any, client?: any, trainer?: any): Promise<Buffer> {
  const logoBase64 = getBase64Asset("NutriTrain.png", "image/png")
  const vazirRegBase64 = getBase64Asset("fonts/Vazirmatn-Regular.woff2", "font/woff2")
  const vazirBoldBase64 = getBase64Asset("fonts/Vazirmatn-Bold.woff2", "font/woff2")
  const morabbaMedBase64 = getBase64Asset("fonts/Morabba-Medium.woff2", "font/woff2")

  const trainerName = trainer?.name || diet.trainer?.name || "مربی تخصصی NutriTrain"

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
          align-items: center;
          padding-bottom: 12px;
          margin-bottom: 4px;
        }
        .right-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo {
          height: 48px;
          width: 176px;
          object-fit: contain;
        }
        .trainer-meta {
          font-family: 'Morabba', serif;
          text-align: right;
        }
        .trainer-name {
          font-size: 14px;
          font-weight: 800;
          color: #0f766e;
        }
        .trainer-sub {
          font-size: 10px;
          color: #64748b;
        }
        .info {
          text-align: left;
          font-family: 'Morabba', serif;
        }
        .info h1 {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
        }
        .client-tags {
          display: flex;
          gap: 6px;
          margin-top: 4px;
          font-size: 10px;
          font-weight: bold;
          color: #475569;
        }
        .tag {
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .accent-line {
          height: 3px;
          background: linear-gradient(90deg, #0d9488, #059669, #14b8a6, #059669, #0d9488);
          border-radius: 999px;
          margin-bottom: 20px;
        }
        .diet-body {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 20px;
          background-color: #fafafa;
          font-size: 12px;
          line-height: 1.7;
          min-height: 600px;
        }
        .diet-body h2 {
          font-family: 'Morabba', serif;
          font-size: 15px;
          color: #0f766e;
          margin-top: 14px;
          margin-bottom: 6px;
          border-bottom: 1px solid #ccfbf1;
          padding-bottom: 4px;
        }
        .diet-body h3 {
          font-family: 'Morabba', serif;
          font-size: 13px;
          color: #115e59;
          margin-top: 12px;
          margin-bottom: 4px;
        }
        .diet-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 11px;
        }
        .diet-body th {
          background-color: #f0fdf4;
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
        }
        .diet-body td {
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
        }
        .footer {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #94a3b8;
          font-family: 'Morabba', serif;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="right-header">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="NutriTrain Logo" />` : `<h2 style="font-family: 'Morabba'; color: #0d9488;">NutriTrain</h2>`}
          <div class="trainer-meta">
            <span class="trainer-name">${trainerName}</span>
            <span class="trainer-sub block">مربی رسمی فدراسیون بدنسازی</span>
          </div>
        </div>
        <div class="info">
          <h1>${toPersianDigits(diet.title)}</h1>
          ${
            client
              ? `
            <div class="client-tags">
              <span class="tag">نام: ${client.name}</span>
              ${client.weight ? `<span class="tag">وزن: ${toPersianDigits(client.weight)} kg</span>` : ""}
              ${client.height ? `<span class="tag">قد: ${toPersianDigits(client.height)} cm</span>` : ""}
              ${client.age ? `<span class="tag">سن: ${toPersianDigits(client.age)} سال</span>` : ""}
              <span class="tag">تاریخ: ${toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(diet.createdAt)))}</span>
            </div>
          `
              : `
            <div class="client-tags">
              <span class="tag">برنامه عمومی</span>
              <span class="tag">تاریخ: ${toPersianDigits(new Intl.DateTimeFormat("fa-IR").format(new Date(diet.createdAt)))}</span>
            </div>
          `
          }
        </div>
      </div>

      <div class="accent-line"></div>

      <div class="diet-body">
        ${toPersianDigitsInHTML(diet.content)}
      </div>

      <div class="footer">
        <span>سامانه آنلاین برنامه‌ریزی تغذیه و رژیم NutriTrain - مربی: ${trainerName}</span>
        <span>صفحه ۱ از ۱</span>
      </div>
    </body>
    </html>
  `

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "domcontentloaded" })
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    })
    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}
