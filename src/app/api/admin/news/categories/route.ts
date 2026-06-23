import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { NewsCategory } from "@/lib/db/models";

export async function GET(req: Request) {
  try {
    await connectDB();
    const categories = await NewsCategory.find().sort({ created_at: -1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi tải danh mục tin tức" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    }

    await connectDB();
    const { name, slug, description } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Tên và Slug là bắt buộc" }, { status: 400 });
    }

    const category = new NewsCategory({ name, slug, description });
    await category.save();

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Slug danh mục đã tồn tại" }, { status: 400 });
    }
    return NextResponse.json({ error: "Lỗi tạo danh mục tin tức" }, { status: 500 });
  }
}
