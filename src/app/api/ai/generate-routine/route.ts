import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limiter"

// Helper to safely extract JSON from string (handling Markdown ```json blocks if present)
function parseAiJson(rawText: string) {
  try {
    return JSON.parse(rawText)
  } catch (e) {
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim()
    const firstBrace = cleaned.indexOf("{")
    const lastBrace = cleaned.lastIndexOf("}")
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonSub = cleaned.substring(firstBrace, lastBrace + 1)
      return JSON.parse(jsonSub)
    }
    throw e
  }
}

export async function POST(req: Request) {
  const startTime = Date.now()
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    // Rate limiting: max 5 requests per minute per user
    const rlResult = checkRateLimit(`ai_routine:${session.user.id}`, { windowMs: 60000, max: 5 })
    if (!rlResult.success) {
      return NextResponse.json(
        { error: "تعداد درخواست‌های هوش مصنوعی شما بیش از حد مجاز است. لطفاً ۱ دقیقه صبر کنید." },
        { status: 429, headers: { "Retry-After": "60" } }
      )
    }

    // Check AI Quota (Shared with Diet AI Quota pool)
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
      return NextResponse.json({
        error: "سهمیه هوش مصنوعی شما برای امروز به پایان رسیده است. لطفاً حساب خود را به نسخه PRO ارتقا دهید یا فردا مراجعه کنید."
      }, { status: 403 })
    }

    const body = await req.json()
    const {
      clientName,
      clientAge,
      clientWeight,
      clientHeight,
      clientGender,
      clientGoals,
      primarySport = "کراس‌فیت",
      trainingStyle = "CROSSFIT", // CROSSFIT | BODYBUILDING | SPORT_SPECIFIC | CALISTHENICS
      fitnessGoal = "افزایش توان تنفسی، قدرت انفجاری و آمادگی همه‌جانبه (WOD / MetCon)",
      daysPerWeek = 4,
      sessionDurationMinutes = 60,
      fitnessLevel = "متوسط",
      notes = "",
      selectedModel = "gpt-4o",
    } = body

    const targetDaysCount = Math.min(6, Math.max(3, parseInt(daysPerWeek) || 4))

    const apiKey = process.env.GAPGPT_API_KEY || process.env.OPENAI_API_KEY
    const baseUrls = [
      process.env.GAPGPT_BASE_URL || "https://api.gapgpt.app/v1",
      "https://api.gapgpt.ir/v1",
    ]

    // Distinct specialized system prompts tailored per training style
    let specializedPersonaPrompt = ""
    let styleRulesPrompt = ""

    if (trainingStyle === "CROSSFIT") {
      specializedPersonaPrompt = `شما سرمربی ارشد بین‌المللی کراس‌فیت (CrossFit Level 3 Master Trainer & Head WOD Coach) هستید.
شما متدولوژی رسمی CrossFit HQ، برنامه‌ریزی WODها، وزنه برداری المپیکی (Olympic Weightlifting) و MetConها را با بالاترین کیفیت طراحی می‌کنید.`
      styleRulesPrompt = `تمرینات باید شامل ترکیبی از:
- وزنه برداری المپیکی: Thrusters, Clean & Jerk, Snatch, Wall Balls, Kettlebell Swings, Overhead Squats.
- ژیمناستیک: Kipping Pull-ups, Muscle-ups, Toes-to-Bar, Box Jumps, Handstand Push-ups, Ring Dips.
- متابولیک و کاردیو: Double Unders, Burpees Over Bar, Rowing.
توضیحات هر حرکت شامل نکات ریتم، انفجار لگن و پبسینگ (Pacing) در WOD باشد.`
    } else if (trainingStyle === "CALISTHENICS") {
      specializedPersonaPrompt = `شما سرمربی ارشد فدراسیون جهانی کالیستنیکس و ورزش‌های وزن بدن (Street Workout & Calisthenics Master Coach) هستید.
شما برنامه‌های افزایش قدرت نسبی، کنترل کامل وزن بدن و پیشرفت‌های تکنیکی کالیستنیکس را طراحی می‌کنید.`
      styleRulesPrompt = `تمرینات باید شامل:
- حرکات وزن بدن پیشرفته: Weighted Pull-ups, Dips, Muscle-ups, Pistol Squats, Handstand Push-ups, L-Sits, Dragon Flags, Ring Push-ups/Dips.
توضیحات هر حرکت شامل وضعیت Hollow Body، انقباض کتف و کنترل موقعیت مفاصل باشد.`
    } else if (trainingStyle === "SPORT_SPECIFIC") {
      specializedPersonaPrompt = `شما مدیر تیم قدرتی و آمادگی جسمانی المپیک (NSCA-CSCS Head High-Performance Athletic Coach) هستید.
شما برنامه‌های بدنسازی مکمل و بیومکانیک اختصاصی رشته‌های ورزشی مختلف را طراحی می‌کنید.`
      styleRulesPrompt = `تمرینات باید بر اساس بیومکانیک دقیق ورزش اصلی (${primarySport}) شامل:
- تقویت گروه‌های عضلانی محرک اصلی در ${primarySport}
- پیشگیری از آسیب‌دیدگی‌های شایع آن ورزش (روتاتور کاف، زانو، همسترینگ، مچ)
- انتقال نیرو و توان چرخشی/انفجاری (Rotational & Plyometric Core Power).`
    } else {
      // BODYBUILDING
      specializedPersonaPrompt = `شما سرمربی ارشد فدراسیون بین‌المللی بدنسازی (IFBB Pro Master Coach) و مدرس علوم هیپرتروفی و بیومکانیک تمرینی هستید.
شما برنامه‌های افزایش حجم عضلانی، هیپرتروفی علمی و تناسب اندام را طراحی می‌کنید.`
      styleRulesPrompt = `تمرینات باید شامل:
- حرکات ترکیبی پایه (Bench Press, Squat, Deadlift, Barbell Row, Overhead Press)
- حرکات تکمیلی با دمبل، سیم‌کش و دستگاه جهت تفکیک عضلانی کامل
توضیحات هر حرکت شامل تمرکز بر فاز منفی ۲-۳ ثانیه‌ای، انقباض ۱ ثانیه‌ای و ارتباط ذهن و عضله باشد.`
    }

    const systemPrompt = `${specializedPersonaPrompt}

قوانین حیاتی و اجباری خروجی JSON:
۱. تعداد روزها (workoutDays) باید دقیقاً برابر با ${targetDaysCount} روز باشد (نه کمتر و نه بیشتر).
۲. در هر روز تمرینی، حتماً باید حداقل ۸ حرکت تخصصی و حرفه‌ای (۸ تا ۱۰ حرکت) قرار داده شود.
۳. ${styleRulesPrompt}
۴. بخش توضیحات هر حرکت (customDescription) باید فوق‌العاده مختصر، خلاصه و کاربردی (حداکثر ۸ تا ۱۲ کلمه) باشد تا در جداول PDF کاملاً تمیز و یک‌خطی قرار گیرد (مثلاً: "انفجار کامل لگن در بالای حرکت و ریتم مداوم").
۵. بخش coachNotes صرفاً متن خلاصه دستورالعمل مربی بدون هیچگونه پیشوند مانند "توصیه مربی" یا "دستورالعمل اجرایی" باشد (مثلاً: "گرم کردن پویای مفاصل پیش از تمرین، رعایت فرم صحیح و مدیریت توان").
۶. پاسخ باید صرفاً یک ساختار JSON معتبر به زبان فارسی باشد.

فرمت دقیق JSON:
{
  "routineSummary": {
    "title": "برنامه حرفه‌ای ${trainingStyle === "CROSSFIT" ? "کراس‌فیت و WOD" : trainingStyle === "CALISTHENICS" ? "کالیستنیکس و وزن بدن" : trainingStyle === "SPORT_SPECIFIC" ? `مکمل تخصصی ${primarySport}` : "بدنسازی و هیپرتروفی"} (${targetDaysCount} روز در هفته)",
    "description": "توضیح علمی درباره اهداف برنامه و متدولوژی تمرینی استفاده شده.",
    "primarySport": "${primarySport}",
    "targetMuscleGroups": ["پشت", "سرشانه", "سینه", "پا", "شکم و پهلو"],
    "coachNotes": "گرم کردن پویای مفاصل، رعایت تکنیک صحیح و تنفس کنترل‌شده."
  },
  "workoutDays": [
    {
      "day": "SATURDAY",
      "label": "روز اول - تمرینات تخصصی",
      "exercises": [
        {
          "name": "عنوان حرکت استاندارد",
          "muscleGroup": "سینه",
          "sets": 4,
          "repetitions": "10-12",
          "restTime": "90 ثانیه",
          "weight": "",
          "customDescription": "توضیح کوتاه ۸ کلمه‌ای درباره اجرا.",
          "groupType": "NORMAL"
        }
      ]
    }
  ]
}

روزهای هفته (day) باید از این لیست انتخاب شوند:
["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]

گروه‌های عضلانی (muscleGroup) باید یکی از این مقادیر باشد:
["سینه", "پشت", "سرشانه", "بازو", "پا", "ساق پا", "شکم و پهلو", "سایر"]`

    const userPrompt = `لطفاً یک برنامه تمرینی کامل فوق‌العاده حرفه‌ای به زبان فارسی تنظیم کنید:
- مشخصات ورزشکار: ${clientName || "ورزشکار"} (${clientAge ? `${clientAge} سال` : "سن نامشخص"}، ${clientWeight ? `${clientWeight}kg` : ""}، ${clientHeight ? `${clientHeight}cm` : ""}، جنسیت: ${clientGender === "FEMALE" ? "خانم" : "آقا"})
- هدف عمومی: ${clientGoals || "افزایش آمادگی جسمانی"}
- ورزش اصلی (Primary Sport): ${primarySport}
- سبک تمرین: ${trainingStyle}
- هدف این برنامه: ${fitnessGoal}
- تعداد روزهای برنامه: دقیقاً ${targetDaysCount} روز
- مدت جلسه: ${sessionDurationMinutes} دقیقه
- سطح آمادگی: ${fitnessLevel}
- توضیحات مربی: ${notes || "بدون ملاحظات خاص"}`

    if (apiKey) {
      const isStandardOpenAiModel = selectedModel === "gpt-4o" || selectedModel === "gpt-4o-mini"

      for (const baseUrl of baseUrls) {
        try {
          const fetchBody: any = {
            model: selectedModel || process.env.GAPGPT_MODEL || "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }

          if (isStandardOpenAiModel) {
            fetchBody.response_format = { type: "json_object" }
          }

          const aiRes = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(fetchBody),
          })

          if (aiRes.ok) {
            const aiData = await aiRes.json()
            const content = aiData.choices?.[0]?.message?.content
            if (content) {
              const parsed = parseAiJson(content)
              const elapsedMs = Date.now() - startTime
              
              if (parsed?.workoutDays && Array.isArray(parsed.workoutDays) && parsed.workoutDays.length > 0) {
                // Decrement quota on success
                await prisma.trainer.update({
                  where: { id: session.user.id },
                  data: { aiQuota: { decrement: 1 } }
                })

                return NextResponse.json({
                  routineSummary: parsed.routineSummary,
                  workoutDays: parsed.workoutDays,
                  isSimulated: false,
                  aiModel: selectedModel || process.env.GAPGPT_MODEL || "gpt-4o",
                  provider: `GapGPT Live API (${baseUrl})`,
                  elapsedMs,
                })
              }
            }
          } else {
            console.warn(`GapGPT request to ${baseUrl} returned status ${aiRes.status}`)
          }
        } catch (err) {
          console.warn(`GapGPT fetch error for ${baseUrl}:`, err)
        }
      }
    }

    // High-Quality Specialized Fallback Generators per Style
    const dayNameKeys = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"] as const

    const fallbackSummary = {
      title: trainingStyle === "CROSSFIT"
        ? `برنامه تخصصی کراس‌فیت و آمادگی همه‌جانبه (${targetDaysCount} روز در هفته)`
        : trainingStyle === "CALISTHENICS"
        ? `برنامه تخصصی کالیستنیکس و وزن بدن (${targetDaysCount} روز در هفته)`
        : trainingStyle === "SPORT_SPECIFIC"
        ? `برنامه تخصصی مکمل ${primarySport} (${targetDaysCount} روز در هفته)`
        : `برنامه تخصصی بدنسازی و هیپرتروفی (${targetDaysCount} روز در هفته)`,
      description: `برنامه علمی طراحی شده جهت ارتقای آمادگی جسمانی، توان خروجی و عضلات مکمل در سبک ${trainingStyle}.`,
      primarySport,
      targetMuscleGroups: ["سینه", "پشت", "سرشانه", "پا", "شکم و پهلو"],
      coachNotes: `گرم کردن پویای مفاصل پیش از تمرین، مدیریت توان و رعایت فرم استاندارد حرکات.`,
    }

    // CrossFit Fallback Templates
    const crossFitDayTemplates = [
      {
        label: `روز اول - WOD ۱: توان انفجاری و وزنه برداری المپیکی (CrossFit MetCon)`,
        exercises: [
          { name: "تراستر با هالتر (Barbell Thrusters)", muscleGroup: "پا", sets: 4, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "اسکوات عمیق و انباشت نیرو جهت پرس عمودی بالای سر.", groupType: "NORMAL" },
          { name: "پول‌آپ کیپینگ (Kipping Pull-ups)", muscleGroup: "پشت", sets: 4, repetitions: "12-15", restTime: "60 ثانیه", weight: "", customDescription: "ریتم مداوم لگن و عبور چانه از بالای میله.", groupType: "NORMAL" },
          { name: "کتل‌بل سوئیگ روسی (Kettlebell Swings)", muscleGroup: "پا", sets: 4, repetitions: "15-20", restTime: "60 ثانیه", weight: "", customDescription: "انفجار کامل عضلات سرینی و انتقال نیرو.", groupType: "NORMAL" },
          { name: "پرش روی باکس (Box Jumps)", muscleGroup: "پا", sets: 4, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "فرود نرم روی باسن با زوایای زانوی ایمن.", groupType: "NORMAL" },
          { name: "وال بال شات (Wall Ball Shots)", muscleGroup: "سینه", sets: 4, repetitions: "15", restTime: "60 ثانیه", weight: "", customDescription: "پرتاب توپ سنگین به تارگت ۳ متری در انتهای اسکوات.", groupType: "NORMAL" },
          { name: "توز تو بار (Toes to Bar)", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "تماس همزمان هر دو شست پا با میله بارفیکس.", groupType: "NORMAL" },
          { name: "بورپی روی جعبه (Burpee Box Jump Overs)", muscleGroup: "سایر", sets: 3, repetitions: "10", restTime: "60 ثانیه", weight: "", customDescription: "تماس کامل سینه با زمین و پرش از روی باکس.", groupType: "NORMAL" },
          { name: "طناب زدن دوبل (Double Unders)", muscleGroup: "ساق پا", sets: 4, repetitions: "40", restTime: "45 ثانیه", weight: "", customDescription: "چرخش سریع مچ دست و پریدن مداوم.", groupType: "NORMAL" },
        ],
      },
      {
        label: `روز دوم - WOD ۲: قدرت وزنه برداری سنگین و ژیمناستیک (Olympic & Gymnastic)`,
        exercises: [
          { name: "پاور کلین و جرک (Power Clean & Jerk)", muscleGroup: "پشت", sets: 4, repetitions: "5-6", restTime: "90 ثانیه", weight: "", customDescription: "کشیدن سریع هالتر از روی زمین تا روی شانه و پرس.", groupType: "NORMAL" },
          { name: "شنا سوئدی روی دارحلقه (Ring Dips)", muscleGroup: "سینه", sets: 4, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "حفظ پایداری شانه روی حلقه‌های لرزان ژیمناستیک.", groupType: "NORMAL" },
          { name: "ددلیفت کراس‌فیت با هالتر سنگین", muscleGroup: "پا", sets: 4, repetitions: "6-8", restTime: "90 ثانیه", weight: "", customDescription: "قفل کامل باسن در بالای حرکت بدون قوس کمر.", groupType: "NORMAL" },
          { name: "شنا بالادست (Handstand Push-ups)", muscleGroup: "سرشانه", sets: 3, repetitions: "8-10", restTime: "75 ثانیه", weight: "", customDescription: "تماس سر با پد و کیپینگ پاها جهت بالابردن بدن.", groupType: "NORMAL" },
          { name: "اسکوات اورهد با هالتر (Overhead Squat)", muscleGroup: "پا", sets: 4, repetitions: "8", restTime: "90 ثانیه", weight: "", customDescription: "ثبات فوق‌العاده سرشانه‌ها با هالتر بالای سر.", groupType: "NORMAL" },
          { name: "زیربغل هالتر دست باز (Barbell Row)", muscleGroup: "پشت", sets: 3, repetitions: "10", restTime: "60 ثانیه", weight: "", customDescription: "تقویت بخش مرکزی پشت و فیله‌ها.", groupType: "NORMAL" },
          { name: "کرانچ شکم V-Up", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "تماس دست‌ها با مچ پا در بالای حرکت.", groupType: "NORMAL" },
          { name: "دوی سرعت ۵۰ متر / روئینگ (Rowing)", muscleGroup: "سایر", sets: 4, repetitions: "200 متر", restTime: "45 ثانیه", weight: "", customDescription: "کشش پاتنه‌ای قوی در سیستم رویینگ.", groupType: "NORMAL" },
        ],
      },
    ]

    // Calisthenics Fallback Templates
    const calisthenicsDayTemplates = [
      {
        label: `روز اول - قدرت بالاتنه با وزن بدن (Pull & Push Calisthenics)`,
        exercises: [
          { name: "بارفیکس دست باز (Wide Pull-ups)", muscleGroup: "پشت", sets: 4, repetitions: "8-10", restTime: "90 ثانیه", weight: "", customDescription: "عبور کامل چانه و کشش عمیق لاتیسیموس.", groupType: "NORMAL" },
          { name: "پارالل با وزن بدن (Dips)", muscleGroup: "سینه", sets: 4, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "پایین رفتن تا زاویه ۹۰ درجه آرنج و انقباض سینه.", groupType: "NORMAL" },
          { name: "ماسلی آپ رو میله (Bar Muscle-up)", muscleGroup: "پشت", sets: 3, repetitions: "5-6", restTime: "90 ثانیه", weight: "", customDescription: "انتقال انفجاری از کالیستنیکس به بالا.", groupType: "NORMAL" },
          { name: "شنا سوئدی پافشار روی استپ (Incline Push-ups)", muscleGroup: "سینه", sets: 4, repetitions: "15", restTime: "60 ثانیه", weight: "", customDescription: "تمرکز بر انقباض بخش بالایی سینه.", groupType: "NORMAL" },
          { name: "بارفیکس دست جمع برعکس (Chin-ups)", muscleGroup: "بازو", sets: 3, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "درگیری حداکثری عضلات دو سر بازویی.", groupType: "NORMAL" },
          { name: "شنا بالادست متمایل به دیوار (Pike Push-ups)", muscleGroup: "سرشانه", sets: 3, repetitions: "10", restTime: "60 ثانیه", weight: "", customDescription: "فشار مستقیم وزن بدن روی بخش قدامی دلتوئید.", groupType: "NORMAL" },
          { name: "دراگون فلاگ (Dragon Flag)", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "8-10", restTime: "60 ثانیه", weight: "", customDescription: "ثبات صاف بدن و کنترل فاز منفی منفی.", groupType: "NORMAL" },
          { name: "نگه‌داشتن L-Sit رو پارالل", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "30 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "بالا نگه داشتن پاها موازی با زمین.", groupType: "NORMAL" },
        ],
      },
    ]

    // Bodybuilding Fallback Templates
    const bodyBuildingDayTemplates = [
      {
        label: `روز اول - تقویت هیپرتروفی سینه، سرشانه و سه‌سر`,
        exercises: [
          { name: "پرس سینه هالتر روی نیمکت صاف", muscleGroup: "سینه", sets: 4, repetitions: "8-10", restTime: "90 ثانیه", weight: "", customDescription: "تمرکز بر فاز منفی ۲ ثانیه‌ای و انقباض سینه.", groupType: "NORMAL" },
          { name: "پرس بالا سینه دمبل", muscleGroup: "سینه", sets: 4, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "کشش کامل بخش بالایی سینه و کنترل دمبل.", groupType: "NORMAL" },
          { name: "قفسه سینه سیم‌کش (کابل کراس‌اور)", muscleGroup: "سینه", sets: 3, repetitions: "12-15", restTime: "60 ثانیه", weight: "", customDescription: "انقباض حداکثری ۱ ثانیه‌ای در مرکز حرکت.", groupType: "NORMAL" },
          { name: "پرس سرشانه هالتر ایستاده از جلو", muscleGroup: "سرشانه", sets: 4, repetitions: "8-10", restTime: "90 ثانیه", weight: "", customDescription: "ثبات بخش مرکزی بدن و شلیک عمودی نهایی.", groupType: "NORMAL" },
          { name: "نشر جانب دمبل ایستاده", muscleGroup: "سرشانه", sets: 4, repetitions: "12-15", restTime: "60 ثانیه", weight: "", customDescription: "تقویت سر میانی دلتوئید بدون بالابردن کلاغی.", groupType: "NORMAL" },
          { name: "پشت بازو سیم‌کش با طناب", muscleGroup: "بازو", sets: 3, repetitions: "12-15", restTime: "60 ثانیه", weight: "", customDescription: "باز کردن کامل طناب در انتهای فاز مثبت.", groupType: "NORMAL" },
          { name: "پشت بازو هالتر خوابیده (اسکال کراشر)", muscleGroup: "بازو", sets: 3, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "کشش عمیق بخش بلند سرسه‌سر بازویی.", groupType: "NORMAL" },
          { name: "پلانک ایزومتریک", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "45 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "ثبات کپسول مرکزی بدن و تنظیم تنفس.", groupType: "NORMAL" },
        ],
      },
    ]

    const selectedTemplates = trainingStyle === "CROSSFIT"
      ? crossFitDayTemplates
      : trainingStyle === "CALISTHENICS"
      ? calisthenicsDayTemplates
      : bodyBuildingDayTemplates

    const fallbackDays = []
    for (let i = 0; i < targetDaysCount; i++) {
      const template = selectedTemplates[i % selectedTemplates.length]
      fallbackDays.push({
        day: dayNameKeys[i % dayNameKeys.length],
        label: template.label,
        exercises: template.exercises,
      })
    }

    // Decrement quota on fallback execution
    await prisma.trainer.update({
      where: { id: session.user.id },
      data: { aiQuota: { decrement: 1 } }
    })

    return NextResponse.json({
      routineSummary: fallbackSummary,
      workoutDays: fallbackDays,
      isSimulated: true,
      aiModel: "Simulated Specialized Training Engine",
      provider: "Fallback Local Engine",
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    console.error("AI Routine Generation error:", error)
    return NextResponse.json({ error: "خطا در تولید برنامه تمرینی با هوش مصنوعی." }, { status: 500 })
  }
}
