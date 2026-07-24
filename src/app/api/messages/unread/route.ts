import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error: any) {
    console.error("Unread message count error:", error)
    return NextResponse.json({ unreadCount: 0 })
  }
}
