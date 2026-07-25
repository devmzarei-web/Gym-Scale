import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const peerId = searchParams.get("peerId")

  if (!peerId) {
    return new Response("peerId parameter required", { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let lastCheckDate = new Date(Date.now() - 3000)

      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (e) {
          // Controller closed
        }
      }

      // Initial ping
      sendEvent({ type: "CONNECTED" })

      let isQuerying = false;

      const interval = setInterval(async () => {
        if (isQuerying) return;
        isQuerying = true;
        try {
          // Check for new messages between userId and peerId
          const newMessages = await prisma.message.findMany({
            where: {
              createdAt: { gt: lastCheckDate },
              OR: [
                { senderId: userId, receiverId: peerId },
                { senderId: peerId, receiverId: userId },
              ],
            },
            orderBy: { createdAt: "asc" },
          })

          if (newMessages.length > 0) {
            lastCheckDate = new Date()
            sendEvent({ type: "NEW_MESSAGES", messages: newMessages })
          } else {
            sendEvent({ type: "HEARTBEAT" })
          }
        } catch (err) {
          console.error("SSE Query Error:", err)
        } finally {
          isQuerying = false;
        }
      }, 5000)

      req.signal.addEventListener("abort", () => {
        clearInterval(interval)
        try {
          controller.close()
        } catch (e) {
          // closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
