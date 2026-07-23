import "dotenv/config"
import prisma from './src/lib/prisma'

const exercises = [
  // سینه (Chest)
  { name: 'پرس سینه هالتر', muscleGroup: 'سینه' },
  { name: 'پرس سینه دمبل', muscleGroup: 'سینه' },
  { name: 'قفسه سینه دمبل', muscleGroup: 'سینه' },
  { name: 'پرس بالا سینه هالتر', muscleGroup: 'سینه' },
  { name: 'پرس بالا سینه دمبل', muscleGroup: 'سینه' },
  { name: 'قفسه بالا سینه دمبل', muscleGroup: 'سینه' },
  { name: 'پرس زیر سینه هالتر', muscleGroup: 'سینه' },
  { name: 'شنا سوئدی', muscleGroup: 'سینه' },
  { name: 'کراس اور سیم کش', muscleGroup: 'سینه' },
  { name: 'پک دک (فلای دستگاه)', muscleGroup: 'سینه' },
  { name: 'پلاور دمبل', muscleGroup: 'سینه' },
  { name: 'کراس اور از پایین', muscleGroup: 'سینه' },
  { name: 'پرس سینه دستگاه', muscleGroup: 'سینه' },
  { name: 'شنا دست باز', muscleGroup: 'سینه' },
  { name: 'شنا دست جمع', muscleGroup: 'سینه' },
  { name: 'پرس سینه ماشین اسمیت', muscleGroup: 'سینه' },
  { name: 'پرس بالا سینه ماشین اسمیت', muscleGroup: 'سینه' },

  // پشت (Back / Lats)
  { name: 'بارفیکس', muscleGroup: 'پشت' },
  { name: 'لت از جلو سیم کش', muscleGroup: 'پشت' },
  { name: 'زیر بغل قایقی (سیم کش)', muscleGroup: 'پشت' },
  { name: 'زیر بغل هالتر خم', muscleGroup: 'پشت' },
  { name: 'زیر بغل دمبل تک دست', muscleGroup: 'پشت' },
  { name: 'تی بار', muscleGroup: 'پشت' },
  { name: 'فیله کمر', muscleGroup: 'پشت' },
  { name: 'ددلیفت', muscleGroup: 'پشت' },
  { name: 'لت دست برعکس', muscleGroup: 'پشت' },
  { name: 'پول اور سیم کش ایستاده', muscleGroup: 'پشت' },
  { name: 'لت از پشت دستگاه', muscleGroup: 'پشت' },
  { name: 'چین آپ (بارفیکس مچ برعکس)', muscleGroup: 'پشت' },
  { name: 'زیر بغل قایقی دست باز', muscleGroup: 'پشت' },
  { name: 'زیر بغل دستگاه اچ', muscleGroup: 'پشت' },
  { name: 'سوپرمن', muscleGroup: 'پشت' },

  // سرشانه (Shoulders)
  { name: 'پرس سرشانه هالتر از جلو', muscleGroup: 'سرشانه' },
  { name: 'پرس سرشانه دمبل', muscleGroup: 'سرشانه' },
  { name: 'نشر از جانب دمبل', muscleGroup: 'سرشانه' },
  { name: 'نشر از جلو دمبل', muscleGroup: 'سرشانه' },
  { name: 'نشر خم دمبل (دلتوئید پشتی)', muscleGroup: 'سرشانه' },
  { name: 'کول هالتر', muscleGroup: 'سرشانه' },
  { name: 'شراگ دمبل', muscleGroup: 'سرشانه' },
  { name: 'شراگ هالتر', muscleGroup: 'سرشانه' },
  { name: 'فلای معکوس دستگاه', muscleGroup: 'سرشانه' },
  { name: 'نشر از جانب سیم کش', muscleGroup: 'سرشانه' },
  { name: 'پرس سرشانه ماشین اسمیت', muscleGroup: 'سرشانه' },
  { name: 'نشر از جلو سیم کش', muscleGroup: 'سرشانه' },
  { name: 'فیس پول (کشیدن طناب به صورت)', muscleGroup: 'سرشانه' },
  { name: 'پرس آرنولدی', muscleGroup: 'سرشانه' },

  // بازو (Arms - Biceps & Triceps)
  { name: 'جلو بازو هالتر ایستاده', muscleGroup: 'بازو' },
  { name: 'جلو بازو دمبل متناوب', muscleGroup: 'بازو' },
  { name: 'جلو بازو لاری هالتر EZ', muscleGroup: 'بازو' },
  { name: 'جلو بازو چکشی دمبل', muscleGroup: 'بازو' },
  { name: 'جلو بازو سیم کش', muscleGroup: 'بازو' },
  { name: 'جلو بازو تمرکزی دمبل', muscleGroup: 'بازو' },
  { name: 'جلو بازو لاری دستگاه', muscleGroup: 'بازو' },
  { name: 'جلو بازو عنکبوتی', muscleGroup: 'بازو' },
  { name: 'پشت بازو سیم کش ایستاده', muscleGroup: 'بازو' },
  { name: 'پشت بازو هالتر خوابیده (سوئدی)', muscleGroup: 'بازو' },
  { name: 'پشت بازو دمبل تک دست پشت سر', muscleGroup: 'بازو' },
  { name: 'پشت بازو کیک بک دمبل', muscleGroup: 'بازو' },
  { name: 'دیپ پارالل', muscleGroup: 'بازو' },
  { name: 'پشت بازو طناب', muscleGroup: 'بازو' },
  { name: 'پرس سینه دست جمع', muscleGroup: 'بازو' },
  { name: 'پشت بازو دیپ بین دو نیمکت', muscleGroup: 'بازو' },

  // پا (Legs)
  { name: 'اسکوات هالتر', muscleGroup: 'پا' },
  { name: 'پرس پا ماشین', muscleGroup: 'پا' },
  { name: 'جلو پا دستگاه', muscleGroup: 'پا' },
  { name: 'پشت پا دستگاه', muscleGroup: 'پا' },
  { name: 'لانژ دمبل', muscleGroup: 'پا' },
  { name: 'اسکوات هاک', muscleGroup: 'پا' },
  { name: 'اسکوات از جلو', muscleGroup: 'پا' },
  { name: 'اسکوات بلغاری', muscleGroup: 'پا' },
  { name: 'ددلیفت رومانیایی (پشت پا)', muscleGroup: 'پا' },
  { name: 'هیپ تراست', muscleGroup: 'پا' },
  { name: 'خیاطه داخل ران دستگاه', muscleGroup: 'پا' },
  { name: 'خیاطه بیرون ران دستگاه', muscleGroup: 'پا' },
  { name: 'اسکوات گابلت', muscleGroup: 'پا' },

  // ساق پا (Calves)
  { name: 'ساق پا ایستاده دستگاه', muscleGroup: 'ساق پا' },
  { name: 'ساق پا نشسته دستگاه', muscleGroup: 'ساق پا' },
  { name: 'ساق پا ایستاده با دمبل', muscleGroup: 'ساق پا' },
  { name: 'ساق پا با پرس پا', muscleGroup: 'ساق پا' },

  // شکم و پهلو (Core & Abs)
  { name: 'کرانچ شکم روی زمین', muscleGroup: 'شکم و پهلو' },
  { name: 'کرانچ سیم کش', muscleGroup: 'شکم و پهلو' },
  { name: 'زیر شکم خلبانی', muscleGroup: 'شکم و پهلو' },
  { name: 'پلانک', muscleGroup: 'شکم و پهلو' },
  { name: 'رول شکم (چرخ شکم)', muscleGroup: 'شکم و پهلو' },
  { name: 'مسگری', muscleGroup: 'شکم و پهلو' },
  { name: 'چرخش روسی (رشن توییست)', muscleGroup: 'شکم و پهلو' },
  { name: 'وی آپ (V-up)', muscleGroup: 'شکم و پهلو' },
  { name: 'کوهنورد (Mountain Climber)', muscleGroup: 'شکم و پهلو' },
  { name: 'ساید پلانک', muscleGroup: 'شکم و پهلو' },
]

