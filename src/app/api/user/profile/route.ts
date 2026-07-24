import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "لطفاً ابتدا وارد حساب کاربری خود شوید." }, { status: 401 })
    }

    const userId = session.user.id

    // Search in Trainer table first
    let user: any = await prisma.trainer.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        role: true,
        trainerCode: true,
        securityQuestion: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    let userType: "TRAINER" | "CLIENT" = "TRAINER"

    if (!user) {
      user = await prisma.client.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          age: true,
          weight: true,
          height: true,
          goals: true,
          notes: true,
          role: true,
          securityQuestion: true,
          createdAt: true,
          updatedAt: true,
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      })
      userType = "CLIENT"
    }

    if (!user) {
      return NextResponse.json({ error: "کاربر پیدا نشد." }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        ...user,
        role: user.role || userType,
      },
    })
  } catch (error: any) {
    console.error("Fetch Profile Error:", error)
    return NextResponse.json({ error: "خطا در دریافت اطلاعات پروفایل." }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const {
      name,
      phone,
      bio,
      age,
      weight,
      height,
      goals,
      securityQuestion,
      securityAnswer,
      currentPassword,
      newPassword,
    } = body

    // Find in Trainer or Client
    let trainerUser = await prisma.trainer.findUnique({ where: { id: userId } })
    let clientUser = await prisma.client.findUnique({ where: { id: userId } })

    if (!trainerUser && !clientUser) {
      return NextResponse.json({ error: "کاربر پیدا نشد." }, { status: 404 })
    }

    const isTrainer = Boolean(trainerUser)
    const currentUser = trainerUser || clientUser!

    // Handle Password Change if requested
    let updatedHashedPassword = undefined
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "برای تغییر کلمه عبور، وارد کردن کلمه عبور فعلی الزامی است." }, { status: 400 })
      }
      if (!currentUser.password) {
        return NextResponse.json({ error: "رمز عبوری برای این حساب ثبت نشده است." }, { status: 400 })
      }
      const isMatch = await bcrypt.compare(currentPassword, currentUser.password)
      if (!isMatch) {
        return NextResponse.json({ error: "کلمه عبور فعلی اشتباه است." }, { status: 400 })
      }
      updatedHashedPassword = await bcrypt.hash(newPassword, 10)
    }

    // Handle Security Answer Update if requested
    let updatedHashedSecurityAnswer = undefined
    if (securityAnswer) {
      const normalizedAnswer = String(securityAnswer).trim().toLowerCase()
      updatedHashedSecurityAnswer = await bcrypt.hash(normalizedAnswer, 10)
    }

    if (isTrainer) {
      const updatedTrainer = await prisma.trainer.update({
        where: { id: userId },
        data: {
          name: name ? String(name).trim() : undefined,
          phone: phone !== undefined ? String(phone).trim() : undefined,
          bio: bio !== undefined ? String(bio).trim() : undefined,
          securityQuestion: securityQuestion ? String(securityQuestion).trim() : undefined,
          securityAnswer: updatedHashedSecurityAnswer,
          password: updatedHashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          bio: true,
          role: true,
          securityQuestion: true,
          updatedAt: true,
        },
      })
      return NextResponse.json({ message: "پروفایل با موفقیت بروزرسانی شد.", user: updatedTrainer })
    } else {
      const updatedClient = await prisma.client.update({
        where: { id: userId },
        data: {
          name: name ? String(name).trim() : undefined,
          phone: phone !== undefined ? String(phone).trim() : undefined,
          age: age ? Number(age) : undefined,
          weight: weight ? Number(weight) : undefined,
          height: height ? Number(height) : undefined,
          goals: goals !== undefined ? String(goals).trim() : undefined,
          securityQuestion: securityQuestion ? String(securityQuestion).trim() : undefined,
          securityAnswer: updatedHashedSecurityAnswer,
          password: updatedHashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          age: true,
          weight: true,
          height: true,
          goals: true,
          role: true,
          securityQuestion: true,
          updatedAt: true,
        },
      })
      return NextResponse.json({ message: "پروفایل با موفقیت بروزرسانی شد.", user: updatedClient })
    }
  } catch (error: any) {
    console.error("Update Profile Error:", error)
    return NextResponse.json({ error: "خطا در بروزرسانی اطلاعات پروفایل." }, { status: 500 })
  }
}
