import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateDietPdfBuffer } from "@/lib/pdf-generator"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const diet = await prisma.dietPlan.findUnique({
      where: { id },
      include: {
        trainer: true,
        history: {
          take: 1,
          include: { client: true },
        },
      },
    })

    if (!diet) {
      return new NextResponse("برنامه تغذیه یافت نشد", { status: 404 })
    }

    const client = diet.history[0]?.client
    const trainer = diet.trainer
    const pdfBuffer = await generateDietPdfBuffer(diet, client, trainer)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Diet-${diet.id}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Error generating diet PDF with Puppeteer:", error)
    return new NextResponse(`خطا در تولید فایل PDF: ${error?.message || error}`, { status: 500 })
  }
}
