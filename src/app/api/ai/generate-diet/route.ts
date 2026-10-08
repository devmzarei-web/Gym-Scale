import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limiter"
import { getTrainerSubscriptionState, TIER_CONFIGS } from "@/lib/subscription"

// Post-processor and validator to scale and sanitize AI generated meal portions to hit target calories
function normalizeAndScaleSections(sections: any[], targetCal: number) {
  if (!sections || !Array.isArray(sections) || sections.length === 0) return sections

  const defaultColors = ["amber", "emerald", "blue", "teal", "rose"]
  const defaultNames = [
    "وعده ۱: صبحانه انرژی‌بخش",
    "وعده ۲: میان‌وعده / ناهار سبک",
    "وعده ۳: وعده اصلی / ناهار",
    "وعده ۴: شام بازیابی عضلانی",
    "وعده ۵: مکمل‌های ورزشی و دستورالعمل‌های تکمیلی",
  ]

  // Calculate sum of calories ONLY across food meal sections (excluding supplement section)
  let totalAiCal = 0
  sections.forEach((sec, idx) => {
    const isSuppSec = idx === 4 || sec.mealName?.includes("مکمل") || sec.id === "m5"
    if (!isSuppSec && sec.rows && Array.isArray(sec.rows)) {
      sec.rows.forEach((r: any) => {
        const c = parseFloat(r.calories || 0) || 0
        totalAiCal += Math.max(0, c)
      })
    }
  })

  // Calculate precision scaling ratio for food meals, clamped between 0.6 and 1.6 to prevent portion distortion
  const rawScale = totalAiCal > 0 && targetCal > 0 ? targetCal / totalAiCal : 1
  const scale = Math.max(0.6, Math.min(1.6, rawScale))

  return sections.map((sec, secIdx) => {
    const isSuppSec = secIdx === 4 || sec.mealName?.includes("مکمل") || sec.id === "m5"

    const sanitizedRows = (sec.rows || []).map((r: any, rIdx: number) => {
      const origCal = parseFloat(r.calories || 0) || 0
      const origP = parseFloat(r.protein || 0) || 0
      const origC = parseFloat(r.carbs || 0) || 0
      const origF = parseFloat(r.fats || 0) || 0

      if (isSuppSec) {
        // Supplements section does not get calorie scaled
        return {
          id: r.id || `sup_${rIdx + 1}`,
          name: String(r.name || "مکمل ورزشی"),
          amount: String(r.amount || ""),
          note: String(r.note || ""),
          calories: Math.max(0, origCal),
          protein: Math.max(0, origP),
          carbs: Math.max(0, origC),
          fats: Math.max(0, origF),
        }
      }

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
        name: String(r.name || "ماده غذایی"),
        amount: String(scaledAmount),
        note: String(r.note || ""),
        calories: scaledCal,
        protein: scaledP,
        carbs: scaledC,
        fats: scaledF,
      }
    })

    return {
      id: sec.id || `m${secIdx + 1}`,
      mealName: sec.mealName || defaultNames[secIdx % defaultNames.length],
      headerColor: sec.headerColor || defaultColors[secIdx % defaultColors.length],
      mode: "table",
      textNotes: String(sec.textNotes || ""),
      rows: sanitizedRows,
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

    // Check AI Quota and Subscription Status
    const trainer = await prisma.trainer.findUnique({
      where: { id: session.user.id },
      select: { tier: true, aiQuota: true, aiQuotaResetAt: true, expiresAt: true, role: true }
    })
    
    if (!trainer) {
      return NextResponse.json({ error: "حساب کاربری مربی یافت نشد" }, { status: 404 })
    }

    const subStatus = getTrainerSubscriptionState(trainer.expiresAt, trainer.role)
    if (subStatus.isLocked) {
      return NextResponse.json({
        error: "اعتبار اشتراک شما به پایان رسیده است. جهت تولید رژیم با هوش مصنوعی، لطفاً اشتراک خود را در NutriTrain تمدید فرمایید."
      }, { status: 403 })
    }
    
    const now = new Date()
    let currentQuota = trainer.aiQuota
    const defaultTierQuota = TIER_CONFIGS[trainer.tier]?.defaultAiQuota ?? 3
    
    // Quota reset if period passed
    if (!trainer.aiQuotaResetAt || trainer.aiQuotaResetAt < now) {
      currentQuota = defaultTierQuota
      const nextReset = new Date(now)
      nextReset.setDate(now.getDate() + 30)
      nextReset.setHours(0, 0, 0, 0)
      
      await prisma.trainer.update({
        where: { id: session.user.id },
        data: { aiQuota: currentQuota, aiQuotaResetAt: nextReset }
      })
    }
    
    if (currentQuota <= 0) {
      return NextResponse.json({
        error: "سهمیه هوش مصنوعی شما در این دوره به پایان رسیده است. لطفاً جهت افزایش سهمیه، اشتراک خود را ارتقا دهید."
      }, { status: 403 })
    }

    const body = await req.json()
    const { targetCalories, targetProtein, targetCarbs, targetFats, goal, notes } = body
    const reqTargetCal = parseFloat(targetCalories) || 2200

    const apiKey = process.env.GAPGPT_API_KEY || process.env.OPENAI_API_KEY
    const baseUrls = [
      process.env.GAPGPT_BASE_URL || "https://api.gapgpt.app/v1",
      "https://api.gapgpt.ir/v1",
    ]

    const systemPrompt = `شما یک **Advanced Sports Nutrition Planning AI** هستید؛ یک موتور تخصصی طراحی برنامه تغذیه ورزشی که باید مانند یک متخصص ارشد تغذیه ورزشی، برنامه‌ریز تغذیه عملکردی و تحلیل‌گر تغذیه مبتنی بر شواهد عمل کند.

هدف شما تولید برنامه غذایی **دقیق، شخصی‌سازی‌شده، عملی، قابل پایبندی، مناسب فرهنگ غذایی ایرانی و سازگار با اهداف ورزشی** است.
شما نباید صرفاً فهرستی از غذاها تولید کنید.
ابتدا باید اهداف کالری و macronutrientها را تحلیل کنید، سپس وعده‌ها را از نظر انرژی، پروتئین، کربوهیدرات، چربی، کیفیت غذایی، زمان‌بندی و قابلیت اجرا طراحی کنید و در پایان یک کنترل کیفیت عددی انجام دهید.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۱. اصول علمی
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
برنامه باید بر اساس اصول معتبر تغذیه ورزشی طراحی شود:
* انرژی دریافتی متناسب با هدف
* پروتئین کافی برای حفظ یا افزایش توده بدون چربی
* توزیع منطقی پروتئین در وعده‌ها
* توزیع مناسب کربوهیدرات متناسب با فعالیت و تمرین
* دریافت چربی کافی
* کیفیت و تنوع منابع غذایی
* فیبر و مواد غذایی مغذی
* hydration مناسب
* زمان‌بندی منطقی وعده‌ها در رابطه با تمرین

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۲. اولویت اهداف عددی و تناقض ریاضی
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
اهداف ورودی سیستم:
Calories: ${reqTargetCal} kcal
Protein: ${targetProtein || 140} g
Carbohydrates: ${targetCarbs || 220} g
Fat: ${targetFats || 60} g

فرمول پایه: Protein × 4 + Carbs × 4 + Fat × 9 ≈ Approximate Calories
اگر بین calorie target و مجموع انرژی حاصل از macros اختلاف وجود داشت، اولویت به این ترتیب است:
1. targetCalories
2. targetProtein
3. targetCarbs
4. targetFats
تلاش کنید ترکیب غذاها به نحوی طراحی شود که تا حد امکان به تمام اهداف بسیار نزدیک باشد.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۳. دقت مقادیر غذایی
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
مقدار هر ماده غذایی باید کاملاً واقع‌بینانه باشد.
از مقادیر غیرمنطقی (مانند چند صد گرم روغن یا مقادیر عجیب گوشت) برای رسیدن مصنوعی به macro target پرهیز کنید.
برای هر ماده غذایی:
- amount باید واضح و مشخص باشد (مثلاً: "۱۸۰ گرم"، "۲ عدد"، "۱ لیوان").
- calories، protein، carbs و fats باید مقادیر عددی معتبر (number) باشند.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۴. ساختار ۵ وعده و طراحی منو
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
برنامه باید دقیقاً شامل ۵ section باشد:
Section 1: صبحانه انرژی‌بخش (گزینه اصلی A)
Section 2: میان‌وعده / وعده سبک
Section 3: وعده اصلی / ناهار
Section 4: وعده اصلی / شام یا post-workout meal
Section 5: مکمل‌های ورزشی و دستورالعمل‌های تکمیلی

چهار section اول باید غذاهای واقعی باشند.
Section پنجم نباید به یک وعده غذایی عادی تبدیل شود.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۵. غذاهای ایرانی و قابلیت اجرا
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
اولویت با غذاهایی است که در ایران به‌راحتی قابل تهیه، خوش‌طعم و برای زندگی روزمره مناسب هستند (مانند برنج کته، نان سنگک/جو، تخم‌مرغ، سینه مرغ، گوشت، ماهی، لبنیات، حبوبات، سیب‌زمینی، میوه، سبزیجات و مغزها).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۶. گزینه‌های جایگزین (Alternative Meals)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
برای هر یک از چهار وعده غذایی اصلی، در فیلد textNotes یک گزینه جایگزین کامل با فرمت زیر ارائه دهید:
"گزینه جایگزین B: [ترکیب غذای جایگزین با مقادیر تقریبی هم‌سطح از نظر کالری و ماکرو]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۷. بخش مکمل‌ها (Section 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Section پنجم دقیقاً باید با عنوان "وعده ۵: مکمل‌های ورزشی و دستورالعمل‌های تکمیلی" باشد.
مکمل‌ها را فقط در صورت منطقی بودن بر اساس هدف و شرایط کاربر پیشنهاد دهید. مصرف هیچ مکملی (مانند وی یا کراتین) را اجباری نکنید.
اگر مکمل خاصی لازم نیست یا اطلاعات کافی وجود ندارد، rows می‌تواند [] باشد و در textNotes دستورالعمل‌های عمومی، هیدراسیون و نحوه مصرف آب قرار گیرد.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۸. یادداشت‌های مربی و محدودیت‌ها
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
هدف: ${goal || "تناسب اندام و بهبود ترکیب بدنی"}
یادداشت مربی: ${notes || "غذاهای در دسترس و استاندارد"}
اگر notes شامل آلرژی، عدم تحمل غذایی، گیاه‌خواری یا محدودیت است، آن را به عنوان یک constraint سخت رعایت کنید. هیچ غذای ممنوعه‌ای نباید در برنامه یا گزینه‌های جایگزین ظاهر شود.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۹. کنترل کیفیت داخلی و قوانین خروجی JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
قبل از خروجی نهایی مطمئن شوید:
✓ دقیقاً ۵ section وجود دارد.
✓ چهار section اول غذایی همراه با alternative در textNotes هستند.
✓ مجموع روزانه بسیار نزدیک به ${reqTargetCal} kcal است.
✓ پاسخ فقط و فقط JSON معتبر باشد (بدون Markdown، بدون \`\`\`json و بدون متن اضافی).

فرمت دقیق ساختار JSON:
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
      "textNotes": "گزینه جایگزین B: ۲ عدد تخم‌مرغ کامل + ۲ سفیده + ۵۰ گرم نان سنگک"
    },
    {
      "id": "m5",
      "mealName": "وعده ۵: مکمل‌های ورزشی و دستورالعمل‌های تکمیلی",
      "headerColor": "rose",
      "mode": "table",
      "rows": [
        {
          "id": "sup1",
          "name": "پروتئین وی (اختیاری)",
          "amount": "۱ اسکوپ (۳۰ گرم)",
          "note": "بعد از تمرین جهت تسریع بازسازی عضلانی",
          "calories": 120,
          "protein": 24,
          "carbs": 2,
          "fats": 1
        }
      ],
      "textNotes": "نکته: مصرف مکمل‌ها کاملاً اختیاری است. مصرف حداقل ۲.۵ تا ۳ لیتر آب در طول روز توصیه می‌شود."
    }
  ]
}`

    const userPrompt = `بر اساس اطلاعات زیر، یک برنامه تغذیه ورزشی کاملاً شخصی‌سازی‌شده، دقیق و قابل اجرا تولید کن.
قبل از تولید JSON، اطلاعات را به صورت یک سیستم واحد تحلیل کن و بین کالری، macronutrientها، هدف، محدودیت‌های غذایی و قابلیت اجرای واقعی برنامه تعادل برقرار کن.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
اهداف تغذیه‌ای
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
کالری هدف روزانه: ${reqTargetCal} kcal
پروتئین هدف: ${targetProtein || 140} g
کربوهیدرات هدف: ${targetCarbs || 220} g
چربی هدف: ${targetFats || 60} g

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
هدف برنامه
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
هدف: ${goal || "کاهش چربی و حفظ/رشد عضلانی"}
توضیحات و محدودیت‌های مربی: ${notes || "غذاهای در دسترس در بازار ایران"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
دستور طراحی
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
یک برنامه روزانه شامل دقیقاً ۵ section تولید کن:
1. صبحانه
2. وعده غذایی دوم
3. وعده غذایی سوم
4. وعده غذایی چهارم
5. مکمل‌های ورزشی و دستورالعمل‌های تکمیلی

چهار وعده اول باید شامل غذاهای واقعی و قابل تهیه باشند.
برای هر چهار وعده غذایی:
* مواد غذایی را با مقدار دقیق ارائه کن.
* calories، protein، carbs و fats را برای هر ماده با مقادیر عددی معتبر ثبت کن.
* در textNotes دقیقاً یک Alternative Meal ارائه کن.
* alternative باید از نظر کالری و macronutrients تقریباً قابل جایگزینی با گزینه اصلی باشد.

برای section پنجم:
* مکمل‌ها را فقط در صورت منطقی بودن پیشنهاد کن.
* مکملی را صرفاً به دلیل رایج بودن آن اجباری نکن.
* در صورت نبود نیاز یا اطلاعات کافی، rows را خالی نگه دار و در textNotes نکات تکمیلی و hydration بنویس.

فقط JSON معتبر برگردان. هیچ متن دیگری خارج از JSON ننویس.`

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
