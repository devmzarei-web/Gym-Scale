import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateDietPdfBuffer } from "@/lib/pdf-generator"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")

  try {
    const diet = await prisma.dietPlan.findUnique({
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
      client = await prisma.client.findUnique({
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
    console.error("Error generating diet PDF with Puppeteer, falling back to client printable route:", error)
    
    // Fail-Safe Fallback: Return HTTP 307 temporary redirect to printable preview with autoPrint
    // Completely bypasses popup blockers and guarantees direct document view/print.
    const fallbackUrl = new URL(`/diets/${id}/pdf`, request.url)
    if (clientId) fallbackUrl.searchParams.set("clientId", clientId)
    fallbackUrl.searchParams.set("autoPrint", "true")
    fallbackUrl.searchParams.set("error", "server_engine_fallback")

    return NextResponse.redirect(fallbackUrl, 307)
  }
}
