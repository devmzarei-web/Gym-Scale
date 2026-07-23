import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, email, securityAnswer, newPassword } = body

    if (!email) {
      return NextResponse.json(
        { error: "آدرس ایمیل الزامی است." },
        { status: 400 }
      )
    }

    const cleanEmail = String(email).trim().toLowerCase()

    // Find user in Trainer or Client
    let user: any = await prisma.trainer.findUnique({ where: { email: cleanEmail } })
    let userType: "trainer" | "client" = "trainer"

    if (!user) {
      user = await prisma.client.findUnique({ where: { email: cleanEmail } })
      userType = "client"
    }

    if (!user) {
      return NextResponse.json(
        { error: "کاربری با این آدرس ایمیل پیدا نشد." },
        { status: 404 }
      )
    }

    // Action 1: Get Security Question
    if (action === "GET_QUESTION") {
      if (!user.securityQuestion) {
        return NextResponse.json(
          { error: "برای این حساب سوال امنیتی تنظیم نشده است." },
          { status: 400 }
        )
      }
      return NextResponse.json({
        securityQuestion: user.securityQuestion,
      })
    }

    // Action 2: Reset Password
    if (action === "RESET_PASSWORD") {
      if (!securityAnswer || !newPassword) {
        return NextResponse.json(
          { error: "پاسخ سوال امنیتی و کلمه عبور جدید الزامی هستند." },
          { status: 400 }
        )
      }

      if (!user.securityAnswer) {
        return NextResponse.json(
          { error: "پاسخ سوال امنیتی برای این حساب ثبت نشده است." },
          { status: 400 }
        )
      }

      const normalizedInput = String(securityAnswer).trim().toLowerCase()
      const isAnswerValid = await bcrypt.compare(normalizedInput, user.securityAnswer)

      if (!isAnswerValid) {
        return NextResponse.json(
          { error: "پاسخ سوال امنیتی نادرست است." },
          { status: 400 }
        )
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10)

      if (userType === "trainer") {
        await prisma.trainer.update({
          where: { id: user.id },
          data: { password: hashedNewPassword },
        })
      } else {
        await prisma.client.update({
          where: { id: user.id },
          data: { password: hashedNewPassword },
        })
      }

      return NextResponse.json({
        message: "کلمه عبور شما با موفقیت تغییر یافت. اکنون می‌توانید وارد شوید.",
      })
    }

    return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 400 })
  } catch (error: any) {
    console.error("Security Question Error:", error)
    return NextResponse.json(
      { error: "خطا در بررسی سوال امنیتی. لطفاً مجدداً تلاش کنید." },
      { status: 500 }
    )
  }
}
