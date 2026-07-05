// POST /api/media/upload — upload image/audio to Vercel Blob (production) or
// fall back to local public/uploads when BLOB_READ_WRITE_TOKEN is missing (dev).
// Vercel serverless filesystem is read-only outside /tmp, so writing to
// public/uploads/ works locally but fails in production — hence Blob.
import { NextRequest, NextResponse } from "next/server";
import { getTeacherUid } from "@/lib/auth-helpers";
import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getMediaType } from "@/lib/mediaUtils";

const ALLOWED_EXTENSIONS = {
  image: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  audio: [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".oga", ".opus"],
};

const MAX_SIZE = {
  image: 5 * 1024 * 1024, // 5MB
  audio: 15 * 1024 * 1024, // 15MB
};

export async function POST(req: NextRequest) {
  // Auth: admin password header OR teacher JWT
  const adminPassword = req.headers.get("x-admin-password");
  const isAdmin = adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!isAdmin) {
    const authResult = getTeacherUid(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const originalName = file.name || "unknown";
    const ext = path.extname(originalName).toLowerCase();

    let expectedType: "image" | "audio" | null = null;
    if (ALLOWED_EXTENSIONS.image.includes(ext)) expectedType = "image";
    else if (ALLOWED_EXTENSIONS.audio.includes(ext)) expectedType = "audio";

    if (!expectedType) {
      return NextResponse.json(
        { error: `Loại định dạng file không được hỗ trợ (${ext}). Chỉ hỗ trợ hình ảnh và âm thanh.` },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE[expectedType]) {
      const limitMB = MAX_SIZE[expectedType] / (1024 * 1024);
      return NextResponse.json(
        { error: `File quá lớn. Giới hạn upload cho ${expectedType} là ${limitMB}MB.` },
        { status: 400 },
      );
    }

    const uuid = crypto.randomUUID();
    const newFilename = `${uuid}${ext}`;
    const blobKey = `questions/${newFilename}`;

    let publicUrl: string;
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    const isVercel = !!process.env.VERCEL;

    if (hasBlobToken) {
      // Production path (Vercel): upload to Blob storage.
      const blob = await put(blobKey, file, {
        access: "public",
        contentType: file.type || undefined,
        addRandomSuffix: false,
      });
      publicUrl = blob.url;
    } else if (isVercel) {
      // On Vercel WITHOUT the Blob token → filesystem is read-only. Fail loudly
      // instead of trying fs.writeFile (which throws EROFS).
      return NextResponse.json(
        {
          error:
            "BLOB_READ_WRITE_TOKEN is not set on this deployment. Connect the Blob store to this project in Vercel → Storage → your Blob store → Projects → Connect Project, then redeploy.",
          diagnostic: { runtime: "vercel", hasBlobToken: false },
        },
        { status: 500 },
      );
    } else {
      // Local dev fallback: write to public/uploads/questions/.
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadDir = path.join(process.cwd(), "public", "uploads", "questions");
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, newFilename), buffer);
      publicUrl = `/uploads/questions/${newFilename}`;
    }

    return NextResponse.json({
      url: publicUrl,
      media_type: getMediaType(publicUrl),
      filename: newFilename,
      size: file.size,
    });
  } catch (error) {
    // Surface the actual error to the client so it shows up in the Network tab.
    // Safe to expose in this admin/teacher-authed endpoint.
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : "Error";
    console.error("[media/upload] failed:", name, message);
    return NextResponse.json(
      {
        error: "Đã xảy ra lỗi trong quá trình upload file.",
        diagnostic: {
          name,
          message,
          hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
          isVercel: !!process.env.VERCEL,
        },
      },
      { status: 500 },
    );
  }
}

// GET /api/media/upload — quick health check to verify the Blob token was
// actually injected into this deployment. No auth required (only reveals
// booleans, never the token value).
export async function GET() {
  return NextResponse.json({
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    tokenLen: process.env.BLOB_READ_WRITE_TOKEN?.length ?? 0,
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
