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

    // Ensure uploads/gifs directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "gifs")
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const ext = path.extname(file.name) || ".gif"
    const safeExt = ext.match(/^\.(gif|webp|png|jpg|jpeg)$/i) ? ext.toLowerCase() : ".gif"
    const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${safeExt}`
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/gifs/${fileName}`
    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error.message || "خطا در آپلود فایل" },
      { status: 500 }
    )
  }
}
