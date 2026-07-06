import { connectDB } from "@/lib/mongodb";
import { NewsArticle } from "@/lib/db/models";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getArticle(slug: string) {
  await connectDB();
  const slugRegex = new RegExp("^" + slug.trim() + "\\s*$", "i");
  return await NewsArticle.findOne({ slug: slugRegex, is_published: true }).lean();
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const article: any = await getArticle(resolvedParams.slug);

  if (!article) return { title: "Không tìm thấy bài viết" };

  return {
    title: article.meta_title || `${article.title} | Bé An Toàn Số`,
    description: article.meta_description || article.content.substring(0, 160),
    keywords: article.keywords,
  };
}

export default async function ArticlePage({ params }: Props) {
  const resolvedParams = await params;
  const article: any = await getArticle(resolvedParams.slug);

  if (!article) notFound();

  // Estimate reading time (roughly 200 words per minute)
  const wordCount = article.content ? article.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-kid-page pb-20">
      {/* Hero Section */}
      <div className="relative bg-sky-900 overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24">
        {/* Abstract background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-sky-500 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-sky-400 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500 rounded-full blur-3xl opacity-40"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/news" className="inline-flex items-center gap-2 text-sky-200 hover:text-white font-bold mb-8 transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20">
            <ArrowLeft size={18} /> Quay lại tin tức
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1.5 bg-sky-500/30 text-sky-100 text-xs font-black uppercase tracking-wider rounded-lg border border-sky-400/30 backdrop-blur-md">
              {article.category_id?.name || "Tin tức chung"}
            </span>
            <span className="text-sky-200 text-sm font-semibold flex items-center gap-1.5">
              <span>⏱️</span> {readingTime} phút đọc
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-6 text-balance">
            {article.title}
          </h1>

          <div className="flex items-center text-sky-200 text-sm font-medium">
            <span className="flex items-center gap-2 bg-sky-800/50 px-4 py-2 rounded-xl backdrop-blur border border-sky-700/50">
              <span className="text-lg">📅</span> {new Date(article.created_at).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-8 sm:-mt-12 z-20">
        <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-xl shadow-sky-900/5 border border-slate-200/60 overflow-hidden">
          
          {/* Hero Thumbnail (If exists) */}
          {article.thumbnail && (
            <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-slate-100 relative overflow-hidden">
              <img 
                src={article.thumbnail} 
                alt={article.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-10 md:p-14">
            {/* No overflow-wrap-anywhere — that lets browsers break mid-word
                ("Vì vậ|y" bug in Vietnamese). Keep only break-word (URLs) and
                force normal word-break for prose. We also strip non-breaking spaces
                (&nbsp; / \u00a0) that cause browsers to treat whole paragraphs as single words. */}
            {(() => {
              const cleanContent = article.content
                ? article.content.replace(/&nbsp;/g, " ").replace(/\u00a0/g, " ")
                : "";
              return (
                <div
                  style={{ wordBreak: "normal", overflowWrap: "break-word", hyphens: "none" }}
                  className="prose prose-slate max-w-none
                    prose-p:text-slate-700 prose-p:leading-[1.9] prose-p:mb-5
                    prose-headings:font-black prose-headings:text-sky-950 prose-headings:leading-snug prose-headings:mb-4
                    prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                    prose-strong:text-slate-800 prose-strong:font-bold
                    prose-a:text-sky-600 prose-a:font-semibold prose-a:underline hover:prose-a:text-sky-800
                    prose-ul:pl-6 prose-ol:pl-6 prose-li:mb-2 prose-li:text-slate-700
                    prose-blockquote:border-l-4 prose-blockquote:border-sky-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-500
                    prose-img:rounded-2xl prose-img:shadow-md prose-img:border prose-img:border-slate-100 prose-img:mx-auto
                    prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    [&>*]:max-w-full [&_img]:max-w-full [&_table]:w-full [&_table]:overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: cleanContent }}
                />
              );
            })()}
            
            {article.keywords && article.keywords.length > 0 && (
              <div className="mt-16 pt-8 border-t-2 border-slate-100 border-dashed">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>🏷️</span> Thẻ từ khóa
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {article.keywords.map((kw: string, i: number) => (
                    <span key={i} className="px-4 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors cursor-default rounded-full text-sm font-bold border border-slate-200">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
