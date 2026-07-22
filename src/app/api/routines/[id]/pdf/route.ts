import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateRoutinePdfBuffer } from "@/lib/pdf-generator"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const routine = await prisma.routine.findUnique({
      where: { id },
      include: {
        trainer: true,
        workoutDays: {
          include: { exercises: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        history: {
          take: 1,
          include: { client: true },
        },
      },
    })

    if (!routine) {
      return new NextResponse("برنامه تمرینی یافت نشد", { status: 404 })
    }

    const client = routine.history[0]?.client
    const trainer = routine.trainer
    const pdfBuffer = await generateRoutinePdfBuffer(routine, client, trainer)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Routine-${routine.id}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Error generating routine PDF with Puppeteer:", error)
    return new NextResponse(`خطا در تولید فایل PDF: ${error?.message || error}`, { status: 500 })
  }
}
