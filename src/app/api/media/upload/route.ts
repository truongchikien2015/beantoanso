import { NextRequest, NextResponse } from "next/server";
import { getTeacherUid } from "@/lib/auth-helpers";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getMediaType } from "@/lib/mediaUtils";

const ALLOWED_EXTENSIONS = {
  image: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  audio: [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".oga", ".opus"]
};

const MAX_SIZE = {
  image: 5 * 1024 * 1024, // 5MB
  audio: 15 * 1024 * 1024 // 15MB
};

export async function POST(req: NextRequest) {
  // Authentication
  const adminPassword = req.headers.get("x-admin-password");
  const isAdmin = adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!isAdmin) {
    const authResult = getTeacherUid(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return the 401 response
    }
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const originalName = file.name || "unknown";
    const ext = path.extname(originalName).toLowerCase();
    
    // Determine media type
    let expectedType: "image" | "audio" | null = null;
    if (ALLOWED_EXTENSIONS.image.includes(ext)) {
      expectedType = "image";
    } else if (ALLOWED_EXTENSIONS.audio.includes(ext)) {
      expectedType = "audio";
    }

    if (!expectedType) {
      return NextResponse.json({ 
        error: `Loại định dạng file không được hỗ trợ (${ext}). Chỉ hỗ trợ hình ảnh và âm thanh.` 
      }, { status: 400 });
    }

    // Check size limit
    if (file.size > MAX_SIZE[expectedType]) {
      const limitMB = MAX_SIZE[expectedType] / (1024 * 1024);
      return NextResponse.json({ 
        error: `File quá lớn. Giới hạn upload cho ${expectedType} là ${limitMB}MB.` 
      }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const uuid = crypto.randomUUID();
    const newFilename = `${uuid}${ext}`;
    
    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "questions");
    await fs.mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadDir, newFilename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/questions/${newFilename}`;
    const actualMediaType = getMediaType(publicUrl);

    return NextResponse.json({
      url: publicUrl,
      media_type: actualMediaType,
      filename: newFilename,
      size: file.size
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi trong quá trình upload file." }, { status: 500 });
  }
}
