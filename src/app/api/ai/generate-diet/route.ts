import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limiter"

// Post-processor to scale AI generated meal portions to hit the target calories with 100% accuracy
function normalizeAndScaleSections(sections: any[], targetCal: number) {
  if (!sections || !Array.isArray(sections) || sections.length === 0) return sections

  // Calculate sum of calories ONLY across food meal sections (excluding supplement section)
  let totalAiCal = 0
  sections.forEach((sec) => {
    const isSuppSec = sec.mealName?.includes("مکمل") || sec.id === "m5"
    if (!isSuppSec && sec.rows && Array.isArray(sec.rows)) {
      sec.rows.forEach((r: any) => {
        totalAiCal += parseFloat(r.calories || 0) || 0
      })
    }
  })

  if (totalAiCal <= 0 || !targetCal) return sections

  // Calculate precision scaling ratio for food meals
  const scale = targetCal / totalAiCal

  return sections.map((sec, secIdx) => {
    const isSuppSec = sec.mealName?.includes("مکمل") || sec.id === "m5"

    return {
      id: sec.id || `m_${secIdx + 1}`,
      mealName: sec.mealName || `وعده ${secIdx + 1}`,
      headerColor: sec.headerColor || ["amber", "emerald", "blue", "teal", "rose"][secIdx % 5],
      mode: "table",
      textNotes: sec.textNotes || "",
      rows: (sec.rows || []).map((r: any, rIdx: number) => {
        if (isSuppSec) {
          // Supplements section does not get calorie scaled
          return {
            id: r.id || `r_${secIdx + 1}_${rIdx + 1}`,
            name: r.name || "مکمل ورزشی",
            amount: r.amount || "",
            note: r.note || "",
            calories: parseFloat(r.calories || 0) || 0,
            protein: parseFloat(r.protein || 0) || 0,
            carbs: parseFloat(r.carbs || 0) || 0,
            fats: parseFloat(r.fats || 0) || 0,
          }
        }

        const origCal = parseFloat(r.calories || 0) || 0
        const origP = parseFloat(r.protein || 0) || 0
        const origC = parseFloat(r.carbs || 0) || 0
        const origF = parseFloat(r.fats || 0) || 0

        const scaledCal = Math.round(origCal * scale)
        const scaledP = Math.round(origP * scale * 10) / 10
        const scaledC = Math.round(origC * scale * 10) / 10
        const scaledF = Math.round(origF * scale * 10) / 10

        // Scale numeric values inside text string (e.g. "180 گرم" -> "220 گرم")
        let scaledAmount = r.amount || ""
        if (typeof scaledAmount === "string" && scale !== 1) {
          scaledAmount = scaledAmount.replace(/(\d+(\.\d+)?)/g, (match) => {
            const num = parseFloat(match)
            if (!isNaN(num) && num > 0) {
              const val = Math.round(num * scale * 10) / 10
              return String(val)
            }
            return match
          })
        }

        return {
          id: r.id || `r_${secIdx + 1}_${rIdx + 1}`,
          name: r.name || "ماده غذایی",
          amount: scaledAmount,
          note: r.note || "",
          calories: scaledCal,
          protein: scaledP,
          carbs: scaledC,
          fats: scaledF,
        }
      }),
    }
  })
}

