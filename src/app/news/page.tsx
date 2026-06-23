import { connectDB } from "@/lib/mongodb";
import { NewsArticle } from "@/lib/db/models";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tin Tức & Kiến Thức | Bé An Toàn Số",
  description: "Cập nhật các kiến thức về an toàn trên mạng, bảo vệ trẻ em trên không gian mạng.",
};

async function getArticles() {
  await connectDB();
  const articles = await NewsArticle.find({ is_published: true })
    .populate("category_id")
    .sort({ created_at: -1 })
    .lean();
  return articles;
}

export default async function NewsPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-kid-page py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Playful Header */}
        <div className="text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <h1 className="text-4xl sm:text-5xl font-black text-sky-950 tracking-tight leading-tight mb-4 relative z-10">
            Tin tức & <span className="text-rainbow">Kiến thức</span> 📰
          </h1>
          <p className="text-lg text-sky-700 font-bold max-w-2xl mx-auto relative z-10">
            Cập nhật những bí kíp bảo vệ trẻ em trên không gian mạng và các kỹ năng số thiết yếu dành cho phụ huynh.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article: any, index: number) => (
            <Link 
              key={article._id.toString()} 
              href={`/news/${article.slug}`} 
              className={`block animate-fade-up delay-${(index % 5) * 100}`}
            >
              <div className="card-kid h-full flex flex-col group bg-white">
                {/* Thumbnail */}
                <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden border-b-3 border-slate-200/50">
                  {article.thumbnail ? (
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-sky-50 text-sky-200">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/></svg>
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 bg-white border-2 border-slate-200/50 text-sky-700 text-[11px] uppercase font-black px-3 py-1 rounded-full shadow-sm z-10">
                    {article.category_id?.name || "Chung"}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow bg-white">
                  <div className="text-xs text-slate-400 font-bold mb-3 flex items-center gap-2">
                    <span>📅</span>
                    {new Date(article.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                  <h2 className="text-xl font-black text-slate-800 mb-3 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-slate-500 font-semibold text-sm leading-relaxed line-clamp-3 mt-auto">
                    {article.meta_description || article.content.substring(0, 150) + "..."}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {articles.length === 0 && (
            <div className="col-span-full text-center py-24 bg-white rounded-3xl border-4 border-slate-100 border-dashed">
              <span className="text-5xl mb-4 block animate-bounce-in">📭</span>
              <p className="text-slate-500 font-bold text-lg">Chưa có bài viết nào được xuất bản.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
