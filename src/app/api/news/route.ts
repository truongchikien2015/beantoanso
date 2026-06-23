import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { NewsArticle, NewsCategory } from "@/lib/db/models";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");

    let filter: any = { is_published: true };

    if (categorySlug) {
      const category = await NewsCategory.findOne({ slug: categorySlug });
      if (category) {
        filter.category_id = category._id;
      }
    }

    const [categories, articles] = await Promise.all([
      NewsCategory.find({}).sort({ name: 1 }),
      NewsArticle.find(filter).populate("category_id", "name slug").sort({ created_at: -1 })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        categories,
        articles
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi lấy dữ liệu tin tức" }, { status: 500 });
  }
}
