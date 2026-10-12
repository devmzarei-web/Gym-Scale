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

// Curated pool of distinctive exercises per muscle group to prevent cross-day duplication
const DIVERSE_EXERCISES_BY_MUSCLE: Record<string, string[]> = {
  "سینه": [
    "پرس سینه هالتر روی نیمکت صاف",
    "پرس بالا سینه دمبل",
    "قفسه سینه سیم‌کش (کابل کراس‌اور)",
    "شنا سوئدی پافشار با تمرکز بر سینه",
    "پرس زیر سینه هالتر",
    "پارالل با وزن بدن با شیب به جلو",
    "فلای دمبل روی نیمکت شیبدار",
    "پرس سینه با دمبل موازی (Hammer Press)",
  ],
  "پشت": [
    "بارفیکس دست باز مچ برعکس",
    "زیربغل هالتر خم دست برعکس",
    "زیربغل سیم‌کش قایقی دست جمع",
    "زیربغل تک دمبل خم روی نیمکت",
    "لت سیم‌کش از جلو دست متوسط",
    "تی بار هالتر دست جمع",
    "فیله کمر روی نیمکت ۴۵ درجه",
    "پول‌اور دمبل یا سیم‌کش",
  ],
  "سرشانه": [
    "پرس سرشانه هالتر نظامی ایستاده",
    "نشر از جانب دمبل ایستاده",
    "پرس سرشانه آرنولدی با دمبل",
    "نشر خم دمبل روی میز شیبدار",
    "فیس پول سیم‌کش با طناب",
    "کول هالتر دست متوسط",
    "نشر از جلو صفحه هالتر",
    "پرس سرشانه دمبل نشسته",
  ],
  "بازو": [
    "جلو بازو هالتر ایستاده EZ",
    "جلو بازو دمبل روی میز شیبدار",
    "جلو بازو لاری سیم‌کش",
    "جلو بازو چکشی دمبل",
    "پشت بازو هالتر خوابیده (اسکال کراشر)",
    "پشت بازو سیم‌کش با طناب",
    "دیپ پشت بازو بین دو نیمکت",
    "پشت بازو دمبل پشت گردن تک دست",
  ],
  "پا": [
    "اسکوات هالتر از پشت استاندارد",
    "پرس پا ۴۵ درجه دستگاه",
    "هاگ اسکوات پا جمع",
    "ددلیفت رومانیایی با دمبل",
    "پشت پا دستگاه خوابیده",
    "جلو پا دستگاه با مکث انقباضی",
    "لانگز راه رفتنی با دمبل",
    "هیپ تراست هالتر روی نیمکت",
  ],
  "ساق پا": [
    "ساق پا ایستاده با دستگاه",
    "ساق پا نشسته با وزنه",
    "ساق پا دانکی با وزن بدن",
    "پرش مچ پا متوالی روی پنجه",
  ],
  "شکم و پهلو": [
    "پلانک ایزومتریک استاندارد",
    "کرانچ سیم‌کش زانو زده",
    "زیرشکم خلبانی آویزان از میله",
    "چرخش روسی با صفحه یا توپ سنگین",
    "کرانچ معکوس روی نیمکت شیبدار",
    "مانتن کلمبر روی زمین",
  ],
  "سایر": [
    "بورپی انفجاری با پرش عمودی",
    "کتل‌بل سوئینگ روسی",
    "روئینگ سرعتی ۵۰۰ متر",
    "طناب زدن سرعتی دوبل",
    "وال بال شات با توپ سنگین",
  ],
}

// Backend Routine Validator, Sanitizer & Deduplication Normalizer
function validateAndNormalizeRoutine(raw: any, targetDaysCount: number) {
  if (!raw || typeof raw !== "object") return null

  const validDays = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
  const validMuscleGroups = ["سینه", "پشت", "سرشانه", "بازو", "پا", "ساق پا", "شکم و پهلو", "سایر"]
  const dayNamesFarsi = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم", "هفتم"]

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
    let label = String(d.label || `روز ${dayNamesFarsi[dIdx] || (dIdx + 1)} - تمرینات تخصصی`)

    // Fix repeated "روز اول" if AI hallucinates duplicate day label
    if (dIdx > 0 && label.includes("روز اول")) {
      label = `روز ${dayNamesFarsi[dIdx] || (dIdx + 1)} - تمرینات مکمل`
    }

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

  // Mandatory Cross-Day Deduplication:
  // If the AI repeated an exercise across days, replace it with an unused distinctive exercise
  const usedExerciseNames = new Set<string>()
  for (let dIdx = 0; dIdx < normalizedDays.length; dIdx++) {
    const day = normalizedDays[dIdx]
    for (const ex of day.exercises) {
      if (dIdx > 0 && usedExerciseNames.has(ex.name)) {
        const pool = DIVERSE_EXERCISES_BY_MUSCLE[ex.muscleGroup] || DIVERSE_EXERCISES_BY_MUSCLE["سایر"]
        const replacement = pool.find((name) => !usedExerciseNames.has(name)) || `${ex.name} (تنوع ${dIdx + 1})`
        ex.name = replacement
        usedExerciseNames.add(replacement)
      } else {
        usedExerciseNames.add(ex.name)
      }
    }
  }

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
      trainingStyle = "CROSSFIT", // CROSSFIT | BODYBUILDING | SPORT_SPECIFIC | CALISTHENICS | HOME_WORKOUT
      fitnessGoal = "افزایش توان تنفسی، قدرت انفجاری و آمادگی همه‌جانبه",
      daysPerWeek = 4,
      sessionDurationMinutes = 60,
      fitnessLevel = "متوسط",
      notes = "",
      selectedModel = "gpt-4o",
    } = body

    const targetDaysCount = Math.min(6, Math.max(3, parseInt(daysPerWeek) || 4))
    const parsedDuration = parseInt(sessionDurationMinutes) || 60

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

