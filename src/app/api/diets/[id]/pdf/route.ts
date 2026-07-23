import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateDietPdfBuffer } from "@/lib/pdf-generator"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    const diet = await (prisma as any).dietPlan.findUnique({
      where: { id },
      include: {
        trainer: true,
      },
    })

    if (!diet) {
      return new NextResponse("برنامه تغذیه یافت نشد", { status: 404 })
    }

    let client = null
    if (clientId) {
      client = await (prisma as any).client.findUnique({
        where: { id: clientId },
      })
    }

    const trainer = diet.trainer
    const pdfBuffer = await generateDietPdfBuffer(diet, client, trainer)

    const trainerName = (trainer?.name || "مربی").replace(/\s+/g, "_")
    const clientOrTitle = (client?.name || diet.title).replace(/\s+/g, "_")
    const dateStr = new Date(diet.createdAt).toLocaleDateString("fa-IR").replace(/\//g, "-")
    const filename = `NutriTrain.ir-${trainerName}-${clientOrTitle}-${dateStr}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error: any) {
    console.error("Error generating diet PDF with Puppeteer:", error)
    return new NextResponse(`خطا در تولید فایل PDF: ${error?.message || error}`, { status: 500 })
  }
}
