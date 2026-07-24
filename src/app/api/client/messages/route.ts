import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    // Mark received unread messages as read
    await prisma.message.updateMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    })

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error("Fetch messages error:", error)
    return NextResponse.json({ error: "خطا در دریافت پیام‌ها." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const body = await req.json()
    const { content } = body

    if (!content || !String(content).trim()) {
      return NextResponse.json({ error: "متن پیام نمی‌تواند خالی باشد." }, { status: 400 })
    }

    // Find assigned trainer for client
    const client = await prisma.client.findUnique({
      where: { id: userId },
      select: { trainerId: true },
    })

    if (!client || !client.trainerId) {
      return NextResponse.json({ error: "مربی اختصاصی برای شما ثبت نشده است." }, { status: 400 })
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: client.trainerId,
        senderRole: "CLIENT",
        content: String(content).trim(),
      },
    })

    return NextResponse.json({ message: "پیام ارسال شد.", data: newMessage }, { status: 201 })
  } catch (error: any) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "خطا در ارسال پیام." }, { status: 500 })
  }
}