وظیفه شما تولید برنامه تمرینی **شخصی‌سازی‌شده، کاملاً علمی، عملی، قابل اجرا، متناسب با زمان جلسه و متناسب با سطح ورزشکار** است.
شما نباید صرفاً مجموعه‌ای از حرکات رایج یا تکراری تولید کنید. ابتدا باید اطلاعات ورزشکار، هدف، رشته ورزشی، سبک تمرین، سطح آمادگی، تعداد روزهای تمرین، مدت جلسه و محدودیت‌های ذکرشده را تحلیل کرده و سپس مناسب‌ترین ساختار تمرینی را طراحی کنید.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۱. سلسله‌مراتب تصمیم‌گیری
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
هنگام طراحی برنامه، این اولویت را رعایت کنید:
1. ایمنی و محدودیت‌های ذکرشده توسط مربی (${notes || "بدون محدودیت خاص"})
2. هدف اختصاصی برنامه (${fitnessGoal})
3. نیازهای رشته ورزشی (${primarySport})
4. سطح آمادگی ورزشکار (${fitnessLevel})
5. تعداد روزهای تمرین در هفته (${targetDaysCount} روز)
6. مدت واقعی هر جلسه (${parsedDuration} دقیقه)
7. هدف عمومی ورزشکار (${clientGoals || "افزایش آمادگی"})
8. ایجاد تنوع، جذابیت و پایبندی بلندمدت

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۲. پرسونای تخصصی سبک تمرین
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${specializedPersonaPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۳. ساختار هفتگی و قانون اکید عدم تکرار حرکات (Zero-Duplication Rule)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
تعداد روزهای workoutDays باید **دقیقاً برابر با ${targetDaysCount}** باشد (نه کمتر و نه بیشتر).
از روزهای زیر استفاده کنید:
["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]

قوانین حیاتی و غیرقابل نقض:
۱. هر روز تمرینی باید دارای عنوان (label) کاملاً متمایز، هدف مستقل و تفکیک عضلانی مشخص باشد (مثال در برنامه ۳ روزه: "روز اول - سینه و پشت بازو"، "روز دوم - عضلات پشت و جلو بازو"، "روز سوم - عضلات پا و سرشانه").
۲. **اکیداً ممنوع است که حرکات یک روز در روزهای دیگر تکرار شوند!** تمام حرکات در تمام روزها باید ۱۰۰٪ متمایز، متنوع، غیرتکراری و متناسب با عضلات هدف آن روز باشند. کپی کردن حرکات روز اول در روزهای دوم یا سوم تحت هیچ شرایطی مجاز نیست.
۳. در هر جلسه بین ۷ تا ۸ حرکت کاملاً متنوع و علمی قرار دهید.
۴. اسپلیت روزها باید بر اساس تعداد روزهای درخواستی (${targetDaysCount} روز) تنظیم شود:
   - در برنامه ۳ روزه: ساختار علمی Push / Pull / Legs یا سینه-پشت‌بازو / پشت-جلوبازو / پا-سرشانه
   - در برنامه ۴ روزه: تفکیک چهارگانه مجزا (سینه و پشت‌بازو / زیربغل و جلوبازو / پا و شکم / سرشانه و کول)
   - در برنامه ۵ یا ۶ روزه: تفکیک پیشرفته بدون هیچ حرکت تکراری.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۴. ترتیب حرکات در هر روز
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. حرکات مهارتی، انفجاری یا تکنیکی
2. حرکات چندمفصلی سنگین پایه
3. حرکات چندمفصلی کمکی
4. حرکات ایزوله تک‌مفصلی
5. Core / Conditioning در صورت نیاز

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۵. قوانین تعداد حرکات، ست‌ها و مدت جلسه
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- سطح مبتدی: ۶ تا ۷ حرکت در هر روز، ۲ تا ۳ ست، استراحت ۴۵ تا ۶۰ ثانیه.
- سطح متوسط: ۷ تا ۸ حرکت در هر روز، ۳ تا ۴ ست.
- سطح پیشرفته: ۸ تا ۹ حرکت در هر روز، ۳ تا ۴ ست.
کل برنامه باید واقعاً در ${parsedDuration} دقیقه قابل اجرا باشد.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۶. قوانین زمان استراحت (restTime)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
استراحت باید با شدت و ماهیت حرکت هماهنگ باشد:
- حرکات سنگین و چندمفصلی پایه: ۶۰ تا ۹۰ ثانیه
- حرکات متوسط و کمکی: ۴۵ تا ۶۰ ثانیه
- حرکات ایزوله یا conditioning: ۳۰ تا ۴۵ ثانیه

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۷. توضیحات حرکت و Coach Notes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- customDescription باید به زبان فارسی، حداکثر ۸ تا ۱۲ کلمه، کوتاه، کاربردی و حاوی مهم‌ترین نکته اجرایی باشد.
- coachNotes صرفاً حاوی دستورالعمل خلاصه مربی بدون عنوان و بدون پیشوند باشد.
- muscleGroup فقط باید یکی از این مقادیر باشد: ["سینه", "پشت", "سرشانه", "بازو", "پا", "ساق پا", "شکم و پهلو", "سایر"]
- اگر حرکت تک است: groupType = "NORMAL" و فیلدهای pairing خالی باشند.
- اگر سوپرست است: groupType = "SUPERSET" و فیلدهای pairedMuscleGroup و pairedExerciseName پر شوند.
- فیلد weight در صورت نبود اطلاعات کافی خالی باشد ("").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۸. کنترل کیفیت داخلی و خروجی JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
قبل از تولید خروجی، مطمئن شوید:
✓ تعداد روزها دقیقاً ${targetDaysCount} است.
✓ **هیچ حرکتی در روزهای مختلف تکرار نشده است.**
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
      "label": "روز اول - سینه و پشت بازو",
      "exercises": [
        {
          "name": "پرس سینه هالتر روی نیمکت صاف",
          "muscleGroup": "سینه",
          "sets": 4,
          "repetitions": "8-10",
          "restTime": "75 ثانیه",
          "weight": "",
          "customDescription": "کنترل کامل فاز منفی و انقباض قوی در نقطه اوج.",
          "groupType": "NORMAL"
        }
      ]
    }
  ]
}`

    const userPrompt = `یک برنامه تمرینی کاملاً شخصی‌سازی‌شده و حرفه‌ای بر اساس اطلاعات زیر طراحی کن:
نام ورزشکار: ${clientName || "ورزشکار"}
سن: ${clientAge ? `${clientAge} سال` : "نامشخص"} | وزن: ${clientWeight ? `${clientWeight} kg` : "نامشخص"} | قد: ${clientHeight ? `${clientHeight} cm` : "نامشخص"}
جنسیت: ${clientGender === "FEMALE" ? "خانم" : "آقا"}
هدف عمومی: ${clientGoals || "افزایش آمادگی جسمانی"}
ورزش اصلی: ${primarySport} | سبک تمرین: ${trainingStyle}
هدف اختصاصی این برنامه: ${fitnessGoal}
تعداد روزهای تمرین: دقیقاً ${targetDaysCount} روز
مدت هر جلسه: ${parsedDuration} دقیقه
سطح آمادگی: ${fitnessLevel}
توضیحات و محدودیت‌های مربی: ${notes || "بدون محدودیت خاص"}

