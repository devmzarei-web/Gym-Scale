import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateRoutinePdfBuffer } from "@/lib/pdf-generator"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")

  try {
    const routine = await prisma.routine.findUnique({
      where: { id },
      include: {
        trainer: true,
        history: {
          include: { client: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        workoutDays: {
          include: { exercises: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!routine) {
      return new NextResponse("برنامه تمرینی یافت نشد", { status: 404 })
    }

    let client: any = null
    if (clientId) {
      client = await prisma.client.findUnique({
        where: { id: clientId },
      })
    }

    const trainer = routine.trainer
    const pdfBuffer = await generateRoutinePdfBuffer(routine, client, trainer)

    const trainerName = (trainer?.name || "مربی").replace(/\s+/g, "_")
    const clientOrTitle = (client?.name || routine.title).replace(/\s+/g, "_")
    const dateStr = new Date(routine.createdAt).toLocaleDateString("fa-IR").replace(/\//g, "-")
    const filename = `NutriTrain.ir-${trainerName}-${clientOrTitle}-${dateStr}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error: any) {
    console.error("Error generating routine PDF with Puppeteer, falling back to client printable route:", error)
    
    // Fail-Safe Fallback: Return HTTP 307 temporary redirect to printable preview with autoPrint
    // This completely bypasses browser popup blockers and guarantees document access without a 500 dead-end.
    const fallbackUrl = new URL(`/routines/${id}/pdf`, request.url)
    if (clientId) fallbackUrl.searchParams.set("clientId", clientId)
    fallbackUrl.searchParams.set("autoPrint", "true")
    fallbackUrl.searchParams.set("error", "server_engine_fallback")

    return NextResponse.redirect(fallbackUrl, 307)
  }
}
