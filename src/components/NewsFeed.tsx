"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Article = {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  category_id: Category;
  created_at: string;
  meta_description?: string;
};

export function NewsFeed() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const url = activeCategory === "all" ? "/api/news" : `/api/news?category=${activeCategory}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          // If activeCategory is 'all', also set the categories menu
          if (activeCategory === "all" && categories.length === 0) {
            setCategories(data.data.categories);
          }
          setArticles(data.data.articles);
        }
      } catch (err) {
        console.error("Lỗi tải tin tức", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [activeCategory]); // refetch when category changes

  return (
    <section className="w-full py-16 bg-white border-t border-slate-100" id="news">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-black text-blue-900 tracking-tight leading-tight mb-4 font-nunito text-center">
          Tin tức & Góc phụ huynh
        </h2>
        <p className="text-center text-slate-500 text-sm font-bold max-w-lg mx-auto leading-relaxed mb-8">
          Cập nhật thông tin mới nhất về an toàn không gian mạng và các kỹ năng số dành cho trẻ em.
        </p>

        {/* Category Menu */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${
              activeCategory === "all"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${
                activeCategory === cat.slug
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link key={article._id} href={`/news/${article.slug}`} className="group block">
                <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col hover:-translate-y-1">
                  <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden">
                    {article.thumbnail ? (
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-sky-50 text-sky-200">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/></svg>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-blue-700 text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-sm">
                      {article.category_id?.name}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <p className="text-xs text-slate-400 font-bold mb-2">
                      {new Date(article.created_at).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <h3 className="font-black text-slate-800 text-lg mb-3 font-nunito leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    {article.meta_description && (
                      <p className="text-slate-500 text-sm font-semibold leading-relaxed line-clamp-3 mt-auto">
                        {article.meta_description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
            <span className="text-4xl mb-4 block">📰</span>
            <p className="text-slate-500 font-bold">Hiện chưa có bài viết nào trong danh mục này.</p>
          </div>
        )}
      </div>
    </section>
  );
}
