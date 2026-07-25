export interface FoodItem {
  id?: string
  name: string
  category: string
  unitLabel: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

export const DEFAULT_FOODS: FoodItem[] = [
  // 🔴 پروتئینی (Proteins)
  { id: "p1", name: "سینه مرغ پخته (گریل/آب‌پز)", category: "پروتئینی", unitLabel: "100 گرم", calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { id: "p2", name: "ران مرغ پخته (بدون پوست)", category: "پروتئینی", unitLabel: "100 گرم", calories: 209, protein: 26, carbs: 0, fats: 10.9 },
  { id: "p3", name: "فیله گوساله پخته شده", category: "پروتئینی", unitLabel: "100 گرم", calories: 215, protein: 26, carbs: 0, fats: 11 },
  { id: "p4", name: "گوشت چرخ‌کرده کم‌چرب گوساله", category: "پروتئینی", unitLabel: "100 گرم", calories: 240, protein: 22, carbs: 0, fats: 16 },
  { id: "p5", name: "بوقلمون پخته شده", category: "پروتئینی", unitLabel: "100 گرم", calories: 170, protein: 24, carbs: 0, fats: 8 },
  { id: "p6", name: "ماهی قزل‌آلا گریل", category: "پروتئینی", unitLabel: "100 گرم", calories: 190, protein: 20, carbs: 0, fats: 12 },
  { id: "p7", name: "ماهی سالمون گریل", category: "پروتئینی", unitLabel: "100 گرم", calories: 206, protein: 22, carbs: 0, fats: 13 },
  { id: "p8", name: "میگو پخته / گریل", category: "پروتئینی", unitLabel: "100 گرم", calories: 99, protein: 24, carbs: 0.2, fats: 0.3 },
  { id: "p9", name: "تن ماهی در روغن (آبکش شده)", category: "پروتئینی", unitLabel: "100 گرم", calories: 198, protein: 29, carbs: 0, fats: 8 },
  { id: "p10", name: "تخم‌مرغ کامل (آب‌پز)", category: "پروتئینی", unitLabel: "1 عدد (50 گرم)", calories: 78, protein: 6.3, carbs: 0.6, fats: 5.3 },
  { id: "p11", name: "سفیده تخم‌مرغ (آب‌پز)", category: "پروتئینی", unitLabel: "1 عدد (33 گرم)", calories: 17, protein: 3.6, carbs: 0.2, fats: 0.1 },
  { id: "p12", name: "جگر گوسفندی گریل", category: "پروتئینی", unitLabel: "100 گرم", calories: 139, protein: 20, carbs: 3.8, fats: 4.7 },

  // 🟢 غذاهای سنتی و محلی ایرانی (Traditional Meals & Stews)
  { id: "t1", name: "چلو کباب کوبیده (با برنج)", category: "غذاهای سنتی ایرانی", unitLabel: "1 بشقاب (1 سیخ + 150g برنج)", calories: 520, protein: 26, carbs: 45, fats: 26 },
  { id: "t2", name: "جوجه کباب گریل (سینه)", category: "غذاهای سنتی ایرانی", unitLabel: "1 سیخ (150 گرم)", calories: 290, protein: 38, carbs: 2, fats: 14 },
  { id: "t3", name: "خورشت قورمه سبزی با برنج", category: "غذاهای سنتی ایرانی", unitLabel: "1 بشقاب استاندارد", calories: 480, protein: 22, carbs: 50, fats: 20 },
  { id: "t4", name: "خورشت قیمه سیب‌زمینی با برنج", category: "غذاهای سنتی ایرانی", unitLabel: "1 بشقاب استاندارد", calories: 460, protein: 20, carbs: 52, fats: 18 },
  { id: "t5", name: "خورشت فسنجان با مرغ و برنج", category: "غذاهای سنتی ایرانی", unitLabel: "1 بشقاب استاندارد", calories: 580, protein: 18, carbs: 48, fats: 34 },
  { id: "t6", name: "زرشک پلو با مرغ (سینه)", category: "غذاهای سنتی ایرانی", unitLabel: "1 بشقاب استاندارد", calories: 490, protein: 32, carbs: 55, fats: 14 },
  { id: "t7", name: "عدس پلو با گوشت چرخ‌کرده", category: "غذاهای سنتی ایرانی", unitLabel: "1 بشقاب (200 گرم)", calories: 380, protein: 18, carbs: 54, fats: 10 },
  { id: "t8", name: "لوبیا پلو با گوشت تکه‌ای", category: "غذاهای سنتی ایرانی", unitLabel: "1 بشقاب (200 گرم)", calories: 360, protein: 16, carbs: 50, fats: 10 },
  { id: "t9", name: "آبگوشت / دیزی (با نان سنگک)", category: "غذاهای سنتی ایرانی", unitLabel: "1 کاسه کامل", calories: 550, protein: 30, carbs: 45, fats: 26 },
  { id: "t10", name: "میرزا قاسمی (با تخم‌مرغ)", category: "غذاهای سنتی ایرانی", unitLabel: "100 گرم", calories: 130, protein: 4, carbs: 8, fats: 9 },
  { id: "t11", name: "کشک بادنجان کم‌چرب", category: "غذاهای سنتی ایرانی", unitLabel: "100 گرم", calories: 180, protein: 6, carbs: 10, fats: 13 },
  { id: "t12", name: "آش رشته سنتی", category: "غذاهای سنتی ایرانی", unitLabel: "1 کاسه (250 گرم)", calories: 320, protein: 12, carbs: 48, fats: 9 },
  { id: "t13", name: "حلیم گندم و گوشت بوقلمون/گوسفند", category: "غذاهای سنتی ایرانی", unitLabel: "1 کاسه (200 گرم)", calories: 280, protein: 14, carbs: 38, fats: 8 },
  { id: "t14", name: "کوکو سبزی کم‌روغن", category: "غذاهای سنتی ایرانی", unitLabel: "100 گرم", calories: 190, protein: 7, carbs: 10, fats: 14 },
  { id: "t15", name: "کوکو سیب‌زمینی", category: "غذاهای سنتی ایرانی", unitLabel: "100 گرم", calories: 210, protein: 5, carbs: 24, fats: 11 },
  { id: "t16", name: "کتلت گوشت خانگی", category: "غذاهای سنتی ایرانی", unitLabel: "1 عدد (50 گرم)", calories: 135, protein: 8, carbs: 7, fats: 8 },

  // 🟡 کربوهیدرات‌ها و غلات (Carbs & Grains)
  { id: "c1", name: "برنج کته (بدون روغن)", category: "کربوهیدرات", unitLabel: "100 گرم پخته", calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
  { id: "c2", name: "برنج زعفرانی با کره", category: "کربوهیدرات", unitLabel: "100 گرم پخته", calories: 165, protein: 2.7, carbs: 28, fats: 4.5 },
  { id: "c3", name: "نان سنگک تازه", category: "کربوهیدرات", unitLabel: "1 کف دست (30 گرم)", calories: 75, protein: 2.5, carbs: 15, fats: 0.5 },
  { id: "c4", name: "نان بربری", category: "کربوهیدرات", unitLabel: "1 کف دست (30 گرم)", calories: 80, protein: 2.6, carbs: 16, fats: 0.6 },
  { id: "c5", name: "نان لواش", category: "کربوهیدرات", unitLabel: "1 کف دست (20 گرم)", calories: 55, protein: 1.8, carbs: 11, fats: 0.4 },
  { id: "c6", name: "نان تافتون", category: "کربوهیدرات", unitLabel: "1 کف دست (25 گرم)", calories: 65, protein: 2.1, carbs: 13, fats: 0.5 },
  { id: "c7", name: "نان جو سبوس‌دار", category: "کربوهیدرات", unitLabel: "1 برش (30 گرم)", calories: 70, protein: 2.4, carbs: 14, fats: 0.5 },
  { id: "c8", name: "سیب‌زمینی آب‌پز / بخارپز", category: "کربوهیدرات", unitLabel: "100 گرم", calories: 87, protein: 1.9, carbs: 20, fats: 0.1 },
  { id: "c9", name: "سیب‌زمینی تنوری ایرفرایر", category: "کربوهیدرات", unitLabel: "100 گرم", calories: 130, protein: 2.3, carbs: 24, fats: 2.5 },
  { id: "c10", name: "جو دوسر پرک (Oats)", category: "کربوهیدرات", unitLabel: "50 گرم (خام)", calories: 190, protein: 6.5, carbs: 33, fats: 3.5 },
  { id: "c11", name: "ماکارونی / پاستا پخته", category: "کربوهیدرات", unitLabel: "100 گرم پخته", calories: 131, protein: 5, carbs: 25, fats: 1.1 },
  { id: "c12", name: "کینوا پخته شده", category: "کربوهیدرات", unitLabel: "100 گرم", calories: 120, protein: 4.4, carbs: 21.3, fats: 1.9 },
  { id: "c13", name: "عدس پخته شده", category: "کربوهیدرات", unitLabel: "100 گرم", calories: 116, protein: 9, carbs: 20, fats: 0.4 },
  { id: "c14", name: "لوبیا چیتی پخته", category: "کربوهیدرات", unitLabel: "100 گرم", calories: 127, protein: 8.7, carbs: 22.8, fats: 0.5 },
  { id: "c15", name: "نخود پخته شده", category: "کربوهیدرات", unitLabel: "100 گرم", calories: 164, protein: 8.9, carbs: 27, fats: 2.6 },

  // 🥬 سبزیجات و صیفی‌جات (Vegetables & Greens)
  { id: "v1", name: "کلم بروکلی بخار پز / خام", category: "سبزیجات", unitLabel: "100 گرم", calories: 34, protein: 2.8, carbs: 6.6, fats: 0.4 },

  { id: "v2", name: "اسفناج تازه / بخارپز", category: "سبزیجات", unitLabel: "100 گرم", calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
  { id: "v3", name: "خیار سبز تازه", category: "سبزیجات", unitLabel: "100 گرم", calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1 },
  { id: "v4", name: "گوجه‌فرنگی تازه", category: "سبزیجات", unitLabel: "100 گرم", calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2 },
  { id: "v5", name: "هویج تازه / بخارپز", category: "سبزیجات", unitLabel: "100 گرم", calories: 41, protein: 0.9, carbs: 9.6, fats: 0.2 },
  { id: "v6", name: "قارچ دکمه‌ای پخته / گریل", category: "سبزیجات", unitLabel: "100 گرم", calories: 22, protein: 3.1, carbs: 3.3, fats: 0.3 },
  { id: "v7", name: "فلفل دلمه‌ای رنگی", category: "سبزیجات", unitLabel: "100 گرم", calories: 26, protein: 1.0, carbs: 6.0, fats: 0.2 },
  { id: "v8", name: "کدو سبز بخارپز / گریل", category: "سبزیجات", unitLabel: "100 گرم", calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3 },
  { id: "v9", name: "بادنجان کبابی / گریل", category: "سبزیجات", unitLabel: "100 گرم", calories: 25, protein: 1.0, carbs: 5.8, fats: 0.2 },
  { id: "v10", name: "کاهو رسمی / پیچ تازه", category: "سبزیجات", unitLabel: "100 گرم", calories: 15, protein: 1.4, carbs: 2.9, fats: 0.2 },
  { id: "v11", name: "کلم پیچ (سفید / قرمز)", category: "سبزیجات", unitLabel: "100 گرم", calories: 25, protein: 1.3, carbs: 5.8, fats: 0.1 },
  { id: "v12", name: "سبزی خوردن تازه (ریحان، نعناع، شاهی)", category: "سبزیجات", unitLabel: "100 گرم", calories: 25, protein: 2.5, carbs: 4.0, fats: 0.3 },
  { id: "v13", name: "لوبیا سبز بخارپز", category: "سبزیجات", unitLabel: "100 گرم", calories: 31, protein: 1.8, carbs: 7.0, fats: 0.2 },
  { id: "v14", name: "کرفس تازه", category: "سبزیجات", unitLabel: "100 گرم", calories: 16, protein: 0.7, carbs: 3.0, fats: 0.2 },
  { id: "v15", name: "گل کلم بخارپز", category: "سبزیجات", unitLabel: "100 گرم", calories: 25, protein: 1.9, carbs: 5.0, fats: 0.3 },
  { id: "v16", name: "پیاز قرمز / سفید", category: "سبزیجات", unitLabel: "100 گرم", calories: 40, protein: 1.1, carbs: 9.3, fats: 0.1 },

  // 🟠 میوه‌ها و خشکبار (Fruits & Dried Fruits)
  { id: "f1", name: "موز تازه", category: "میوه", unitLabel: "1 عدد متوسط (115 گرم)", calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
  { id: "f2", name: "سیب درختی با پوست", category: "میوه", unitLabel: "1 عدد متوسط (150 گرم)", calories: 77, protein: 0.4, carbs: 21, fats: 0.2 },
  { id: "f3", name: "پرتقال تازه", category: "میوه", unitLabel: "1 عدد متوسط (130 گرم)", calories: 62, protein: 1.2, carbs: 15, fats: 0.2 },
  { id: "f4", name: "توت‌فرنگی تازه", category: "میوه", unitLabel: "100 گرم", calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3 },
  { id: "f5", name: "شاتوت / تمشک تازه", category: "میوه", unitLabel: "100 گرم", calories: 43, protein: 1.4, carbs: 9.6, fats: 0.5 },
  { id: "f6", name: "هندوانه تازه", category: "میوه", unitLabel: "100 گرم", calories: 30, protein: 0.6, carbs: 7.6, fats: 0.2 },
  { id: "f7", name: "طالبی / خربزه / ملون", category: "میوه", unitLabel: "100 گرم", calories: 34, protein: 0.8, carbs: 8.2, fats: 0.2 },
  { id: "f8", name: "انگور یاقوتی / عسگری", category: "میوه", unitLabel: "100 گرم", calories: 69, protein: 0.7, carbs: 18, fats: 0.2 },
  { id: "f9", name: "کیوی تازه", category: "میوه", unitLabel: "1 عدد (70 گرم)", calories: 42, protein: 0.8, carbs: 10, fats: 0.4 },
  { id: "f10", name: "هلو / شلیل تازه", category: "میوه", unitLabel: "1 عدد (130 گرم)", calories: 50, protein: 1.2, carbs: 12, fats: 0.3 },
  { id: "f11", name: "گیلاس / آلبالو تازه", category: "میوه", unitLabel: "100 گرم", calories: 50, protein: 1.0, carbs: 12, fats: 0.3 },
  { id: "f12", name: "آناناس تازه", category: "میوه", unitLabel: "100 گرم", calories: 50, protein: 0.5, carbs: 13, fats: 0.1 },
  { id: "f13", name: "خرما مضافتی بم", category: "میوه", unitLabel: "1 عدد (10 گرم)", calories: 28, protein: 0.2, carbs: 7.5, fats: 0.1 },
  { id: "f14", name: "انجیر خشک", category: "میوه", unitLabel: "30 گرم (حدود 3 عدد)", calories: 74, protein: 1, carbs: 19, fats: 0.3 },
  { id: "f15", name: "کشمش / مویز سیاه", category: "میوه", unitLabel: "30 گرم", calories: 90, protein: 1, carbs: 22, fats: 0.2 },
  { id: "f16", name: "انار تازه (دانه شده)", category: "میوه", unitLabel: "100 گرم", calories: 83, protein: 1.7, carbs: 18.7, fats: 1.2 },
  { id: "f17", name: "توت سفید خشک", category: "میوه", unitLabel: "30 گرم", calories: 95, protein: 1.2, carbs: 23, fats: 0.4 },
  { id: "f18", name: "گلابی تازه", category: "میوه", unitLabel: "1 عدد (170 گرم)", calories: 100, protein: 0.6, carbs: 27, fats: 0.2 },

  // 🟤 چربی‌های مفید و آجیل (Healthy Fats & Nuts)
  { id: "n1", name: "کره بادام زمینی طبیعی", category: "چربی مفید", unitLabel: "1 قاشق غذاخوری (16 گرم)", calories: 95, protein: 4, carbs: 3, fats: 8 },
  { id: "n2", name: "روغن زیتون فرابکر", category: "چربی مفید", unitLabel: "1 قاشق غذاخوری (14 گرم)", calories: 119, protein: 0, carbs: 0, fats: 13.5 },
  { id: "n3", name: "مغز گردو ایرانی", category: "چربی مفید", unitLabel: "30 گرم (حدود 6 عدد)", calories: 195, protein: 4.5, carbs: 4, fats: 19 },
  { id: "n4", name: "پسته خامی/شور ایرانی", category: "چربی مفید", unitLabel: "30 گرم", calories: 160, protein: 6, carbs: 8, fats: 13 },
  { id: "n5", name: "بادام درختی", category: "چربی مفید", unitLabel: "30 گرم", calories: 170, protein: 6, carbs: 6, fats: 15 },
  { id: "n6", name: "بادام هندی", category: "چربی مفید", unitLabel: "30 گرم", calories: 165, protein: 5, carbs: 9, fats: 14 },
  { id: "n7", name: "دانه چیا", category: "چربی مفید", unitLabel: "15 گرم", calories: 73, protein: 2.5, carbs: 6, fats: 4.5 },
  { id: "n8", name: "آووکادو تازه", category: "چربی مفید", unitLabel: "50 گرم", calories: 80, protein: 1, carbs: 4, fats: 7.3 },

  // 🔵 لبنیات (Dairy)
  { id: "d1", name: "شیر کم‌چرب 1.5%", category: "لبنیات", unitLabel: "1 لیوان (240 میلی‌لیتر)", calories: 102, protein: 8, carbs: 12, fats: 2.4 },
  { id: "d2", name: "ماست ایسلندی (پرپروتئین 0%)", category: "لبنیات", unitLabel: "100 گرم", calories: 72, protein: 12, carbs: 4, fats: 0.2 },
  { id: "d3", name: "ماست یونانی کم‌چرب", category: "لبنیات", unitLabel: "100 گرم", calories: 59, protein: 10, carbs: 3.6, fats: 0.4 },
  { id: "d4", name: "پنیر کم‌چرب لاکتیو", category: "لبنیات", unitLabel: "50 گرم", calories: 85, protein: 8, carbs: 1.5, fats: 4 },
  { id: "d5", name: "پنیر کوتاژ / دلمه کم‌چرب", category: "لبنیات", unitLabel: "100 گرم", calories: 98, protein: 11, carbs: 3.4, fats: 4.3 },
  { id: "d6", name: "دوغ سنتی کم‌چرب بدون گاز", category: "لبنیات", unitLabel: "1 لیوان (240 میلی‌لیتر)", calories: 70, protein: 3.5, carbs: 5, fats: 2 },

  // 🟣 مکمل‌ها و فیتنس (Supplements & Fitness)
  { id: "s1", name: "پروتئین وی (Whey Protein)", category: "مکمل / پروتئین", unitLabel: "1 اسکوپ (30 گرم)", calories: 120, protein: 24, carbs: 2, fats: 1.5 },
  { id: "s2", name: "پروتئین کیسئین (Casein)", category: "مکمل / پروتئین", unitLabel: "1 اسکوپ (30 گرم)", calories: 110, protein: 23, carbs: 1.5, fats: 1 },
  { id: "s3", name: "پروتئین بار ورزشی", category: "مکمل / پروتئین", unitLabel: "1 عدد (60 گرم)", calories: 210, protein: 20, carbs: 22, fats: 7 },
  { id: "s4", name: "کراتین مونوهیدرات", category: "مکمل / پروتئین", unitLabel: "1 سروینگ (5 گرم)", calories: 0, protein: 0, carbs: 0, fats: 0 },
]

export function getFoodUnitConfig(food: { unitLabel: string; calories: number; protein: number; carbs: number; fats: number }) {
  const label = food.unitLabel || "100 گرم"

  // Gram-based check: e.g., "100 گرم", "50 گرم (خام)", "30 گرم"
  const isGramBased =
    label.includes("گرم") &&
    !label.match(/^[0-9.]+\s*عدد/) &&
    !label.match(/^[0-9.]+\s*سیخ/) &&
    !label.match(/^[0-9.]+\s*بشقاب/) &&
    !label.match(/^[0-9.]+\s*قاشق/) &&
    !label.match(/^[0-9.]+\s*کاسه/) &&
    !label.match(/^[0-9.]+\s*اسکوپ/)

  if (isGramBased) {
    const match = label.match(/(\d+(\.\d+)?)\s*گرم/)
    const baseGrams = match ? parseFloat(match[1]) : 100

    return {
      type: "GRAMS",
      baseGrams,
      label: "وزن / مقدار (گرم):",
      unit: "گرم",
      defaultVal: baseGrams,
      calculate: (inputVal: number) => {
        const targetGram = inputVal > 0 ? inputVal : baseGrams
        const ratio = targetGram / baseGrams
        return {
          amount: `${targetGram} گرم`,
          calories: Math.round(food.calories * ratio),
          protein: Math.round(food.protein * ratio * 10) / 10,
          carbs: Math.round(food.carbs * ratio * 10) / 10,
          fats: Math.round(food.fats * ratio * 10) / 10,
        }
      },
    }
  }

  // Item/Count-based check e.g. "1 عدد (50 گرم)", "1 سیخ (150 گرم)", "1 بشقاب", "1 اسکوپ (30 گرم)"
  let unitWord = "عدد"
  if (label.includes("سیخ")) unitWord = "سیخ"
  else if (label.includes("بشقاب")) unitWord = "بشقاب"
  else if (label.includes("کاسه")) unitWord = "کاسه"
  else if (label.includes("قاشق")) unitWord = "قاشق"
  else if (label.includes("اسکوپ")) unitWord = "اسکوپ"
  else if (label.includes("کف دست")) unitWord = "کف دست"
  else if (label.includes("برش")) unitWord = "برش"
  else if (label.includes("لیوان")) unitWord = "لیوان"

  return {
    type: "COUNT",
    baseGrams: 1,
    label: `تعداد (${unitWord}):`,
    unit: unitWord,
    defaultVal: 1,
    calculate: (inputVal: number) => {
      const qty = inputVal > 0 ? inputVal : 1
      const ratio = qty
      return {
        amount: `${qty} ${unitWord}`,
        calories: Math.round(food.calories * ratio),
        protein: Math.round(food.protein * ratio * 10) / 10,
        carbs: Math.round(food.carbs * ratio * 10) / 10,
        fats: Math.round(food.fats * ratio * 10) / 10,
      }
    },
  }
}
