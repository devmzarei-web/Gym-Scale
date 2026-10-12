import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"
import { auth } from "@/auth"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: Request) {
  try {
    // Auth check - only authenticated users can upload
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "فایلی انتخاب نشده است." }, { status: 400 })
    }

    // Enforce file size limit before buffering
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "حجم فایل نباید بیشتر از ۵ مگابایت باشد." },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const folderParam = String(formData.get("folder") || formData.get("type") || "gifs").toLowerCase()
    const targetFolder = ["logo", "logos"].includes(folderParam) ? "logos" : "gifs"

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", targetFolder)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename with valid extension
    const ext = path.extname(file.name).toLowerCase()
    const safeExt = ext.match(/^\.(svg|png|jpg|jpeg|webp|gif)$/i) ? ext : targetFolder === "logos" ? ".png" : ".gif"
    const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${safeExt}`
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/${targetFolder}/${fileName}`
    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error.message || "خطا در آپلود فایل" },
      { status: 500 }
    )
  }
}
