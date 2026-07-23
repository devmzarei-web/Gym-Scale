import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, phone, role, securityQuestion, securityAnswer, trainerId } = body

    if (!name || !email || !password || !securityQuestion || !securityAnswer) {
      return NextResponse.json(
        { error: "لطفاً تمامی فیلدهای الزامی (نام، ایمیل، کلمه عبور، سوال امنیتی و پاسخ) را وارد نمایید." },
        { status: 400 }
      )
    }

    const cleanEmail = String(email).trim().toLowerCase()
    const cleanName = String(name).trim()

    // Check if email already exists in Trainer or Client
    const existingTrainer = await (prisma as any).trainer.findUnique({ where: { email: cleanEmail } })
    const existingClient = await (prisma as any).client.findUnique({ where: { email: cleanEmail } })

    if (existingTrainer || existingClient) {
      return NextResponse.json(
        { error: "حساب کاربری با این آدرس ایمیل قبلاً ثبت نام شده است." },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const normalizedAnswer = String(securityAnswer).trim().toLowerCase()
    const hashedSecurityAnswer = await bcrypt.hash(normalizedAnswer, 10)

    let newUser: any

    if (role === "TRAINER") {
      const generatedCode = `NT-${Math.floor(1000 + Math.random() * 9000)}`
      newUser = await (prisma as any).trainer.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          phone: phone ? String(phone).trim() : null,
          trainerCode: generatedCode,
          role: "TRAINER",
          isApproved: false, // Requires SuperAdmin approval
          securityQuestion: String(securityQuestion).trim(),
          securityAnswer: hashedSecurityAnswer,
          isDemo: false,
        },
      })
    } else {
      // Default to CLIENT
      newUser = await (prisma as any).client.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          phone: phone ? String(phone).trim() : null,
          role: "CLIENT",
          securityQuestion: String(securityQuestion).trim(),
          securityAnswer: hashedSecurityAnswer,
          trainerId: trainerId ? String(trainerId) : null,
        },
      })
    }

    const isPendingApproval = role === "TRAINER"

    return NextResponse.json(
      {
        message: isPendingApproval
          ? "ثبت‌نام شما به‌عنوان مربی با موفقیت دریافت شد. حساب شما پس از بررسی و تایید مدیریت ارشد سیستم فعال خواهد شد."
          : "ثبت‌نام با موفقیت انجام شد.",
        isPendingApproval,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: role === "TRAINER" ? "TRAINER" : "CLIENT",
          isApproved: newUser.isApproved ?? true,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Register Error:", error)
    return NextResponse.json(
      { error: "خطا در ثبت نام. لطفاً مجدداً تلاش نمایید." },
      { status: 500 }
    )
  }
}
