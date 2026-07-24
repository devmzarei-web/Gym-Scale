import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const trainerId = session?.user?.id
    const userRole = (session?.user as any)?.role

    if (!trainerId || userRole === "CLIENT") {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetClientId = searchParams.get("clientId")

    // Fetch trainer's assigned clients
    const clients = await prisma.client.findMany({
      where: userRole === "SUPER_ADMIN" ? {} : { trainerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { name: "asc" },
    })

    let messages: any[] = []
    if (targetClientId) {
      // Mark received unread messages from this client as read
      await prisma.message.updateMany({
        where: {
          senderId: targetClientId,
          receiverId: trainerId,
          isRead: false,
        },
        data: { isRead: true },
      })

      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: targetClientId, receiverId: trainerId },
            { senderId: trainerId, receiverId: targetClientId },
          ],
        },
        orderBy: { createdAt: "asc" },
      })
    }

    return NextResponse.json({ clients, messages })
  } catch (error: any) {
    console.error("Trainer messages GET error:", error)
    return NextResponse.json({ error: "خطا در دریافت پیام‌ها." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const trainerId = session?.user?.id
    const userRole = (session?.user as any)?.role

    if (!trainerId || userRole === "CLIENT") {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, content } = body

    if (!clientId || !content || !String(content).trim()) {
      return NextResponse.json({ error: "گیرنده و متن پیام الزامی است." }, { status: 400 })
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: trainerId,
        receiverId: String(clientId),
        senderRole: userRole,
        content: String(content).trim(),
      },
    })

    return NextResponse.json({ message: "پیام ارسال شد.", data: newMessage }, { status: 201 })
  } catch (error: any) {
    console.error("Trainer message POST error:", error)
    return NextResponse.json({ error: "خطا در ارسال پیام." }, { status: 500 })
  }
}
