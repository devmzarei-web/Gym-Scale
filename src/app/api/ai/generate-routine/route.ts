import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limiter"
import { getTrainerSubscriptionState, TIER_CONFIGS } from "@/lib/subscription"

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

// Backend Routine Validator, Sanitizer & Normalizer
function validateAndNormalizeRoutine(raw: any, targetDaysCount: number) {
  if (!raw || typeof raw !== "object") return null

  const validDays = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
  const validMuscleGroups = ["سینه", "پشت", "سرشانه", "بازو", "پا", "ساق پا", "شکم و پهلو", "سایر"]

  const summary = {
    title: String(raw.routineSummary?.title || `برنامه تمرینی تخصصی (${targetDaysCount} روز در هفته)`),
    description: String(raw.routineSummary?.description || ""),
    primarySport: String(raw.routineSummary?.primarySport || "ورزش عمومی"),
    targetMuscleGroups: Array.isArray(raw.routineSummary?.targetMuscleGroups)
      ? raw.routineSummary.targetMuscleGroups.map(String)
      : ["سینه", "پشت", "سرشانه", "پا"],
    coachNotes: String(raw.routineSummary?.coachNotes || "")
      .replace(/^(نکته:|توصیه مربی:|دستورالعمل:)\s*/gi, "")
      .trim(),
  }

  let days = Array.isArray(raw.workoutDays) ? raw.workoutDays : []
  if (days.length === 0) return null

  const trimmedDays = days.slice(0, targetDaysCount)
  const normalizedDays = trimmedDays.map((d: any, dIdx: number) => {
    const dayKey = validDays.includes(d.day) ? d.day : validDays[dIdx % validDays.length]
    const label = String(d.label || `روز ${dIdx + 1}`)
    const exercises = Array.isArray(d.exercises)
      ? d.exercises.map((ex: any) => {
          let groupType = String(ex.groupType || "NORMAL").toUpperCase()
          if (groupType === "STRAIGHT_SET" || !["NORMAL", "SUPERSET", "TRISET", "DROPSET", "TEMPO", "REST_PAUSE", "CIRCUIT"].includes(groupType)) {
            groupType = "NORMAL"
          }

          const muscleGroup = validMuscleGroups.includes(ex.muscleGroup) ? ex.muscleGroup : "سایر"
          const sets = typeof ex.sets === "number" ? Math.max(1, Math.min(10, ex.sets)) : parseInt(ex.sets) || 3
          const repetitions = String(ex.repetitions || "10-12")
          const restTime = String(ex.restTime || "60 ثانیه")
          const customDescription = String(ex.customDescription || "").trim()

          return {
            id: ex.id || `ex_${Math.random().toString(36).substring(2, 9)}`,
            name: String(ex.name || "حرکت تمرینی"),
            muscleGroup,
            sets,
            repetitions,
            restTime,
            weight: typeof ex.weight === "string" ? ex.weight : "",
            customDescription,
            groupType,
            pairedMuscleGroup: (groupType === "SUPERSET" || groupType === "TRISET") ? String(ex.pairedMuscleGroup || "") : undefined,
            pairedExerciseName: (groupType === "SUPERSET" || groupType === "TRISET") ? String(ex.pairedExerciseName || "") : undefined,
            triMuscleGroup2: groupType === "TRISET" ? String(ex.triMuscleGroup2 || "") : undefined,
            triExerciseName2: groupType === "TRISET" ? String(ex.triExerciseName2 || "") : undefined,
          }
        })
      : []

    return {
      id: d.id || `day_${dIdx + 1}`,
      day: dayKey,
      label,
      exercises,
    }
  })

  return {
    routineSummary: summary,
    workoutDays: normalizedDays,
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
        error: "اعتبار اشتراک شما به پایان رسیده است. جهت تولید برنامه با هوش مصنوعی، لطفاً اشتراک خود را در NutriTrain تمدید فرمایید."
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

    // Persona definitions based on trainingStyle
    let specializedPersonaPrompt = ""
    if (trainingStyle === "HOME_WORKOUT") {
      specializedPersonaPrompt = `شما سرمربی ارشد تمرین در منزل با تخصص تمرین با وزن بدن، دمبل، کش‌های مقاومتی و تجهیزات محدود هستید. حرکات باید با تجهیزات قابل دسترس و فضای معمول منزل قابل اجرا باشند.`
    } else if (trainingStyle === "CROSSFIT") {
      specializedPersonaPrompt = `شما مربی ارشد CrossFit و متخصص طراحی Strength، Conditioning، MetCon و WOD هستید. برنامه باید ترکیبی منطقی از قدرت، توان، ظرفیت هوازی/بی‌هوازی، مهارت و conditioning داشته باشد و از ترکیب تصادفی حرکات جلوگیری شود.`
    } else if (trainingStyle === "CALISTHENICS") {
      specializedPersonaPrompt = `شما سرمربی کالیستنیکس و متخصص کنترل وزن بدن، relative strength، مهارت‌های حرکتی، ثبات مفاصل و progression هستید. حرکات باید بر اساس سطح واقعی ورزشکار انتخاب شوند و از تجویز مهارت‌های پیشرفته برای فرد نامتناسب جلوگیری شود.`
    } else if (trainingStyle === "SPORT_SPECIFIC") {
      specializedPersonaPrompt = `شما مدیر ارشد Strength & Conditioning برای ورزشکاران رقابتی هستید و برنامه را بر اساس بیومکانیک، نیازهای انرژی، الگوهای حرکتی، قدرت، توان، سرعت، چابکی، ثبات، mobility و نیازهای رشته ورزشی (${primarySport}) طراحی می‌کنید. تمرین نباید صرفاً یک برنامه بدنسازی عمومی با نام رشته ورزشی باشد.`
    } else {
      specializedPersonaPrompt = `شما مربی ارشد هایپرتروفی و متخصص Exercise Selection، Volume Management، Intensity، RIR، Tempo و مدیریت خستگی هستید. تمرکز بر تحریک مؤثر عضله، دامنه حرکتی مناسب، progressive overload و مدیریت حجم تمرینی است.`
    }

    const parsedDuration = parseInt(sessionDurationMinutes) || 60

    const titlePrefix = trainingStyle === "HOME_WORKOUT"
      ? "تمرین در منزل و هوم‌جیم"
      : trainingStyle === "CROSSFIT"
      ? "کراس‌فیت و WOD"
      : trainingStyle === "CALISTHENICS"
      ? "کالیستنیکس و وزن بدن"
      : trainingStyle === "SPORT_SPECIFIC"
      ? "مکمل تخصصی " + primarySport
      : "بدنسازی و هیپرتروفی"

    const systemPrompt = `شما یک **Elite Sports Performance & Exercise Programming AI** هستید؛ یک سیستم تخصصی طراحی برنامه تمرینی که باید مانند یک مربی ارشد، متخصص فیزیولوژی تمرین، متخصص آمادگی جسمانی و برنامه‌ریز عملکرد ورزشی با تجربه حرفه‌ای عمل کند.

وظیفه شما تولید برنامه تمرینی **شخصی‌سازی‌شده، علمی، عملی، قابل اجرا، متناسب با زمان جلسه و متناسب با سطح ورزشکار** است.
شما نباید صرفاً مجموعه‌ای از حرکات رایج تولید کنید. ابتدا باید اطلاعات ورزشکار، هدف، رشته ورزشی، سبک تمرین، سطح آمادگی، تعداد روزهای تمرین، مدت جلسه و محدودیت‌های ذکرشده را تحلیل کرده و سپس مناسب‌ترین ساختار تمرینی را طراحی کنید.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۱. سلسله‌مراتب تصمیم‌گیری
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
هنگام طراحی برنامه، این اولویت را رعایت کنید:
1. ایمنی و محدودیت‌های ذکرشده توسط مربی
2. هدف اختصاصی برنامه (${fitnessGoal})
3. نیازهای رشته ورزشی (${primarySport})
4. سطح آمادگی ورزشکار (${fitnessLevel})
5. تعداد روزهای تمرین در هفته (${targetDaysCount} روز)
6. مدت واقعی هر جلسه (${parsedDuration} دقیقه)
7. هدف عمومی ورزشکار (${clientGoals || "افزایش آمادگی"})
8. ایجاد تنوع، جذابیت و پایبندی بلندمدت

هرگز برای ایجاد برنامه‌ای ظاهراً حرفه‌ای، ایمنی، قابلیت اجرا یا تناسب با هدف را قربانی تنوع حرکات نکنید.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۲. پرسونای تخصصی سبک تمرین
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${specializedPersonaPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۳. ساختار هفتگی
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
تعداد روزهای workoutDays باید **دقیقاً برابر با ${targetDaysCount}** باشد (نه کمتر و نه بیشتر).
از روزهای زیر استفاده کنید:
["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]

روزها را طوری انتخاب و توزیع کنید که عضلات بیش از حد متوالی تحت فشار قرار نگیرند، recovery منطقی وجود داشته باشد و حجم تمرینی هفتگی متناسب با سطح ورزشکار باشد.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۴. انتخاب و ترتیب حرکات
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
حرکات را بر اساس هدف و نیاز ورزشکار انتخاب کنید.
ترتیب منطقی جلسه:
1. حرکات مهارتی، انفجاری یا تکنیکی
2. حرکات چندمفصلی اصلی
3. حرکات چندمفصلی ثانویه
4. حرکات کمکی
5. حرکات ایزوله
6. Core / conditioning در صورت نیاز

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۵. قوانین تعداد حرکات، ست‌ها و مدت جلسه
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- سطح مبتدی: ۶ تا ۷ حرکت در هر روز، ۲ تا ۳ ست، حرکات پایه، استراحت ۴۵ تا ۶۰ ثانیه.
- سطح متوسط: ۷ تا ۸ حرکت در هر روز، ۳ تا ۴ ست.
- سطح پیشرفته / حرفه‌ای: حداقل ۸ و حداکثر ۱۰ حرکت در هر روز، ۳ تا ۴ ست. در صورت لزوم حداکثر ۳ تکنیک پیشرفته (سوپرست، تری‌ست، دراپ‌ست، تمپو).
کل برنامه باید واقعاً در ${parsedDuration} دقیقه قابل اجرا باشد.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۶. قوانین زمان استراحت (restTime)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
استراحت باید با شدت و ماهیت حرکت هماهنگ باشد:
- حرکات سنگین و چندمفصلی پایه: ۶۰ تا ۱۲۰ ثانیه
- حرکات متوسط و کمکی: ۴۵ تا ۹۰ ثانیه
- حرکات ایزوله یا conditioning: ۳۰ تا ۶۰ ثانیه
در جلسات فشرده (<= ۴۵ دقیقه)، استراحت‌ها عمدتاً ۳۰ تا ۶۰ ثانیه تنظیم شوند مگر حرکات سنگین که به ریکاوری نیاز دارند.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۷. توضیحات حرکت و Coach Notes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- customDescription باید به زبان فارسی، حداکثر ۸ تا ۱۲ کلمه، کوتاه، کاربردی و حاوی مهم‌ترین نکته اجرایی باشد (مثال: "کنترل کامل فاز منفی و انقباض قوی در نقطه اوج").
- coachNotes صرفاً حاوی دستورالعمل خلاصه مربی بدون عنوان، بدون "نکته:" و بدون پیشوند باشد.
- muscleGroup فقط باید یکی از این مقادیر باشد: ["سینه", "پشت", "سرشانه", "بازو", "پا", "ساق پا", "شکم و پهلو", "سایر"]
- اگر حرکت تک است: groupType = "NORMAL" و فیلدهای pairing خالی باشند.
- اگر سوپرست است: groupType = "SUPERSET" و فیلدهای pairedMuscleGroup و pairedExerciseName کامل پر شوند.
- اگر تری‌ست است: groupType = "TRISET" و فیلدهای pairedMuscleGroup، pairedExerciseName، triMuscleGroup2 و triExerciseName2 کامل پر شوند.
- فیلد weight در صورت نبود اطلاعات کافی خالی باشد ("").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۸. کنترل کیفیت داخلی و قوانین خروجی JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
قبل از تولید خروجی، بررسی کنید:
✓ تعداد روزها دقیقاً ${targetDaysCount} است.
✓ حرکات و ست‌ها در ${parsedDuration} دقیقه قابل اجرا هستند.
✓ محدودیت‌های notes رعایت شده‌اند.
✓ خروجی فقط و فقط یک JSON معتبر باشد (بدون Markdown، بدون \`\`\`json و بدون هیچ متن اضافی قبل یا بعد از آن).

فرمت دقیق ساختار JSON:
{
  "routineSummary": {
    "title": "برنامه حرفه‌ای ${titlePrefix} (${targetDaysCount} روز در هفته)",
    "description": "توضیح علمی درباره اهداف برنامه و متدولوژی تمرینی.",
    "primarySport": "${primarySport}",
    "targetMuscleGroups": ["سینه", "پشت", "سرشانه", "پا"],
    "coachNotes": "گرم کردن پویای مفاصل پیش از تمرین، رعایت فرم صحیح و مدیریت توان."
  },
  "workoutDays": [
    {
      "day": "SATURDAY",
      "label": "روز اول - تمرینات تخصصی",
      "exercises": [
        {
          "name": "پرس سینه دمبل روی نیمکت",
          "muscleGroup": "سینه",
          "sets": 4,
          "repetitions": "10-12",
          "restTime": "60 ثانیه",
          "weight": "",
          "customDescription": "کنترل کامل فاز منفی و انقباض قوی در نقطه اوج.",
          "groupType": "SUPERSET",
          "pairedMuscleGroup": "پشت",
          "pairedExerciseName": "زیربغل دمبل تک دست"
        },
        {
          "name": "اسکوات هالتر پشت",
          "muscleGroup": "پا",
          "sets": 4,
          "repetitions": "8-10",
          "restTime": "90 ثانیه",
          "weight": "",
          "customDescription": "پایین رفتن با کنترل و انقباض قوی در نقطه بازگشت.",
          "groupType": "NORMAL"
        }
      ]
    }
  ]
}`

    const userPrompt = `یک برنامه تمرینی کاملاً شخصی‌سازی‌شده و حرفه‌ای بر اساس اطلاعات زیر طراحی کن.
اطلاعات را فقط به صورت جداگانه بررسی نکن؛ آن‌ها را به عنوان یک سیستم واحد در نظر بگیر و برنامه‌ای بساز که از نظر هدف، حجم تمرین، انتخاب حرکات، ترتیب حرکات، recovery و زمان جلسه کاملاً با یکدیگر سازگار باشند.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
اطلاعات ورزشکار
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
نام: ${clientName || "ورزشکار"}
سن: ${clientAge ? `${clientAge} سال` : "نامشخص"}
وزن: ${clientWeight ? `${clientWeight} kg` : "نامشخص"}
قد: ${clientHeight ? `${clientHeight} cm` : "نامشخص"}
جنسیت: ${clientGender === "FEMALE" ? "خانم" : "آقا"}
هدف عمومی: ${clientGoals || "افزایش آمادگی جسمانی"}
ورزش اصلی: ${primarySport}
سبک تمرین: ${trainingStyle}
هدف اختصاصی این برنامه: ${fitnessGoal}
تعداد روزهای تمرین: دقیقاً ${targetDaysCount} روز
مدت هر جلسه: ${parsedDuration} دقیقه
سطح آمادگی: ${fitnessLevel}
توضیحات و محدودیت‌های مربی: ${notes || "بدون محدودیت خاص"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
دستور طراحی
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
بر اساس تمام اطلاعات بالا، یک برنامه هفتگی منسجم طراحی کن که:
* دقیقاً ${targetDaysCount} روز تمرینی داشته باشد.
* با سطح ${fitnessLevel} سازگار باشد.
* در هر جلسه واقعاً در ${parsedDuration} دقیقه قابل اجرا باشد.
* مستقیماً برای هدف "${fitnessGoal}" طراحی شده باشد.
* در صورت وجود primarySport (${primarySport})، نیازهای عملکردی آن ورزش را در برنامه لحاظ کند.
* محدودیت‌ها و توضیحات مربی را کاملاً رعایت کند.
* توزیع حجم و recovery در کل هفته منطقی باشد.
* ترتیب حرکات هدفمند باشد.
* حرکات تکراری یا کم‌ارزش صرفاً برای پر کردن برنامه استفاده نشوند.
* برای ورزشکار امکان پیشرفت تدریجی فراهم شود.

در صورت استفاده از SUPERSET، TRI-SET یا سایر روش‌های پیشرفته، pairing و منطق آن‌ها را کامل و معتبر ثبت کن.
خروجی را دقیقاً مطابق JSON schema تعریف‌شده در System Prompt تولید کن.
فقط JSON معتبر برگردان. هیچ متن دیگری خارج از JSON ننویس.`

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
              
              const validated = validateAndNormalizeRoutine(parsed, targetDaysCount)
              if (validated?.workoutDays && Array.isArray(validated.workoutDays) && validated.workoutDays.length > 0) {
                // Decrement quota on success
                await prisma.trainer.update({
                  where: { id: session.user.id },
                  data: { aiQuota: { decrement: 1 } }
                })

                return NextResponse.json({
                  routineSummary: validated.routineSummary,
                  workoutDays: validated.workoutDays,
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

    // High-Quality Specialized Fallback Generators per Style & Rest Time rules
    const dayNameKeys = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"] as const
    const defaultRestTime = parsedDuration <= 45 ? "45 ثانیه" : parsedDuration <= 60 ? "60 ثانیه" : "75 ثانیه"
    const defaultSets = fitnessLevel === "مبتدی" || fitnessLevel === "BEGINNER" ? 3 : 4

    const fallbackSummary = {
      title: trainingStyle === "HOME_WORKOUT"
        ? `برنامه تخصصی تمرین در منزل و هوم‌جیم (${targetDaysCount} روز در هفته)`
        : trainingStyle === "CROSSFIT"
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

    // Home Workout Fallback Templates
    const homeWorkoutDayTemplates = [
      {
        label: `روز اول - فول‌بادی خانگی (وزن بدن + کش مقاوتی)`,
        exercises: [
          { name: "اسکوات با کش مقاوتی (Banded Squat)", muscleGroup: "پا", sets: defaultSets, repetitions: "12-15", restTime: defaultRestTime, weight: "", customDescription: "قرار دادن کش زیر پا و مکث ۱ ثانیه‌ای در انتهای اسکوات.", groupType: "NORMAL" },
          { name: "شنا سوئدی پافشار روی صندلی (Incline Push-ups)", muscleGroup: "سینه", sets: defaultSets, repetitions: "12-15", restTime: defaultRestTime, weight: "", customDescription: "تمرکز بر انقباض سینه با ریتم آرام ۳ ثانیه‌ای.", groupType: "NORMAL" },
          { name: "زیربغل با کش پیلاتس ایستاده (Banded Row)", muscleGroup: "پشت", sets: 4, repetitions: "15", restTime: "60 ثانیه", weight: "", customDescription: "انقباض کامل کتف‌ها در انتهای حرکت.", groupType: "NORMAL" },
          { name: "پرس سرشانه با کش مقاوتی (Banded Overhead Press)", muscleGroup: "سرشانه", sets: 4, repetitions: "12-15", restTime: "60 ثانیه", weight: "", customDescription: "ایستادن روی مرکز کش و پرس مستقیم بالای سر.", groupType: "NORMAL" },
          { name: "دیپ پشت بازو روی صندلی (Chair Dips)", muscleGroup: "بازو", sets: 3, repetitions: "12-15", restTime: "60 ثانیه", weight: "", customDescription: "حفظ زاویه ۹۰ درجه آرنج و انقباض پشت بازو.", groupType: "NORMAL" },
          { name: "جلو بازو با کش مینی‌لوپ یا دمبل خانگی", muscleGroup: "بازو", sets: 3, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "ثبات کامل آرنج کنار بدن.", groupType: "NORMAL" },
          { name: "پل سرینی روی زمین با مکث (Glute Bridge Hold)", muscleGroup: "پا", sets: 4, repetitions: "15 (مکث ۲ ثانیه)", restTime: "45 ثانیه", weight: "", customDescription: "فشار روی پاشنه پا و انقباض عضلات سرینی.", groupType: "NORMAL" },
          { name: "مانتن کلمبر روی زمین (Mountain Climbers)", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "30 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "حرکت تناوبی زانوها به سمت سینه در حالت پلانک.", groupType: "NORMAL" },
        ],
      },
    ]

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

    const selectedTemplates = trainingStyle === "HOME_WORKOUT"
      ? homeWorkoutDayTemplates
      : trainingStyle === "CROSSFIT"
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