export async function POST(req: Request) {
  const startTime = Date.now()
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    // Rate limiting: max 5 requests per minute per user
    const rlResult = checkRateLimit(`ai_diet:${session.user.id}`, { windowMs: 60000, max: 5 })
    if (!rlResult.success) {
      return NextResponse.json(
        { error: "تعداد درخواست‌های هوش مصنوعی شما بیش از حد مجاز است. لطفاً ۱ دقیقه صبر کنید." },
        { status: 429, headers: { "Retry-After": "60" } }
      )
    }

    // Check AI Quota
    const trainer = await prisma.trainer.findUnique({
      where: { id: session.user.id },
      select: { tier: true, aiQuota: true, aiQuotaResetAt: true }
    })
    
    if (!trainer) {
      return NextResponse.json({ error: "حساب کاربری مربی یافت نشد" }, { status: 404 })
    }
    
    const now = new Date()
    let currentQuota = trainer.aiQuota
    
    // Daily quota reset
    if (!trainer.aiQuotaResetAt || trainer.aiQuotaResetAt < now) {
      currentQuota = trainer.tier === "PRO" ? 30 : 3;
      const nextReset = new Date(now)
      nextReset.setDate(now.getDate() + 1)
      nextReset.setHours(0, 0, 0, 0)
      
      await prisma.trainer.update({
        where: { id: session.user.id },
        data: { aiQuota: currentQuota, aiQuotaResetAt: nextReset }
      })
    }
    
    if (currentQuota <= 0) {
      return NextResponse.json({ error: "سهمیه هوش مصنوعی شما برای امروز به پایان رسیده است. لطفاً حساب خود را به نسخه PRO ارتقا دهید یا فردا مراجعه کنید." }, { status: 403 })
    }

    const body = await req.json()
    const { targetCalories, targetProtein, targetCarbs, targetFats, goal, notes } = body
    const reqTargetCal = parseFloat(targetCalories) || 2200

    const apiKey = process.env.GAPGPT_API_KEY || process.env.OPENAI_API_KEY
    const baseUrls = [
      process.env.GAPGPT_BASE_URL || "https://api.gapgpt.app/v1",
      "https://api.gapgpt.ir/v1",
    ]

    const systemPrompt = `شما یک دکتری تغذیه ورزشی ارشد و هوش مصنوعی بین‌المللی برنامه نویسی تغذیه (Scientific Diet AI Engine) هستید.
پاسخ شما بر اساس آخرین مقالات و استانداردهای ISSN (International Society of Sports Nutrition) و ACSM تولید می‌شود.

الزامات دقیق خروجی:
۱. علم روز تغذیه ورزشی (علم موازنه لوسین، زمان‌بندی کربوهیدرات و حفظ بافت عضلانی).
۲. حداکثر پایبندی و تجربه کاربری بالا با غذاهای ایرانی لذیذ، ساده و قابل دسترس.
۳. ارائه گزینه جایگزین (Alternative Meals) برای هر وعده غذایی در بخش textNotes.
۴. تولید ۵ وعده کامل که وعده ۵ام (متقابلاً آخرین بخش) دقیقاً مربوط به "مکمل‌های ورزشی و دستورالعمل‌های تکمیلی" باشد.

فرمت پاسخ باید دقیقاً JSON معتبر به شکل زیر باشد:
{
  "sections": [
    {
      "id": "m1",
      "mealName": "وعده ۱: صبحانه انرژی‌بخش (گزینه اصلی A)",
      "headerColor": "amber",
      "mode": "table",
      "rows": [
        {
          "id": "r1",
          "name": "جو دوسر پرک (Oats)",
          "amount": "۶۰ گرم",
          "note": "پخته شده با شیر کم‌چرب و دارچین",
          "calories": 230,
          "protein": 9,
          "carbs": 42,
          "fats": 4
        }
      ],
      "textNotes": "💡 گزینه جایگزین (B): ۲ عدد تخم‌مرغ کامل + ۲ سفیده + ۵۰ گرم نان سنگک"
    },
    {
      "id": "m5",
      "mealName": "وعده ۵: مکمل‌های ورزشی و دستورالعمل‌های تکمیلی",
      "headerColor": "rose",
      "mode": "table",
      "rows": [
        {
          "id": "sup1",
          "name": "پروتئین وی (Whey Isolate)",
          "amount": "۱ اسکوپ (۳۰ گرم)",
          "note": "بلافاصله پس از اتمام تمرین جهت تسریع سنتز عضلانی",
          "calories": 120,
          "protein": 24,
          "carbs": 2,
          "fats": 1
        },
        {
          "id": "sup2",
          "name": "کراتین مونوهیدرات (Creatine)",
          "amount": "۵ گرم روزانه",
          "note": "بعد تمرین با شیک پروتئین جهت افزایش قدرت",
          "calories": 0,
          "protein": 0,
          "carbs": 0,
          "fats": 0
        },
        {
          "id": "sup3",
          "name": "امگا ۳ (Omega-3 Fish Oil)",
          "amount": "۱ عدد (۱۰۰۰mg)",
          "note": "همراه با وعده ناهار برای کاهش التهاب مفاصل",
          "calories": 10,
          "protein": 0,
          "carbs": 0,
          "fats": 1
        }
      ],
      "textNotes": "نکته: مصرف مکمل‌ها اختیاری بوده و مکمل کراتین حتماً همراه آب فراوان نوشیده شود."
    }
  ]
}`

    const userPrompt = `لطفاً یک برنامه تغذیه ورزشی فوق‌علمی کامل (شامل ۴ وعده غذایی اصلی با گزینه‌های جایگزین + ۱ وعده اختصاصی مکمل‌های ورزشی) به زبان فارسی تنظیم کنید:
- کالری کل روزانه غذاها: ${reqTargetCal} kcal
- پروتئین هدف: ${targetProtein || 140} گرم
- کربوهیدرات هدف: ${targetCarbs || 220} گرم
- چربی هدف: ${targetFats || 60} گرم
- هدف ورزشی: ${goal || "کاهش چربی و حفظ/رشد عضلانی"}
- توضیحات مربی: ${notes || "غذاهای دسترس در بازار ایران"}`

    if (apiKey) {
      for (const baseUrl of baseUrls) {
        try {
          const aiRes = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: process.env.GAPGPT_MODEL || "gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
              temperature: 0.7,
            }),
          })

          if (aiRes.ok) {
            const aiData = await aiRes.json()
            const content = aiData.choices?.[0]?.message?.content
            if (content) {
              const parsed = JSON.parse(content)
              const scaledSections = normalizeAndScaleSections(parsed.sections, reqTargetCal)
              const elapsedMs = Date.now() - startTime
              
              // Decrement quota on success
              await prisma.trainer.update({
                where: { id: session.user.id },
                data: { aiQuota: { decrement: 1 } }
              })

              return NextResponse.json({
                sections: scaledSections,
                isSimulated: false,
                aiModel: process.env.GAPGPT_MODEL || "gpt-4o-mini",
                provider: "GapGPT Live API (gapgpt.app)",
                elapsedMs,
              })
            }
          } else {
            console.warn(`GapGPT request to ${baseUrl} returned status ${aiRes.status}`)
          }
        } catch (err) {
          console.warn(`GapGPT fetch error for ${baseUrl}:`, err)
        }
      }
    }

    // Fallback Smart Scientific Response if API call fails or key is missing
    const ratio = Math.max(0.4, reqTargetCal / 2060)

    const S = (baseQty: number, unitName: string, cal: number, p: number, c: number, f: number) => {
      const q = Math.round(baseQty * ratio * 10) / 10
      return {
        amount: `${q} ${unitName}`,
        calories: Math.round(cal * ratio),
        protein: Math.round(p * ratio * 10) / 10,
        carbs: Math.round(c * ratio * 10) / 10,
        fats: Math.round(f * ratio * 10) / 10,
      }
    }

    const o = S(55, "گرم", 200, 7, 35, 3.8)
    const e = S(4, "عدد", 68, 14.4, 0.8, 0.4)
    const ch = S(190, "گرم پخته", 310, 58, 0, 6.8)
    const r = S(210, "گرم پخته", 273, 5.7, 59, 0.6)
    const w = S(32, "گرم", 128, 25.5, 2.1, 1.6)
    const fi = S(160, "گرم", 325, 35, 0, 20.5)

    const fallbackSections = [
      {
        id: "m1",
        mealName: "وعده ۱: صبحانه انرژی‌بخش (گزینه اصلی A)",
        headerColor: "amber",
        mode: "table",
        rows: [
          { id: "ai_1", name: "اوتمیل هوشمند با شیر کم‌چرب (Oats)", amount: o.amount, note: "همراه ۲ عدد خرما و دارچین", calories: o.calories, protein: o.protein, carbs: o.carbs, fats: o.fats },
          { id: "ai_2", name: "سفیده تخم‌مرغ آب‌پز", amount: e.amount, note: "سفیده خالص بدون زردی", calories: e.calories, protein: e.protein, carbs: e.carbs, fats: e.fats },
        ],
        textNotes: "💡 گزینه جایگزین (B): ۲ عدد تخم‌مرغ کامل + ۳ سفیده + ۶۰ گرم نان سنگک یا جو",
      },
      {
        id: "m2",
        mealName: "وعده ۲: ناهار اصلی علمی (گزینه اصلی A)",
        headerColor: "emerald",
        mode: "table",
        rows: [
          { id: "ai_3", name: "سینه مرغ گریل شده ایرانی", amount: ch.amount, note: "با مرینیت لیموترش و زعفران", calories: ch.calories, protein: ch.protein, carbs: ch.carbs, fats: ch.fats },
          { id: "ai_4", name: "برنج کته ایرونی (بدون روغن)", amount: r.amount, note: "برنج کته تازه", calories: r.calories, protein: r.protein, carbs: r.carbs, fats: r.fats },
        ],
        textNotes: "💡 گزینه جایگزین (B): ۱۸۰ گرم فیله گوساله پخته + ۲۲۰ گرم سیب‌زمینی تنوری + سالاد فصل با ۱ ق‌غ روغن زیتون",
      },
      {
        id: "m3",
        mealName: "وعده ۳: سوخت بعد تمرین (گزینه اصلی A)",
        headerColor: "blue",
        mode: "table",
        rows: [
          { id: "ai_5", name: "مکمل پروتئین وی با آب", amount: w.amount, note: "شیک ورزشی", calories: w.calories, protein: w.protein, carbs: w.carbs, fats: w.fats },
        ],
        textNotes: "💡 گزینه جایگزین (B): ۱۵۰ گرم ماست یونانی کم‌چرب + ۱ عدد موز متوسط + ۱۵ گرم مغز گردو",
      },
      {
        id: "m4",
        mealName: "وعده ۴: شام بازیابی عضلانی (گزینه اصلی A)",
        headerColor: "teal",
        mode: "table",
        rows: [
          { id: "ai_6", name: "فیله گوساله یا ماهی سالمون", amount: fi.amount, note: "پخته روی چدن یا فر", calories: fi.calories, protein: fi.protein, carbs: fi.carbs, fats: fi.fats },
        ],
        textNotes: "💡 گزینه جایگزین (B): ۱۵۰ گرم تن ماهی (بدون روغن) + سالاد کلم و خیار و گوجه",
      },
      {
        id: "m5",
        mealName: "وعده ۵: مکمل‌های ورزشی و دستورالعمل‌های تکمیلی",
        headerColor: "rose",
        mode: "table",
        rows: [
          { id: "sup1", name: "پروتئین وی (Whey Isolate)", amount: "۱ اسکوپ (۳۰ گرم)", note: "بلافاصله پس از اتمام تمرین جهت تسریع سنتز عضلانی", calories: 120, protein: 24, carbs: 2, fats: 1 },
          { id: "sup2", name: "کراتین مونوهیدرات (Creatine)", amount: "۵ گرم روزانه", note: "بعد تمرین با شیک پروتئین جهت افزایش قدرت", calories: 0, protein: 0, carbs: 0, fats: 0 },
          { id: "sup3", name: "امگا ۳ (Omega-3 Fish Oil)", amount: "۱ عدد (۱۰۰۰mg)", note: "همراه با وعده ناهار برای کاهش التهاب مفاصل", calories: 10, protein: 0, carbs: 0, fats: 1 },
        ],
        textNotes: "نکته: مصرف مکمل‌ها اختیاری بوده و مکمل کراتین حتماً همراه آب فراوان نوشیده شود.",
      },
    ]

    const scaledFallback = normalizeAndScaleSections(fallbackSections, reqTargetCal)
    
    // Decrement quota on success (fallback still counts towards quota)
    await prisma.trainer.update({
      where: { id: session.user.id },
      data: { aiQuota: { decrement: 1 } }
    })

    return NextResponse.json({
      sections: scaledFallback,
      isSimulated: true,
      aiModel: "Simulated Scientific Engine",
      provider: "Fallback Local Engine",
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    console.error("AI Diet Generation error:", error)
    return NextResponse.json({ error: "خطا در تولید رژیم با هوش مصنوعی." }, { status: 500 })
  }
}