import bcrypt from 'bcryptjs'

async function main() {
  console.log('Clearing existing exercise dictionary...')
  await (prisma as any).exerciseDictionary.deleteMany({})
  
  console.log('Seeding fresh exercise dictionary...')
  for (const ex of exercises) {
    await (prisma as any).exerciseDictionary.create({
      data: ex,
    })
  }
  console.log(`Successfully seeded ${exercises.length} clean exercises!`)

  // SuperAdmin setup
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nutritrain.ir'
  const adminPassword = 'Number05$'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const existingSuperAdmin = await (prisma as any).trainer.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  const defaultQuestion = "نام اولین حیوان خانگی شما چیست؟"
  const hashedAnswer = await bcrypt.hash('پیشی', 10)

  if (!existingSuperAdmin) {
    console.log('Creating SuperAdmin account...')
    await (prisma as any).trainer.create({
      data: {
        name: 'مدیر ارشد سیستم',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        securityQuestion: defaultQuestion,
        securityAnswer: hashedAnswer,
        isDemo: false,
        canCreateDiets: true,
        canCreateRoutines: true,
        canAccessRecipes: true,
      }
    })
    console.log(`SuperAdmin created successfully with email: ${adminEmail}`)
  } else {
    console.log('Updating SuperAdmin password and security question...')
    await (prisma as any).trainer.update({
      where: { id: existingSuperAdmin.id },
      data: { 
        password: hashedPassword,
        securityQuestion: defaultQuestion,
        securityAnswer: hashedAnswer
      }
    })
    console.log('SuperAdmin password updated successfully to Number05$')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