قوانین الزامی:
* برنامه باید دقیقاً ${targetDaysCount} روز مجزا داشته باشد.
* **مهم‌ترین قانون: تمام حرکات در تمام روزها باید ۱۰۰٪ متمایز و بدون هیچ‌گونه تکرار باشند (Zero exercise repetition across days). هرگز حرکات یک روز را برای روزهای دیگر تکرار نکن.**
* هر جلسه باید دارای ۷ تا ۸ حرکت متناسب با زمان جلسه (${parsedDuration} دقیقه) باشد.
* خروجی را دقیقاً مطابق با ساختار JSON تعریف‌شده در System Prompt برگردان بدون هیچ متن اضافی.`

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

          // Try with json_object response format first if supported
          let aiRes = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              ...fetchBody,
              ...(isStandardOpenAiModel ? { response_format: { type: "json_object" } } : {}),
            }),
            signal: AbortSignal.timeout(60000),
          }).catch((err) => {
            console.warn(`Fetch error for ${baseUrl}:`, err)
            return null
          })

          // If proxy fails with 400 on response_format, retry immediately without response_format
          if (aiRes && !aiRes.ok && aiRes.status === 400 && isStandardOpenAiModel) {
            console.warn(`Retrying ${baseUrl} without response_format...`)
            aiRes = await fetch(`${baseUrl}/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify(fetchBody),
              signal: AbortSignal.timeout(60000),
            }).catch(() => null)
          }

          if (aiRes && aiRes.ok) {
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
          } else if (aiRes) {
            const errText = await aiRes.text().catch(() => "")
            console.error(`AI API call to ${baseUrl} failed: status=${aiRes.status}, error=${errText}`)
          }
        } catch (err) {
          console.warn(`AI request error for ${baseUrl}:`, err)
        }
      }
    } else {
      console.warn("No GAPGPT_API_KEY or OPENAI_API_KEY configured. Utilizing specialized offline multi-day split engine.")
    }

    // High-Quality Multi-Day Fallback Generators: 6 Distinct Days per Style, 0 Repetition
    const dayNameKeys = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"] as const
    const defaultRestTime = parsedDuration <= 45 ? "45 ثانیه" : parsedDuration <= 60 ? "60 ثانیه" : "75 ثانیه"
    const defaultSets = fitnessLevel === "مبتدی" || fitnessLevel === "BEGINNER" ? 3 : 4

    // 1. Bodybuilding 6 Distinct Days Split
    const bodyBuildingDayTemplates = [
      {
        label: "روز اول - عضلات سینه و جلو بازو (Push Focus)",
        exercises: [
          { name: "پرس سینه هالتر روی نیمکت صاف", muscleGroup: "سینه", sets: defaultSets, repetitions: "8-10", restTime: "75 ثانیه", weight: "", customDescription: "تمرکز بر فاز منفی ۲ ثانیه‌ای و انقباض سینه.", groupType: "NORMAL" },
          { name: "پرس بالا سینه دمبل", muscleGroup: "سینه", sets: defaultSets, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "کشش عمیق بخش بالایی سینه و کنترل دمبل‌ها.", groupType: "NORMAL" },
          { name: "قفسه بالا سینه سیم‌کش", muscleGroup: "سینه", sets: 3, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "انقباض حداکثری ۱ ثانیه‌ای در مرکز حرکت.", groupType: "NORMAL" },
          { name: "شنا سوئدی با تمرکز بر سینه", muscleGroup: "سینه", sets: 3, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "پایین رفتن با ریتم آهسته تا نزدیکی زمین.", groupType: "NORMAL" },
          { name: "جلو بازو هالتر ایستاده EZ", muscleGroup: "بازو", sets: 4, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "ثبات کامل آرنج‌ها کنار پهلو و انقباض بازو.", groupType: "NORMAL" },
          { name: "جلو بازو دمبل روی میز شیبدار", muscleGroup: "بازو", sets: 3, repetitions: "12", restTime: "45 ثانیه", weight: "", customDescription: "کشش کامل سر بلند دوسر بازویی در انتهای حرکت.", groupType: "NORMAL" },
          { name: "جلو بازو چکشی دمبل", muscleGroup: "بازو", sets: 3, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "تقویت عضله براکیالیس و ساعد.", groupType: "NORMAL" },
          { name: "کرانچ سیم‌کش زانو زده", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "15-20", restTime: "45 ثانیه", weight: "", customDescription: "انقباض قوی عضلات راست شکمی.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز دوم - عضلات پشت، زیربغل و فیله (Pull Focus)",
        exercises: [
          { name: "بارفیکس دست باز مچ برعکس", muscleGroup: "پشت", sets: defaultSets, repetitions: "8-10", restTime: "75 ثانیه", weight: "", customDescription: "عبور چانه از بالای میله و کشش کامل زیربغل.", groupType: "NORMAL" },
          { name: "زیربغل هالتر خم دست برعکس", muscleGroup: "پشت", sets: defaultSets, repetitions: "8-10", restTime: "75 ثانیه", weight: "", customDescription: "حفظ زاویه ۴۵ درجه ستون فقرات و انقباض کتف.", groupType: "NORMAL" },
          { name: "زیربغل سیم‌کش قایقی دست جمع", muscleGroup: "پشت", sets: 3, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "انقباض میانی کمر و مکث یک ثانیه‌ای.", groupType: "NORMAL" },
          { name: "زیربغل تک دمبل خم روی نیمکت", muscleGroup: "پشت", sets: 3, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "کشش عمیق زیربغل بدون چرخش تنه.", groupType: "NORMAL" },
          { name: "لت سیم‌کش از جلو دست متوسط", muscleGroup: "پشت", sets: 3, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "پایین کشیدن میله تا بالای سینه با انقباض لت.", groupType: "NORMAL" },
          { name: "فیله کمر روی نیمکت ۴۵ درجه", muscleGroup: "پشت", sets: 3, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "تقویت فیله‌ها با پرهیز از هایپراکستنشن مفرط.", groupType: "NORMAL" },
          { name: "پلانک ایزومتریک استاندارد", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "45 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "ثبات کامل شکم و حفظ خط صاف ستون فقرات.", groupType: "NORMAL" },
          { name: "ساعد هالتر نشسته", muscleGroup: "بازو", sets: 3, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "حرکت کامل مچ برای تقویت عضلات قدامی ساعد.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز سوم - عضلات پا، چهارسر و ساق (Leg Day)",
        exercises: [
          { name: "اسکوات هالتر از پشت استاندارد", muscleGroup: "پا", sets: defaultSets, repetitions: "8-10", restTime: "90 ثانیه", weight: "", customDescription: "پایین رفتن تا زاویه موازی با حفظ قوس طبیعی کمر.", groupType: "NORMAL" },
          { name: "پرس پا ۴۵ درجه دستگاه", muscleGroup: "پا", sets: defaultSets, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "فشار از پاشنه پا و پرهیز از قفل کردن زانوها.", groupType: "NORMAL" },
          { name: "هاگ اسکوات پا جمع", muscleGroup: "پا", sets: 3, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "تمرکز بر بخش خارجی چهارسر ران.", groupType: "NORMAL" },
          { name: "ددلیفت رومانیایی با دمبل", muscleGroup: "پا", sets: 4, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "کشش عمیق عضلات همسترینگ و باسن.", groupType: "NORMAL" },
          { name: "پشت پا دستگاه خوابیده", muscleGroup: "پا", sets: 3, repetitions: "12-15", restTime: "60 ثانیه", weight: "", customDescription: "انقباض ایزوله همسترینگ با مکث در اوج.", groupType: "NORMAL" },
          { name: "جلو پا دستگاه با مکث انقباضی", muscleGroup: "پا", sets: 3, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "مکث ۲ ثانیه‌ای در بالای حرکت.", groupType: "NORMAL" },
          { name: "ساق پا ایستاده با دستگاه", muscleGroup: "ساق پا", sets: 4, repetitions: "15-20", restTime: "45 ثانیه", weight: "", customDescription: "کشش و انقباض کامل پنجه پا.", groupType: "NORMAL" },
          { name: "ساق پا نشسته با وزنه", muscleGroup: "ساق پا", sets: 3, repetitions: "15-20", restTime: "45 ثانیه", weight: "", customDescription: "تمرکز بر عضله نعلی ساق.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز چهارم - عضلات سرشانه و پشت بازو",
        exercises: [
          { name: "پرس سرشانه هالتر نظامی ایستاده", muscleGroup: "سرشانه", sets: defaultSets, repetitions: "8-10", restTime: "75 ثانیه", weight: "", customDescription: "پرس عمودی بالای سر با ثبات کامل میان‌تنه.", groupType: "NORMAL" },
          { name: "نشر از جانب دمبل ایستاده", muscleGroup: "سرشانه", sets: 4, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "تقویت بخش میانی دلتوئید بدون پرتاب تنه.", groupType: "NORMAL" },
          { name: "پرس سرشانه آرنولدی با دمبل", muscleGroup: "سرشانه", sets: 3, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "چرخش مچ از جلو صورت تا پرس کامل بالا.", groupType: "NORMAL" },
          { name: "نشر خم دمبل روی میز شیبدار", muscleGroup: "سرشانه", sets: 3, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "درگیری ایزوله بخش خلفی دلتوئید.", groupType: "NORMAL" },
          { name: "پشت بازو هالتر خوابیده (اسکال کراشر)", muscleGroup: "بازو", sets: 4, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "پایین آوردن هالتر تا پیشانی با ثبات بازوها.", groupType: "NORMAL" },
          { name: "پشت بازو سیم‌کش با طناب", muscleGroup: "بازو", sets: 3, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "باز کردن انتهای طناب برای حداکثر انقباض.", groupType: "NORMAL" },
          { name: "دیپ پشت بازو بین دو نیمکت", muscleGroup: "بازو", sets: 3, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "خم کردن آرنج تا زاویه ۹۰ درجه و پرس به بالا.", groupType: "NORMAL" },
          { name: "زیرشکم خلبانی آویزان از میله", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "بالا کشیدن زانوها با انقباض بخش تحتانی شکم.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز پنجم - بالاتنه تکمیلی و بازوها",
        exercises: [
          { name: "پرس بالا سینه دمبل موازی", muscleGroup: "سینه", sets: 4, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "تمرکز بر اتصال عضلات بالا سینه و سرشانه.", groupType: "NORMAL" },
          { name: "پول‌اور دمبل روی نیمکت صاف", muscleGroup: "پشت", sets: 3, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "کشش عمیق قفسه سینه و عضلات دندانه‌ای.", groupType: "NORMAL" },
          { name: "فیس پول سیم‌کش با طناب", muscleGroup: "سرشانه", sets: 4, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "سلامت روتاتور کاف و تقویت سرشانه پشتی.", groupType: "NORMAL" },
          { name: "کول هالتر دست متوسط", muscleGroup: "سرشانه", sets: 3, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "بالا کشیدن هالتر تا خط سینه با هدایت آرنج.", groupType: "NORMAL" },
          { name: "جلو بازو لاری سیم‌کش", muscleGroup: "بازو", sets: 3, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "انقباض متمرکز در نقطه اوج حرکت.", groupType: "NORMAL" },
          { name: "پشت بازو دمبل پشت گردن تک دست", muscleGroup: "بازو", sets: 3, repetitions: "12", restTime: "45 ثانیه", weight: "", customDescription: "کشش کامل سر بلند پشت بازو.", groupType: "NORMAL" },
          { name: "کرانچ معکوس روی نیمکت شیبدار", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "چرخش لگن به سمت سینه.", groupType: "NORMAL" },
          { name: "چرخش روسی با وزنه", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "20", restTime: "45 ثانیه", weight: "", customDescription: "چرخش کنترل‌شده تنه برای عضلات مورب شکم.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز ششم - پایین‌تنه تکمیلی و زنجیره خلفی",
        exercises: [
          { name: "هیپ تراست هالتر روی نیمکت", muscleGroup: "پا", sets: 4, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "مکث ۲ ثانیه‌ای در اوج برای بیشترین انقباض باسن.", groupType: "NORMAL" },
          { name: "لانگز راه رفتنی با دمبل", muscleGroup: "پا", sets: 3, repetitions: "12 گام هر پا", restTime: "60 ثانیه", weight: "", customDescription: "حفظ تعادل و زاویه ۹۰ درجه هر دو زانو.", groupType: "NORMAL" },
          { name: "سومو اسکوات با دمبل سنگین", muscleGroup: "پا", sets: 3, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "پاها باز و تمرکز بر عضلات نزدیک‌کننده ران.", groupType: "NORMAL" },
          { name: "پشت پا تک پا ایستاده", muscleGroup: "پا", sets: 3, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "انقباض متقارن هر دو سمت همسترینگ.", groupType: "NORMAL" },
          { name: "ساق پا دانکی با وزن بدن", muscleGroup: "ساق پا", sets: 4, repetitions: "20", restTime: "45 ثانیه", weight: "", customDescription: "دامنه حرکتی کامل مچ پا.", groupType: "NORMAL" },
          { name: "مانتن کلمبر روی زمین", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "30 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "ریتم تند و ثابت برای چربی‌سوزی مرکزی.", groupType: "NORMAL" },
          { name: "وکیوم شکم ایزومتریک", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "20 ثانیه مکث", restTime: "45 ثانیه", weight: "", customDescription: "انقباض عمیق عضله عرضی شکم.", groupType: "NORMAL" },
          { name: "پل سرینی تک پا روی زمین", muscleGroup: "پا", sets: 3, repetitions: "15 هر پا", restTime: "45 ثانیه", weight: "", customDescription: "فشار از پاشنه و پایداری لگن.", groupType: "NORMAL" },
        ],
      },
    ]

    // 2. Home Workout 6 Distinct Days Split
    const homeWorkoutDayTemplates = [
      {
        label: "روز اول - سینه و بالاتنه فشاری خانگی (Push Focus)",
        exercises: [
          { name: "شنا سوئدی استاندارد روی زمین", muscleGroup: "سینه", sets: defaultSets, repetitions: "12-15", restTime: defaultRestTime, weight: "", customDescription: "تمرکز بر انقباض سینه با ریتم کنترل‌شده.", groupType: "NORMAL" },
          { name: "شنا دست جمع خانگی (Diamond Push-ups)", muscleGroup: "سینه", sets: 3, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "تمرکز بر بخش داخلی سینه و پشت بازو.", groupType: "NORMAL" },
          { name: "پرس سینه با کش مقاوتی ایستاده", muscleGroup: "سینه", sets: 4, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "کش پشت کمر و پرس مستقیم رو به جلو.", groupType: "NORMAL" },
          { name: "شنا پای بالا روی صندلی (Decline Push-ups)", muscleGroup: "سینه", sets: 3, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "تمرکز بر بالا سینه و سرشانه قدامی.", groupType: "NORMAL" },
          { name: "دیپ پشت بازو روی لبه صندلی", muscleGroup: "بازو", sets: 4, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "حفظ زاویه ۹۰ درجه آرنج‌ها.", groupType: "NORMAL" },
          { name: "پرس سرشانه با کش مقاوتی ایستاده", muscleGroup: "سرشانه", sets: 3, repetitions: "12-15", restTime: "60 ثانیه", weight: "", customDescription: "ایستادن روی مرکز کش و پرس بالای سر.", groupType: "NORMAL" },
          { name: "نشر جانب با دمبل خانگی یا کش", muscleGroup: "سرشانه", sets: 3, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "بالا بردن کنترل‌شده دست‌ها تا ارتفاع شانه.", groupType: "NORMAL" },
          { name: "پلانک ایزومتریک روی زمین", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "45 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "ثبات کامل عضلات میانی بدن.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز دوم - عضلات پشت و کششی خانگی (Pull Focus)",
        exercises: [
          { name: "بارفیکس خانگی یا زیربغل افقی زیر میز", muscleGroup: "پشت", sets: defaultSets, repetitions: "8-10", restTime: "75 ثانیه", weight: "", customDescription: "کشش عمیق زیربغل و جمع کردن تیغه‌های شانه.", groupType: "NORMAL" },
          { name: "زیربغل با کش پیلاتس ایستاده (Banded Row)", muscleGroup: "پشت", sets: 4, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "انقباض کامل کتف‌ها در انتهای حرکت.", groupType: "NORMAL" },
          { name: "جلو بازو با کش لوپ یا دمبل خانگی", muscleGroup: "بازو", sets: 4, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "ثبات کامل آرنج‌ها کنار پهلو.", groupType: "NORMAL" },
          { name: "جلو بازو چکشی با دمبل خانگی", muscleGroup: "بازو", sets: 3, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "تقویت بخش خارجی بازو و ساعد.", groupType: "NORMAL" },
          { name: "فیس پول با کش مقاوتی متصل به در", muscleGroup: "سرشانه", sets: 3, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "کشیدن کش به سمت چشم‌ها با آرنج بالا.", groupType: "NORMAL" },
          { name: "فیله کمر روی زمین سوپرمن", muscleGroup: "پشت", sets: 4, repetitions: "15 (مکث ۲ ثانیه)", restTime: "45 ثانیه", weight: "", customDescription: "بالا آوردن همزمان سینه و پاها از زمین.", groupType: "NORMAL" },
          { name: "کرانچ شکم روی مت", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "20", restTime: "45 ثانیه", weight: "", customDescription: "انقباض عضلات بالایی شکم.", groupType: "NORMAL" },
          { name: "پلانک پهلو ایزومتریک", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "30 ثانیه هر سمت", restTime: "30 ثانیه", weight: "", customDescription: "ثبات خط جانبی تنه.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز سوم - پایین‌تنه و سرینی در منزل (Legs & Glutes)",
        exercises: [
          { name: "اسکوات با وزن بدن و مکث در انتها", muscleGroup: "پا", sets: defaultSets, repetitions: "15-20", restTime: "60 ثانیه", weight: "", customDescription: "مکث ۲ ثانیه‌ای در عمق اسکوات.", groupType: "NORMAL" },
          { name: "لانگز درجا با دمبل خانگی", muscleGroup: "پا", sets: 4, repetitions: "12 هر پا", restTime: "60 ثانیه", weight: "", customDescription: "فرود نرم و انقباض عضلات چهارسر.", groupType: "NORMAL" },
          { name: "پل باسن روی زمین (Glute Bridge)", muscleGroup: "پا", sets: 4, repetitions: "15-20", restTime: "45 ثانیه", weight: "", customDescription: "انقباض قوی عضلات سرینی در نقطه اوج.", groupType: "NORMAL" },
          { name: "سومو اسکوات با کش مینی‌لوپ", muscleGroup: "پا", sets: 3, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "پاها باز برای تحریک بخش داخلی ران.", groupType: "NORMAL" },
          { name: "استپ آپ روی صندلی محکم", muscleGroup: "پا", sets: 3, repetitions: "12 هر پا", restTime: "60 ثانیه", weight: "", customDescription: "بالا رفتن با تمرکز روی پای جلو.", groupType: "NORMAL" },
          { name: "ساق پا ایستاده روی لبه پله", muscleGroup: "ساق پا", sets: 4, repetitions: "20", restTime: "45 ثانیه", weight: "", customDescription: "دامنه حرکتی کامل کشش و انقباض پنجه.", groupType: "NORMAL" },
          { name: "دوچرخه خوابیده شکم (Bicycle Crunches)", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "20 تکرار", restTime: "45 ثانیه", weight: "", customDescription: "نزدیک کردن آرنج به زانوی مخالف.", groupType: "NORMAL" },
          { name: "مانتن کلمبر روی زمین", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "30 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "حرکت متناوب پاها در حالت پلانک.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز چهارم - سرشانه، بازو و شکم خانگی",
        exercises: [
          { name: "شنا پایک روی زمین (Pike Push-ups)", muscleGroup: "سرشانه", sets: 4, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "فشار وزن بدن روی دلتوئید قدامی.", groupType: "NORMAL" },
          { name: "نشر از جلو با کش مقاوتی", muscleGroup: "سرشانه", sets: 3, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "بالا آوردن دست تا ارتفاع شانه.", groupType: "NORMAL" },
          { name: "پشت بازو کیک‌بک با دمبل خانگی", muscleGroup: "بازو", sets: 3, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "صاف کردن کامل دست در فاز منفی.", groupType: "NORMAL" },
          { name: "جلو بازو تمرکزی با دمبل خانگی", muscleGroup: "بازو", sets: 3, repetitions: "12", restTime: "45 ثانیه", weight: "", customDescription: "تکیه آرنج به ران پا و انقباض متمرکز.", groupType: "NORMAL" },
          { name: "دیپ پشت بازو روی زمین", muscleGroup: "بازو", sets: 3, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "انقباض سه سر بازویی با وزن بدن.", groupType: "NORMAL" },
          { name: "کرانچ معکوس پاها جمع", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "بالا آوردن لگن از روی زمین.", groupType: "NORMAL" },
          { name: "لمس پاشنه پا خوابیده (Heel Touches)", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "20 هر طرف", restTime: "30 ثانیه", weight: "", customDescription: "تقویت عضلات پهلو با انقباض متناوب.", groupType: "NORMAL" },
          { name: "برپی خانگی بدون پرش", muscleGroup: "سایر", sets: 3, repetitions: "10", restTime: "45 ثانیه", weight: "", customDescription: "انتقال پویا از ایستاده به شنا.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز پنجم - تمرین چربی‌سوزی و متابولیک خانگی (Full Body HIIT)",
        exercises: [
          { name: "جامپینگ جک پروانه‌ای", muscleGroup: "سایر", sets: 4, repetitions: "45 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "ریتم هماهنگ دست و پا برای ضربان قلب.", groupType: "NORMAL" },
          { name: "اسکوات پرشی (Jump Squats)", muscleGroup: "پا", sets: 4, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "پرش انفجاری و فرود کاملاً نرم روی پنجه.", groupType: "NORMAL" },
          { name: "شنا ضربه‌ای متناوب به شانه", muscleGroup: "سینه", sets: 4, repetitions: "16 لمس", restTime: "45 ثانیه", weight: "", customDescription: "حفظ ثبات بالاتنه بدون چرخش لگن.", groupType: "NORMAL" },
          { name: "دویدن درجا زانو بلند", muscleGroup: "سایر", sets: 4, repetitions: "30 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "بالا آوردن زانوها تا ارتفاع ناف.", groupType: "NORMAL" },
          { name: "پلانک به شنا (Commando Plank)", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "10 هر سمت", restTime: "45 ثانیه", weight: "", customDescription: "انتقال متوالی بین ساعد و کف دست.", groupType: "NORMAL" },
          { name: "اسکیتر جامپ جانبی (Skater Jumps)", muscleGroup: "پا", sets: 3, repetitions: "16 پرش", restTime: "30 ثانیه", weight: "", customDescription: "پرش‌های جانبی تعادلی برای سرینی و عضلات ثبات‌دهنده.", groupType: "NORMAL" },
          { name: "شنا قورباغه‌ای (Frog Jumps)", muscleGroup: "پا", sets: 3, repetitions: "12", restTime: "45 ثانیه", weight: "", customDescription: "توان انفجاری پایین‌تنه.", groupType: "NORMAL" },
          { name: "پلانک نگه داشتن نهایی", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "60 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "حداکثر استقامت عضلانی میان‌تنه.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز ششم - تحرک‌پذیری مفاصل و استقامت بدنی (Mobility & Flow)",
        exercises: [
          { name: "حرکت گربه گاو یوگا (Cat-Cow)", muscleGroup: "پشت", sets: 3, repetitions: "12 چرخه", restTime: "30 ثانیه", weight: "", customDescription: "افزایش انعطاف‌پذیری مهره‌های ستون فقرات.", groupType: "NORMAL" },
          { name: "لانگز با چرخش بالاتنه به طرفین", muscleGroup: "پا", sets: 3, repetitions: "10 هر پا", restTime: "45 ثانیه", weight: "", customDescription: "موبیلیتی مفصل ران و چرخش قفسه سینه.", groupType: "NORMAL" },
          { name: "پل سرینی تک پا روی زمین", muscleGroup: "پا", sets: 3, repetitions: "12 هر پا", restTime: "45 ثانیه", weight: "", customDescription: "اصلاح ناهماهنگی عضلات باسن و همسترینگ.", groupType: "NORMAL" },
          { name: "سگ با سر رو به پایین (Downward Dog)", muscleGroup: "پشت", sets: 3, repetitions: "45 ثانیه مکث", restTime: "30 ثانیه", weight: "", customDescription: "کشش عمیق پشت پا، همسترینگ و کتف.", groupType: "NORMAL" },
          { name: "کشش پروانه نشسته (Butterfly Stretch)", muscleGroup: "پا", sets: 3, repetitions: "45 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "باز کردن مفصل ران و کشش عضلات نزدیک‌کننده.", groupType: "NORMAL" },
          { name: "پلانک پرنده‌ای (Bird Dog)", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "12 هر سمت", restTime: "30 ثانیه", weight: "", customDescription: "هماهنگی دست و پای مخالف با کمر صاف.", groupType: "NORMAL" },
          { name: "کشش دست به مچ پا ایستاده", muscleGroup: "پا", sets: 3, repetitions: "30 ثانیه هر پا", restTime: "30 ثانیه", weight: "", customDescription: "کشش ملایم عضلات چهارسر ران.", groupType: "NORMAL" },
          { name: "تنفس عمیق دیافراگمی در حالت آرامش", muscleGroup: "سایر", sets: 3, repetitions: "1 دقیقه", restTime: "30 ثانیه", weight: "", customDescription: "کاهش سطح کورتیزول و ریکاوری سیستم عصبی.", groupType: "NORMAL" },
        ],
      },
    ]

    // 3. CrossFit 6 Distinct Days Split
    const crossFitDayTemplates = [
      {
        label: "روز اول - WOD ۱: توان انفجاری و المپیکی (Olympic MetCon)",
        exercises: [
          { name: "تراستر با هالتر (Barbell Thrusters)", muscleGroup: "پا", sets: 4, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "اسکوات عمیق و انباشت نیرو جهت پرس عمودی بالای سر.", groupType: "NORMAL" },
          { name: "پول‌آپ کیپینگ (Kipping Pull-ups)", muscleGroup: "پشت", sets: 4, repetitions: "12-15", restTime: "60 ثانیه", weight: "", customDescription: "ریتم مداوم لگن و عبور چانه از بالای میله.", groupType: "NORMAL" },
          { name: "کتل‌بل سوئینگ روسی (Kettlebell Swings)", muscleGroup: "پا", sets: 4, repetitions: "15-20", restTime: "60 ثانیه", weight: "", customDescription: "انفجار کامل عضلات سرینی و انتقال نیرو.", groupType: "NORMAL" },
          { name: "پرش روی باکس (Box Jumps)", muscleGroup: "پا", sets: 4, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "فرود نرم روی باسن با زوایای زانوی ایمن.", groupType: "NORMAL" },
          { name: "وال بال شات (Wall Ball Shots)", muscleGroup: "سینه", sets: 4, repetitions: "15", restTime: "60 ثانیه", weight: "", customDescription: "پرتاب توپ سنگین به تارگت ۳ متری در انتهای اسکوات.", groupType: "NORMAL" },
          { name: "توز تو بار (Toes to Bar)", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "12-15", restTime: "45 ثانیه", weight: "", customDescription: "تماس همزمان هر دو شست پا با میله بارفیکس.", groupType: "NORMAL" },
          { name: "بورپی روی جعبه (Burpee Box Jump Overs)", muscleGroup: "سایر", sets: 3, repetitions: "10", restTime: "60 ثانیه", weight: "", customDescription: "تماس کامل سینه با زمین و پرش از روی باکس.", groupType: "NORMAL" },
          { name: "طناب زدن دوبل (Double Unders)", muscleGroup: "ساق پا", sets: 4, repetitions: "40", restTime: "45 ثانیه", weight: "", customDescription: "چرخش سریع مچ دست و پریدن مداوم.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز دوم - WOD ۲: قدرت بیشینه و ژیمناستیک (Olympic & Gymnastic)",
        exercises: [
          { name: "پاور کلین و جرک (Power Clean & Jerk)", muscleGroup: "پشت", sets: 4, repetitions: "5-6", restTime: "90 ثانیه", weight: "", customDescription: "کشیدن سریع هالتر از روی زمین تا روی شانه و پرس.", groupType: "NORMAL" },
          { name: "شنا سوئدی روی دارحلقه (Ring Dips)", muscleGroup: "سینه", sets: 4, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "حفظ پایداری شانه روی حلقه‌های لرزان ژیمناستیک.", groupType: "NORMAL" },
          { name: "ددلیفت کراس‌فیت با هالتر سنگین", muscleGroup: "پا", sets: 4, repetitions: "6-8", restTime: "90 ثانیه", weight: "", customDescription: "قفل کامل باسن در بالای حرکت بدون قوس کمر.", groupType: "NORMAL" },
          { name: "شنا بالادست (Handstand Push-ups)", muscleGroup: "سرشانه", sets: 3, repetitions: "8-10", restTime: "75 ثانیه", weight: "", customDescription: "تماس سر با پد و کیپینگ پاها جهت بالابردن بدن.", groupType: "NORMAL" },
          { name: "اسکوات اورهد با هالتر (Overhead Squat)", muscleGroup: "پا", sets: 4, repetitions: "8", restTime: "90 ثانیه", weight: "", customDescription: "ثبات فوق‌العاده سرشانه‌ها با هالتر بالای سر.", groupType: "NORMAL" },
          { name: "زیربغل هالتر دست باز (Barbell Row)", muscleGroup: "پشت", sets: 3, repetitions: "10", restTime: "60 ثانیه", weight: "", customDescription: "تقویت بخش مرکزی پشت و فیله‌ها.", groupType: "NORMAL" },
          { name: "کرانچ شکم V-Up", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "15", restTime: "45 ثانیه", weight: "", customDescription: "تماس دست‌ها با مچ پا در بالای حرکت.", groupType: "NORMAL" },
          { name: "دوی سرعت ۵۰ متر یا روئینگ (Rowing)", muscleGroup: "سایر", sets: 4, repetitions: "200 متر", restTime: "45 ثانیه", weight: "", customDescription: "کشش پاتنه‌ای قوی در سیستم رویینگ.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز سوم - WOD ۳: چیپر و ظرفیت قلبی عروقی (Cardio Chipper)",
        exercises: [
          { name: "روئینگ سرعتی ۵۰۰ متر (Row Ergometer)", muscleGroup: "سایر", sets: 3, repetitions: "۵۰۰ متر", restTime: "60 ثانیه", weight: "", customDescription: "حفظ آهنگ ضربان قایقرانی و ضربات قدرتمند پا.", groupType: "NORMAL" },
          { name: "اسنچ دمبل تک‌دست تناوبی", muscleGroup: "سرشانه", sets: 4, repetitions: "16 جفت", restTime: "60 ثانیه", weight: "", customDescription: "پرتاب دمبل از زمین تا بالای سر در یک حرکت پیوسته.", groupType: "NORMAL" },
          { name: "پوش پرس هالتر کراس‌فیت (Push Press)", muscleGroup: "سرشانه", sets: 4, repetitions: "8-10", restTime: "75 ثانیه", weight: "", customDescription: "بهره‌گیری از شیب زانو برای شلیک وزنه به بالا.", groupType: "NORMAL" },
          { name: "بارفیکس پروانه‌ای (Butterfly Pull-ups)", muscleGroup: "پشت", sets: 4, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "حرکت دایره‌ای ریتمیک چانه دور میله بارفیکس.", groupType: "NORMAL" },
          { name: "اسکوات تپانچه‌ای تناوبی (Pistol Squats)", muscleGroup: "پا", sets: 3, repetitions: "8 هر پا", restTime: "60 ثانیه", weight: "", customDescription: "اسکوات کامل تک پا با پای دیگر کشیده به جلو.", groupType: "NORMAL" },
          { name: "بالا کشیدن زانوها به آرنج (Knees to Elbows)", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "12", restTime: "45 ثانیه", weight: "", customDescription: "تماس مستقیم زانوها با آرنج‌ها در حالت آویزان.", groupType: "NORMAL" },
          { name: "طناب زدن کراس‌فیت سرعتی", muscleGroup: "ساق پا", sets: 4, repetitions: "60 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "حفظ ریتم بدون توقف مچ دست.", groupType: "NORMAL" },
          { name: "لانگز با وزنه بالای سر (Overhead Walking Lunges)", muscleGroup: "پا", sets: 3, repetitions: "16 گام", restTime: "60 ثانیه", weight: "", customDescription: "ثبات سرشانه با دیسک بالای سر هنگام گام‌برداری.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز چهارم - WOD ۴: استقامت عضلانی پرفشار (High Reps MetCon)",
        exercises: [
          { name: "فرانت اسکوات با هالتر از جلو", muscleGroup: "پا", sets: 4, repetitions: "8-10", restTime: "75 ثانیه", weight: "", customDescription: "آرنج‌ها کاملاً بالا و سینه فراخ برای ایمنی ستون فقرات.", groupType: "NORMAL" },
          { name: "چست تو بار (Chest to Bar Pull-ups)", muscleGroup: "پشت", sets: 4, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "تماس فیزیکی استخوان جناغ با میله بارفیکس.", groupType: "NORMAL" },
          { name: "کتل‌بل کلین و پرس دوطرفه", muscleGroup: "سرشانه", sets: 3, repetitions: "10", restTime: "60 ثانیه", weight: "", customDescription: "مهارت پرتاب کتل‌بل روی سینه و پرس محکم.", groupType: "NORMAL" },
          { name: "بورپی بارجامپ اور (Burpee Bar Facing)", muscleGroup: "سایر", sets: 4, repetitions: "12", restTime: "45 ثانیه", weight: "", customDescription: "سینه روی زمین رو به هالتر و پرش جفت پا از روی آن.", groupType: "NORMAL" },
          { name: "ددلیفت سومو با پول‌آپ عمودی (SDHP)", muscleGroup: "پشت", sets: 3, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "انفجار لگن و کشیدن همزمان کتل‌بل تا چانه.", groupType: "NORMAL" },
          { name: "پرش طولی جفت پا (Broad Jumps)", muscleGroup: "پا", sets: 3, repetitions: "8", restTime: "45 ثانیه", weight: "", customDescription: "انفجار طولی به سمت جلو با فرود جذب‌کننده ضربه.", groupType: "NORMAL" },
          { name: "هالو بادی هولد ژیمناستیک (Hollow Body)", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "40 ثانیه", restTime: "40 ثانیه", weight: "", customDescription: "فشردن کمر به زمین با دست و پاهای کشیده.", groupType: "NORMAL" },
          { name: "حمل بار سنگین دهقانی (Farmer's Walk)", muscleGroup: "سایر", sets: 4, repetitions: "40 متر", restTime: "60 ثانیه", weight: "", customDescription: "گرفتن دمبل‌های سنگین و راه رفتن با سینه صاف.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز پنجم - WOD ۵: تمرینات استرانگ‌من و قدرت عملکردی",
        exercises: [
          { name: "اسنچ هالتر کامل المپیکی (Full Snatch)", muscleGroup: "پشت", sets: 4, repetitions: "4-5", restTime: "90 ثانیه", weight: "", customDescription: "کشیدن سرعتی هالتر از زمین تا نشستن عمیق زیر وزنه.", groupType: "NORMAL" },
          { name: "حمل کیسه شن یا توپ سنگین (Sandbag Carry)", muscleGroup: "سایر", sets: 4, repetitions: "50 متر", restTime: "60 ثانیه", weight: "", customDescription: "بغل کردن محکم کیسه و گام‌های کوتاه پیوسته.", groupType: "NORMAL" },
          { name: "تایر فلیپ یا ددلیفت تله‌بار", muscleGroup: "پا", sets: 4, repetitions: "8", restTime: "75 ثانیه", weight: "", customDescription: "قدرت تمام عضلات پشتی و پایینی بدن.", groupType: "NORMAL" },
          { name: "ماسل آپ روی دارحلقه (Ring Muscle-up)", muscleGroup: "پشت", sets: 3, repetitions: "4-6", restTime: "90 ثانیه", weight: "", customDescription: "انتقال برق‌آسا از کشش بارفیکس به دیپ بالای حلقه.", groupType: "NORMAL" },
          { name: "کتل‌بل ویند میل (Kettlebell Windmill)", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "8 هر سمت", restTime: "45 ثانیه", weight: "", customDescription: "انعطاف و ثبات شانه با لمس زمین توسط دست مخالف.", groupType: "NORMAL" },
          { name: "اسکوات جامی سنگین (Goblet Squat)", muscleGroup: "پا", sets: 3, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "نگه‌داشتن کتل‌بل جلوی سینه و عمق استاندارد لگن.", groupType: "NORMAL" },
          { name: "شنا سوئدی با دست زدن در هوا (Clapping Push-ups)", muscleGroup: "سینه", sets: 3, repetitions: "8-10", restTime: "60 ثانیه", weight: "", customDescription: "توان پرتابی بالاتنه جهت جدا شدن از زمین.", groupType: "NORMAL" },
          { name: "دو ۵۰ متر رفت و برگشت شاتل ران", muscleGroup: "سایر", sets: 4, repetitions: "۴ دور", restTime: "45 ثانیه", weight: "", customDescription: "شتاب‌گیری انفجاری و تغییر جهت ناگهانی.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز ششم - WOD ۶: استقامت همه‌جانبه مسابقه‌ای (Hero WOD)",
        exercises: [
          { name: "مورف مسابقه‌ای: ۱ کیلومتر دو استقامتی", muscleGroup: "سایر", sets: 1, repetitions: "1000 متر", restTime: "90 ثانیه", weight: "", customDescription: "تنظیم ریتم تنفس و سرعت پایدار در تمام مسیر.", groupType: "NORMAL" },
          { name: "۱۰۰ تکرار بارفیکس با فرم استاندارد", muscleGroup: "پشت", sets: 5, repetitions: "20 تکرار", restTime: "60 ثانیه", weight: "", customDescription: "تقسیم ست‌ها جهت جلوگیری از خستگی زودهنگام دست.", groupType: "NORMAL" },
          { name: "۲۰۰ تکرار شنا سوئدی قفسه سینه به زمین", muscleGroup: "سینه", sets: 5, repetitions: "40 تکرار", restTime: "60 ثانیه", weight: "", customDescription: "قفل کامل آرنج‌ها در بالا و لمس سینه با زمین.", groupType: "NORMAL" },
          { name: "۳۰۰ تکرار اسکوات با وزن بدن (Air Squats)", muscleGroup: "پا", sets: 6, repetitions: "50 تکرار", restTime: "60 ثانیه", weight: "", customDescription: "عمق استاندارد با حفظ قامت راست تنه.", groupType: "NORMAL" },
          { name: "پایان: ۱ کیلومتر دوی نهایی", muscleGroup: "سایر", sets: 1, repetitions: "1000 متر", restTime: "120 ثانیه", weight: "", customDescription: "تخلیه کامل توان هوازی و قلبی عروقی.", groupType: "NORMAL" },
          { name: "موبیلیتی عضلات چهارسر و باسن پس از تمرین", muscleGroup: "پا", sets: 3, repetitions: "60 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "کشش عمیق برای دفع اسید لاکتیک.", groupType: "NORMAL" },
          { name: "کشش عضلات لت و قفسه سینه روی میله", muscleGroup: "پشت", sets: 3, repetitions: "45 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "باز کردن مفصل سرشانه و پیشگیری از کوفتگی.", groupType: "NORMAL" },
          { name: "تنفس ریکاوری و ریلکسیشن سیستم عصبی", muscleGroup: "سایر", sets: 1, repetitions: "3 دقیقه", restTime: "0 ثانیه", weight: "", customDescription: "بازگرداندن ضربان قلب به شرایط نرمال پایدار.", groupType: "NORMAL" },
        ],
      },
    ]

    // 4. Calisthenics 6 Distinct Days Split
    const calisthenicsDayTemplates = [
      {
        label: "روز اول - کالیستنیکس کششی (Pull Day)",
        exercises: [
          { name: "بارفیکس دست باز استاندارد (Wide Pull-ups)", muscleGroup: "پشت", sets: 4, repetitions: "8-10", restTime: "90 ثانیه", weight: "", customDescription: "عبور کامل چانه و کشش عمیق لاتیسیموس.", groupType: "NORMAL" },
          { name: "بارفیکس دست جمع مچ برعکس (Chin-ups)", muscleGroup: "بازو", sets: 4, repetitions: "8-10", restTime: "75 ثانیه", weight: "", customDescription: "درگیری حداکثری عضلات دوسر بازویی.", groupType: "NORMAL" },
          { name: "پیشرفت اهرم جلو (Front Lever Tucked)", muscleGroup: "پشت", sets: 4, repetitions: "15 ثانیه مکث", restTime: "60 ثانیه", weight: "", customDescription: "ثبات صاف تنه موازی با زمین روی میله.", groupType: "NORMAL" },
          { name: "بارفیکس استرالیایی زیر میله افقی", muscleGroup: "پشت", sets: 3, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "انقباض تیغه‌های شانه و تقویت بخش میانی پشت.", groupType: "NORMAL" },
          { name: "بارفیکس تایپ‌رایتر افقی (Typewriter Pull-ups)", muscleGroup: "پشت", sets: 3, repetitions: "6 هر طرف", restTime: "75 ثانیه", weight: "", customDescription: "حرکت افقی چانه روی میله از چپ به راست.", groupType: "NORMAL" },
          { name: "آویزان ماندن تک‌دست روی میله بارفیکس", muscleGroup: "بازو", sets: 3, repetitions: "20 ثانیه هر دست", restTime: "45 ثانیه", weight: "", customDescription: "افزایش فوق‌العاده قدرت مچ و پنجه دست.", groupType: "NORMAL" },
          { name: "کرانچ شکم روی میله بارفیکس", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "12", restTime: "45 ثانیه", weight: "", customDescription: "بالا آوردن زانوها تا ارتفاع سینه با آرنج صاف.", groupType: "NORMAL" },
          { name: "کشش عمیق لت با تکیه به ستون", muscleGroup: "پشت", sets: 3, repetitions: "30 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "رهاسازی فاسیا و انعطاف عضلات زیربغل.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز دوم - کالیستنیکس فشاری (Push Day)",
        exercises: [
          { name: "پارالل با وزن بدن (Parallel Bar Dips)", muscleGroup: "سینه", sets: 4, repetitions: "10-12", restTime: "75 ثانیه", weight: "", customDescription: "پایین رفتن تا زاویه ۹۰ درجه آرنج و انقباض سینه.", groupType: "NORMAL" },
          { name: "شنا سوئدی دست جمع (Diamond Push-ups)", muscleGroup: "بازو", sets: 4, repetitions: "12-15", restTime: "60 ثانیه", weight: "", customDescription: "تمرکز بر اوج انقباض عضلات سه‌سر بازویی.", groupType: "NORMAL" },
          { name: "شنا بالادست متمایل به دیوار (Pike Push-ups)", muscleGroup: "سرشانه", sets: 3, repetitions: "10", restTime: "60 ثانیه", weight: "", customDescription: "فشار مستقیم وزن بدن روی بخش قدامی دلتوئید.", groupType: "NORMAL" },
          { name: "پیشرفت پلانچ روی پارالل (Tuck Planche)", muscleGroup: "سرشانه", sets: 4, repetitions: "15 ثانیه", restTime: "60 ثانیه", weight: "", customDescription: "قفل آرنج‌ها و شیب شانه به جلو برای تحمل وزن.", groupType: "NORMAL" },
          { name: "شنا پای بالا روی استپ (Decline Push-ups)", muscleGroup: "سینه", sets: 3, repetitions: "12", restTime: "60 ثانیه", weight: "", customDescription: "فشار متمرکز روی بالا سینه.", groupType: "NORMAL" },
          { name: "دیپ پشت بازو روی تک‌میله (Straight Bar Dip)", muscleGroup: "بازو", sets: 3, repetitions: "8-10", restTime: "60 ثانیه", weight: "", customDescription: "پایین رفتن با عبور میله از زیر جناغ سینه.", groupType: "NORMAL" },
          { name: "شنا اسکورپیون چرخشی", muscleGroup: "سینه", sets: 3, repetitions: "10", restTime: "45 ثانیه", weight: "", customDescription: "کشش داینامیک قفسه سینه همراه با چرخش پا.", groupType: "NORMAL" },
          { name: "پلانک هالو بادی با بازوهای کشیده", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "45 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "انقباض شدید دیواره شکم.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز سوم - پایین‌تنه با وزن بدن (Legs Calisthenics)",
        exercises: [
          { name: "پیستول اسکوات تک‌پا (Pistol Squats)", muscleGroup: "پا", sets: 4, repetitions: "8 هر پا", restTime: "75 ثانیه", weight: "", customDescription: "اسکوات کامل روی یک پا با تعادل و کنترل عضلانی.", groupType: "NORMAL" },
          { name: "نوردیک کرم همسترینگ با وزن بدن", muscleGroup: "پا", sets: 4, repetitions: "6-8", restTime: "75 ثانیه", weight: "", customDescription: "کنترل فوق‌العاده فاز منفی فرود تنه به جلو.", groupType: "NORMAL" },
          { name: "اسکوات پرشی انفجاری (Jump Squats)", muscleGroup: "پا", sets: 4, repetitions: "15", restTime: "60 ثانیه", weight: "", customDescription: "پرش به سمت سقف با انباشت نیروی کشسانی.", groupType: "NORMAL" },
          { name: "لانگز پرشی متناوب (Jumping Lunges)", muscleGroup: "پا", sets: 3, repetitions: "16 گام", restTime: "60 ثانیه", weight: "", customDescription: "تغییر پای هوایی در نقطه اوج پرش.", groupType: "NORMAL" },
          { name: "پل سرینی تک پا با مکث", muscleGroup: "پا", sets: 3, repetitions: "15 هر پا", restTime: "45 ثانیه", weight: "", customDescription: "انقباض ایزوله عضلات سرینی باسن.", groupType: "NORMAL" },
          { name: "اسکوات اسیسی با وزن بدن (Sissy Squats)", muscleGroup: "پا", sets: 3, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "کشش عمیق تاندون چهارسر ران با خم شدن به عقب.", groupType: "NORMAL" },
          { name: "ساق پا تک پا روی لبه پله", muscleGroup: "ساق پا", sets: 4, repetitions: "15 هر پا", restTime: "45 ثانیه", weight: "", customDescription: "دامنه حرکتی کامل مچ پا برای هایپرتروفی ساق.", groupType: "NORMAL" },
          { name: "وال سیت ایزومتریک با زانوی ۹۰ درجه", muscleGroup: "پا", sets: 3, repetitions: "45 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "استقامت عضلانی ایزومتریک ران‌ها رو به دیوار.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز چهارم - مهارت‌های هنداستند و سرشانه",
        exercises: [
          { name: "ایستادن روی دست کنار دیوار (Handstand Hold)", muscleGroup: "سرشانه", sets: 4, repetitions: "30-45 ثانیه", restTime: "60 ثانیه", weight: "", customDescription: "قفل شانه و مچ دست‌ها با فشار فعال به زمین.", groupType: "NORMAL" },
          { name: "شنا بالادست منفی کنار دیوار (Handstand Eccentric)", muscleGroup: "سرشانه", sets: 4, repetitions: "6-8", restTime: "75 ثانیه", weight: "", customDescription: "فرود ۳ ثانیه‌ای بسیار آهسته تا لمس ملایم سر.", groupType: "NORMAL" },
          { name: "شنا شیب‌دار به جلو (Pseudo Planche Push-ups)", muscleGroup: "سرشانه", sets: 3, repetitions: "10", restTime: "60 ثانیه", weight: "", customDescription: "دست‌ها عقب‌تر از شانه روی زمین برای درگیری دلتوئید.", groupType: "NORMAL" },
          { name: "دیپ ژیمناستیک روی دارحلقه یا پارالل", muscleGroup: "سینه", sets: 3, repetitions: "10", restTime: "60 ثانیه", weight: "", customDescription: "کنترل لرزش بدن در دامنه عمیق حرکتی.", groupType: "NORMAL" },
          { name: "راه رفتن با دست‌ها کنار دیوار (Wall Walks)", muscleGroup: "سرشانه", sets: 3, repetitions: "5 دور", restTime: "60 ثانیه", weight: "", customDescription: "گام برداشتن پاها به بالای دیوار تا نزدیکی سینه.", groupType: "NORMAL" },
          { name: "فیس پول کالیستنیکس با وزن بدن زیر میله", muscleGroup: "سرشانه", sets: 3, repetitions: "12", restTime: "45 ثانیه", weight: "", customDescription: "هدایت آرنج‌ها به پشت سر و تقویت روتاتور کاف.", groupType: "NORMAL" },
          { name: "چرخش مچ دست و تقویت تاندون‌های ساعد", muscleGroup: "بازو", sets: 3, repetitions: "15 چرخه", restTime: "30 ثانیه", weight: "", customDescription: "آماده‌سازی مچ برای فشارهای سنگین هنداستند.", groupType: "NORMAL" },
          { name: "پلانک ستاره‌ای با دست‌ها و پاهای باز", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "30 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "چالش سنگین مرکز ثقل بدن.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز پنجم - عضلات مرکزی و ثبات (Core Mastery)",
        exercises: [
          { name: "دراگون فلاگ بروس لی (Dragon Flag)", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "6-8", restTime: "75 ثانیه", weight: "", customDescription: "نگه داشتن تمام خط تنه در هوا بدون شکستن لگن.", groupType: "NORMAL" },
          { name: "نگه‌داشتن L-Sit رو پارالل یا زمین", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "20-30 ثانیه", restTime: "60 ثانیه", weight: "", customDescription: "پاها کاملاً موازی با افق با انقباض شکم و چهارسر.", groupType: "NORMAL" },
          { name: "بالا آوردن پاها به میله بارفیکس (Toes to Bar)", muscleGroup: "شکم و پهلو", sets: 4, repetitions: "10-12", restTime: "60 ثانیه", weight: "", customDescription: "لمس میله بدون نوسان و با کنترل کامل فاز منفی.", groupType: "NORMAL" },
          { name: "برف‌پاک‌کن شکم روی میله بارفیکس (Windshield Wipers)", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "10 جفت", restTime: "60 ثانیه", weight: "", customDescription: "چرخش پاهای کشیده به طرفین در حالت آویزان.", groupType: "NORMAL" },
          { name: "هالو بادی راک متناوب (Hollow Rocks)", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "20 نوسان", restTime: "45 ثانیه", weight: "", customDescription: "نوسان گهوارهای بدن روی گودی کمر.", groupType: "NORMAL" },
          { name: "پلانک سوپرمن دست‌ها جلو روی پنجه", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "30 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "افزایش فوق‌العاده اهرم فشار به عضلات عمقی شکم.", groupType: "NORMAL" },
          { name: "پل معکوس ژیمناستیک (Back Bridge)", muscleGroup: "پشت", sets: 3, repetitions: "30 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "قوس کامل ستون فقرات و کشش قفسه سینه.", groupType: "NORMAL" },
          { name: "وکیوم شکم نشسته با مکث تنفسی", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "20 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "تقویت دیواره عرضی شکم و باریک شدن دور کمر.", groupType: "NORMAL" },
        ],
      },
      {
        label: "روز ششم - مدار استقامتی و فلوی کالیستنیکس",
        exercises: [
          { name: "ماسلی آپ روی میله بارفیکس (Muscle-ups)", muscleGroup: "پشت", sets: 4, repetitions: "4-6", restTime: "90 ثانیه", weight: "", customDescription: "انفجار ترکیبی پول‌آپ و دیپ در یک حرکت یکپارچه.", groupType: "NORMAL" },
          { name: "سوپرست: بارفیکس دست باز + پارالل", muscleGroup: "پشت", sets: 4, repetitions: "8 + 10", restTime: "60 ثانیه", weight: "", customDescription: "انجام متوالی بدون استراحت برای خستگی عملکردی.", groupType: "SUPERSET", pairedMuscleGroup: "سینه", pairedExerciseName: "پارالل با وزن بدن" },
          { name: "سوپرست: شنا سوئدی + بارفیکس استرالیایی", muscleGroup: "سینه", sets: 3, repetitions: "15 + 12", restTime: "60 ثانیه", weight: "", customDescription: "تعادل فشاری و کششی بالاتنه در زاویه افقی.", groupType: "SUPERSET", pairedMuscleGroup: "پشت", pairedExerciseName: "بارفیکس استرالیایی" },
          { name: "اسکوات پرشی + پرش لانگز متناوب", muscleGroup: "پا", sets: 3, repetitions: "12 + 12", restTime: "60 ثانیه", weight: "", customDescription: "خستگی عضلانی پایین‌تنه با توان انفجاری پیوسته.", groupType: "NORMAL" },
          { name: "برپی با پرش روی بارفیکس و پول‌آپ", muscleGroup: "سایر", sets: 3, repetitions: "8 تکرار", restTime: "60 ثانیه", weight: "", customDescription: "ترکیب کامل شنا، پرش و بارفیکس در یک تکرار.", groupType: "NORMAL" },
          { name: "نگه داشتن L-Sit روی میله آویزان", muscleGroup: "شکم و پهلو", sets: 3, repetitions: "15 ثانیه", restTime: "45 ثانیه", weight: "", customDescription: "زاویه ۹۰ درجه پاها با میله بارفیکس.", groupType: "NORMAL" },
          { name: "کشش عمیق گربه و کبرا برای ستون مهره‌ها", muscleGroup: "پشت", sets: 3, repetitions: "45 ثانیه", restTime: "30 ثانیه", weight: "", customDescription: "کاهش بار از روی تاندون‌ها و رهاسازی عضلانی.", groupType: "NORMAL" },
          { name: "تنفس شکمی آرام‌بخش پایان جلسه", muscleGroup: "سایر", sets: 1, repetitions: "2 دقیقه", restTime: "0 ثانیه", weight: "", customDescription: "بازتوانی کامل و تنظیم ضربان قلب.", groupType: "NORMAL" },
        ],
      },
    ]

    // Select appropriate template set
    const selectedTemplates = trainingStyle === "HOME_WORKOUT"
      ? homeWorkoutDayTemplates
      : trainingStyle === "CROSSFIT"
      ? crossFitDayTemplates
      : trainingStyle === "CALISTHENICS"
      ? calisthenicsDayTemplates
      : bodyBuildingDayTemplates

    const fallbackSummary = {
      title: trainingStyle === "HOME_WORKOUT"
        ? `برنامه تخصصی تمرین در منزل (${targetDaysCount} روز در هفته)`
        : trainingStyle === "CROSSFIT"
        ? `برنامه تخصصی کراس‌فیت و آمادگی همه‌جانبه (${targetDaysCount} روز در هفته)`
        : trainingStyle === "CALISTHENICS"
        ? `برنامه تخصصی کالیستنیکس و وزن بدن (${targetDaysCount} روز در هفته)`
        : trainingStyle === "SPORT_SPECIFIC"
        ? `برنامه تخصصی مکمل ${primarySport} (${targetDaysCount} روز در هفته)`
        : `برنامه تخصصی بدنسازی و هیپرتروفی (${targetDaysCount} روز در هفته)`,
      description: `برنامه علمی تفکیک‌شده (${targetDaysCount} روز مجزا بدون تکرار حرکات) جهت ارتقای آمادگی جسمانی در سبک ${trainingStyle}.`,
      primarySport,
      targetMuscleGroups: ["سینه", "پشت", "سرشانه", "پا", "شکم و پهلو"],
      coachNotes: `گرم کردن پویای مفاصل پیش از تمرین، رعایت فرم استاندارد حرکات و تمرکز بر ریتم تنفس در تمام روزها.`,
    }

    // Assemble target days with 100% unique exercises across days
    const fallbackDays = []
    for (let i = 0; i < targetDaysCount; i++) {
      const template = selectedTemplates[i] || selectedTemplates[i % selectedTemplates.length]
      fallbackDays.push({
        day: dayNameKeys[i % dayNameKeys.length],
        label: template.label,
        exercises: template.exercises,
      })
    }

    // Deduplicate cross-day just to be 100% resilient
    const validatedFallback = validateAndNormalizeRoutine({
      routineSummary: fallbackSummary,
      workoutDays: fallbackDays,
    }, targetDaysCount)

    return NextResponse.json({
      routineSummary: validatedFallback?.routineSummary || fallbackSummary,
      workoutDays: validatedFallback?.workoutDays || fallbackDays,
      isSimulated: true,
      aiModel: "NutriTrain Specialized Multi-Day Split Engine",
      provider: "Offline Intelligent Engine",
      elapsedMs: Date.now() - startTime,
    })
  } catch (error: any) {
    console.error("AI Routine Generation error:", error)
    return NextResponse.json({ error: "خطا در تولید برنامه تمرینی با هوش مصنوعی." }, { status: 500 })
  }
}
