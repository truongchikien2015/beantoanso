import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { NewsArticle } from "@/lib/db/models";

export async function GET(req: Request) {
  try {
    await connectDB();
    // Populate category if needed, or just return articles
    const articles = await NewsArticle.find().populate("category_id", "name").sort({ created_at: -1 });
    return NextResponse.json({ success: true, data: articles });
  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi tải danh sách bài viết" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const { title, slug, content, thumbnail, category_id, meta_title, meta_description, keywords, is_published } = body;

    if (!title || !slug || !content || !category_id) {
      return NextResponse.json({ error: "Thiếu trường bắt buộc" }, { status: 400 });
    }

    const cleanSlug = slug.trim();

    const article = new NewsArticle({
      title,
      slug: cleanSlug,
      content,
      thumbnail,
      category_id,
      meta_title,
      meta_description,
      keywords,
      is_published: is_published ?? false,
    });
    
    await article.save();

    return NextResponse.json({ success: true, data: article });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Slug bài viết đã tồn tại" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Lỗi tạo bài viết" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const { _id, title, slug, content, thumbnail, category_id, meta_title, meta_description, keywords, is_published } = body;

    if (!_id || !title || !slug || !content || !category_id) {
      return NextResponse.json({ error: "Thiếu trường bắt buộc" }, { status: 400 });
    }

    const cleanSlug = slug.trim();

    const updatedArticle = await NewsArticle.findByIdAndUpdate(
      _id,
      {
        title,
        slug: cleanSlug,
        content,
        thumbnail,
        category_id,
        meta_title,
        meta_description,
        keywords,
        is_published: is_published ?? false,
      },
      { new: true }
    );
    
    if (!updatedArticle) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedArticle });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Slug bài viết đã tồn tại" }, { status: 400 });
    }
    return NextResponse.json({ error: "Lỗi cập nhật bài viết" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID bài viết" }, { status: 400 });
    }

    await connectDB();
    const deletedArticle = await NewsArticle.findByIdAndDelete(id);

    if (!deletedArticle) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi xóa bài viết" }, { status: 500 });
  }
}
