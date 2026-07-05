"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Admin } from "../../lib/store";
import { slugify } from "../../lib/slugify";
import { Loader2, Wand2 } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false }) as any;

type Category = { _id: string; name: string; slug: string; description?: string };
type Article = {
  _id: string;
  title: string;
  slug: string;
  content: string;
  thumbnail?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  category_id: Category | string;
  is_published: boolean;
  created_at: string;
};

export function NewsManager({ onHome }: { onHome: () => void }) {
  const [activeTab, setActiveTab] = useState<"articles" | "categories" | "create_article">("articles");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    title: "", slug: "", content: "", thumbnail: "", category_id: "", meta_title: "", meta_description: "", keywords: "", is_published: true
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContentLoading, setAiContentLoading] = useState(false);
  // Track whether the user has manually edited the slug. Once they do, we stop
  // auto-syncing from the title so we don't clobber their intent.
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Filter and Edit states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editId, setEditId] = useState<string | null>(null);

  const resetForm = () => {
    setEditId(null);
    setSlugManuallyEdited(false);
    setFormData({
      title: "", slug: "", content: "", thumbnail: "", category_id: "", meta_title: "", meta_description: "", keywords: "", is_published: true
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const pw = Admin.getPassword();
      const [catRes, artRes] = await Promise.all([
        fetch("/api/admin/news/categories", { headers: { "x-admin-password": pw } }),
        fetch("/api/admin/news/articles", { headers: { "x-admin-password": pw } })
      ]);
      const catBody = await catRes.json();
      const artBody = await artRes.json();
      if (catBody.data) setCategories(catBody.data);
      if (artBody.data) setArticles(artBody.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const quillRef = useRef<any>(null);

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        const pw = Admin.getPassword();
        try {
          const res = await fetch("/api/media/upload", {
            method: "POST",
            headers: { "x-admin-password": pw },
            body: formDataUpload,
          });
          const data = await res.json();
          if (data.url && quillRef.current) {
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, "image", data.url);
          } else {
            alert(data.error || "Lỗi upload ảnh");
          }
        } catch (e) {
          alert("Lỗi upload ảnh");
          console.error(e);
        }
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image", "video"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), []);

  const handleGenerateAiSeo = async () => {
    if (!formData.title) return alert("Vui lòng nhập Tiêu đề trước khi dùng AI!");
    setAiLoading(true);
    try {
      const pw = Admin.getPassword();
      const res = await fetch("/api/admin/news/ai-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ topic: formData.title, content: formData.content })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const aiSlug = typeof data.data.slug === "string" ? data.data.slug : "";
        setFormData((prev) => ({
          ...prev,
          meta_title: data.data.meta_title || prev.meta_title,
          meta_description: data.data.meta_description || prev.meta_description,
          keywords: Array.isArray(data.data.keywords) ? data.data.keywords.join(", ") : (data.data.keywords || prev.keywords),
          // Prefer AI slug; keep existing user-edited slug intact.
          slug: slugManuallyEdited && prev.slug ? prev.slug : (aiSlug || prev.slug),
          content: prev.content || data.data.suggested_outline || "",
        }));
        alert("Đã tự động điền Meta SEO bằng AI!");
      } else {
        // Server now returns real error text (see /api/admin/news/ai-seo).
        alert(data.error || "Có lỗi từ AI");
      }
    } catch (e) {
      alert(`Lỗi kết nối AI: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateAiContent = async () => {
    if (!formData.title) return alert("Vui lòng nhập Tiêu đề để AI có thể viết bài!");
    setAiContentLoading(true);
    try {
      const pw = Admin.getPassword();
      const res = await fetch("/api/admin/news/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ topic: formData.title })
      });
      const data = await res.json();
      if (data.success && data.data?.content) {
        setFormData((prev) => ({ ...prev, content: data.data.content }));
        alert("Đã tự động viết bài bằng AI!");
      } else {
        alert(data.error || "Lỗi tạo bài viết từ AI");
      }
    } catch (e) {
      alert("Lỗi kết nối AI");
    } finally {
      setAiContentLoading(false);
    }
  };

  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    try {
      const pw = Admin.getPassword();
      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "x-admin-password": pw },
        body: formDataUpload,
      });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({...prev, thumbnail: data.url}));
        // Reset file input so users can re-upload
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      } else {
        alert(data.error || "Lỗi tải ảnh đại diện");
      }
    } catch (err) {
      alert("Lỗi tải ảnh đại diện");
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pw = Admin.getPassword();
      const method = editId ? "PUT" : "POST";
      const res = await fetch("/api/admin/news/articles", {
        method,
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({
          ...formData,
          _id: editId,
          keywords: formData.keywords.split(",").map(k => k.trim()).filter(k => k)
        })
      });
      if (res.ok) {
        alert(editId ? "Đã cập nhật bài viết thành công!" : "Đã tạo bài viết thành công!");
        setActiveTab("articles");
        resetForm();
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || "Lỗi lưu bài");
      }
    } catch (e) {
      alert("Lỗi hệ thống");
    }
  };

  const handleEditArticle = (article: any) => {
    setEditId(article._id);
    // Editing an existing article: treat its slug as user-authored so the
    // title→slug auto-sync doesn't clobber it.
    setSlugManuallyEdited(true);
    setFormData({
      title: article.title || "",
      slug: article.slug || "",
      content: article.content || "",
      thumbnail: article.thumbnail || "",
      category_id: article.category_id?._id || article.category_id || "",
      meta_title: article.meta_title || "",
      meta_description: article.meta_description || "",
      keywords: article.keywords?.join(", ") || "",
      is_published: article.is_published
    });
    setActiveTab("create_article");
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.")) return;
    try {
      const pw = Admin.getPassword();
      const res = await fetch(`/api/admin/news/articles?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": pw }
      });
      if (res.ok) {
        alert("Đã xóa bài viết!");
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || "Lỗi xóa bài viết");
      }
    } catch (e) {
      alert("Lỗi hệ thống");
    }
  };

  const filteredArticles = articles.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" ? true : filterStatus === "published" ? a.is_published : !a.is_published;
    return matchSearch && matchStatus;
  });

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const pw = Admin.getPassword();
      const res = await fetch("/api/admin/news/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({
          name: fd.get("name"),
          slug: fd.get("slug"),
          description: fd.get("desc")
        })
      });
      if (res.ok) {
        alert("Tạo danh mục thành công!");
        loadData();
        (e.target as HTMLFormElement).reset();
      } else {
        const d = await res.json();
        alert(d.error || "Lỗi tạo danh mục");
      }
    } catch (e) {
      alert("Lỗi hệ thống");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sky-950">📰 Quản lý Tin tức 
          </h1>
          <p className="text-sky-600 font-bold text-xs sm:text-sm mt-0.5">Viết bài chuẩn SEO với sự hỗ trợ của Grok</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("articles")} className={`Btn BtnSm rounded-2xl font-bold ${activeTab === "articles" ? "bg-sky-600 text-white" : "bg-white border-2 border-sky-100"}`}>Danh sách</button>
          <button onClick={() => setActiveTab("categories")} className={`Btn BtnSm rounded-2xl font-bold ${activeTab === "categories" ? "bg-sky-600 text-white" : "bg-white border-2 border-sky-100"}`}>Danh mục</button>
          <button onClick={() => { resetForm(); setActiveTab("create_article"); }} className={`Btn BtnPrimary rounded-2xl font-black shadow-md`}>+ Viết bài mới</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-4 border-sky-100 shadow-sm overflow-hidden p-6">
        {activeTab === "articles" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-lg font-bold text-sky-900">Danh sách bài viết</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm tiêu đề..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="Input text-sm rounded-xl border border-sky-200 p-2 sm:w-64"
                />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="Input text-sm rounded-xl border border-sky-200 p-2"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="published">Đã xuất bản</option>
                  <option value="draft">Bản nháp</option>
                </select>
              </div>
            </div>
            
            {loading ? <p>Đang tải...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-sky-50">
                      <th className="p-3 border-b-2 border-sky-100">Tiêu đề</th>
                      <th className="p-3 border-b-2 border-sky-100">Đường dẫn (Slug)</th>
                      <th className="p-3 border-b-2 border-sky-100 text-center">Trạng thái</th>
                      <th className="p-3 border-b-2 border-sky-100">Ngày đăng</th>
                      <th className="p-3 border-b-2 border-sky-100 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArticles.map(a => (
                      <tr key={a._id} className="hover:bg-slate-50 border-b border-sky-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-800">
                          {a.thumbnail && <img src={a.thumbnail} alt="" className="w-8 h-8 rounded object-cover inline-block mr-2 align-middle border border-slate-200" />}
                          <span className="align-middle">{a.title}</span>
                        </td>
                        <td className="p-3 text-slate-500 max-w-[200px] truncate" title={a.slug}>{a.slug}</td>
                        <td className="p-3 text-center">
                          {a.is_published 
                            ? <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">✅ Đã đăng</span> 
                            : <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">🟡 Nháp</span>}
                        </td>
                        <td className="p-3 text-slate-500">{new Date(a.created_at).toLocaleDateString("vi-VN")}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleEditArticle(a)} className="text-blue-600 hover:text-blue-800 font-bold px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded mr-2 transition">Sửa</button>
                          <button onClick={() => handleDeleteArticle(a._id)} className="text-red-600 hover:text-red-800 font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition">Xóa</button>
                        </td>
                      </tr>
                    ))}
                    {filteredArticles.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Không tìm thấy bài viết nào phù hợp.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-bold text-sky-900 mb-4">Danh mục hiện có</h2>
              <ul className="space-y-2">
                {categories.map(c => (
                  <li key={c._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500">/{c.slug}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-900 mb-4">Thêm danh mục mới</h2>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Tên danh mục</label>
                  <input name="name" required className="Input w-full rounded-xl border-2 border-sky-100 p-2" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Đường dẫn (Slug)</label>
                  <input name="slug" required className="Input w-full rounded-xl border-2 border-sky-100 p-2" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Mô tả (tùy chọn)</label>
                  <input name="desc" className="Input w-full rounded-xl border-2 border-sky-100 p-2" />
                </div>
                <button type="submit" className="Btn BtnPrimary rounded-xl py-2 w-full font-bold">Lưu danh mục</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "create_article" && (
          <form onSubmit={handleSaveArticle} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1 text-slate-700">Tiêu đề bài viết</label>
                  <input
                    value={formData.title}
                    onChange={e => {
                      const nextTitle = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        title: nextTitle,
                        // Auto-sync slug from title unless the user has typed their own.
                        slug: slugManuallyEdited ? prev.slug : slugify(nextTitle),
                      }));
                    }}
                    required
                    className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-sky-500 font-bold text-lg"
                    placeholder="Ví dụ: 5 Cách bảo vệ trẻ em trên mạng..."
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-slate-700">Nội dung (HTML hoặc Text)</label>
                  <button type="button" onClick={handleGenerateAiContent} disabled={aiContentLoading} className="text-sm font-bold text-sky-600 flex items-center gap-1 hover:text-sky-800">
                    {aiContentLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} AI viết bài
                  </button>
                </div>
                
                <div className="bg-white rounded-xl overflow-hidden border-2 border-slate-200 focus-within:border-sky-500">
                  <ReactQuill 
                    ref={quillRef}
                    theme="snow" 
                    value={formData.content} 
                    onChange={(val) => setFormData({...formData, content: val})} 
                    className="min-h-[400px]"
                    modules={modules}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="bg-sky-100/50 p-4 rounded-xl border border-sky-200">
                <h3 className="font-black text-sky-800 mb-2 flex items-center gap-2"><Wand2 size={18}/> AI SEO Trợ lý</h3>
                <p className="text-xs text-sky-700 mb-3">Tự động sinh Meta Title, Meta Description và Keywords từ nội dung/tiêu đề hiện tại.</p>
                <button type="button" onClick={handleGenerateAiSeo} disabled={aiLoading} className="w-full bg-sky-600 text-white font-bold py-2 rounded-lg hover:bg-sky-700 transition flex justify-center items-center gap-2">
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  Tối ưu bằng AI
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Đường dẫn (Slug)</label>
                <input
                  value={formData.slug}
                  onChange={e => {
                    setSlugManuallyEdited(true);
                    setFormData({ ...formData, slug: e.target.value });
                  }}
                  required
                  placeholder="tu-dong-sinh-tu-tieu-de"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                />
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  {slugManuallyEdited
                    ? "✏️ Slug đã chỉnh tay — không tự đồng bộ với tiêu đề nữa."
                    : "🔗 Tự động sinh từ Tiêu đề. Sửa tay để dừng đồng bộ."}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Ảnh đại diện (Thumbnail)</label>
                
                {/* Preview nếu đã có ảnh */}
                {formData.thumbnail && (
                  <div className="relative mb-3 rounded-xl overflow-hidden border-2 border-emerald-200 shadow-sm">
                    <img 
                      src={formData.thumbnail} 
                      alt="Thumbnail" 
                      className="w-full h-36 object-cover bg-slate-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-36 bg-slate-100 items-center justify-center flex-col gap-2">
                      <span className="text-3xl">🖼️</span>
                      <span className="text-xs text-slate-400 font-semibold">Không thể hiển thị ảnh</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2">
                      <span className="text-white text-[10px] font-bold truncate flex-1 mr-2">✅ Đã lưu ảnh</span>
                      <button type="button" onClick={() => setFormData({...formData, thumbnail: ""})} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex-shrink-0">Xóa</button>
                    </div>
                  </div>
                )}

                {/* Upload file button */}
                <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed ${thumbnailUploading ? 'border-sky-400 bg-sky-50' : 'border-slate-300 bg-white hover:border-sky-400 hover:bg-sky-50'} rounded-xl p-3 text-sm cursor-pointer transition-colors`}>
                  {thumbnailUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-sky-500" />
                      <span className="text-sky-600 font-bold">Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">🖼️</span>
                      <span className="text-slate-500 font-semibold">{formData.thumbnail ? "Đổi ảnh khác" : "Chọn ảnh để tải lên"}</span>
                    </>
                  )}
                  <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleUploadThumbnail} className="hidden" disabled={thumbnailUploading} />
                </label>

                {/* URL input fallback */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Hoặc dán link URL ảnh vào đây (https://... hoặc /uploads/...)"
                    value={formData.thumbnail}
                    onChange={e => setFormData({...formData, thumbnail: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-500 focus:border-sky-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Danh mục</label>
                <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} required className="w-full border border-slate-300 rounded-lg p-2 text-sm">
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-emerald-700">Meta Title (SEO)</label>
                <input value={formData.meta_title} onChange={e => setFormData({...formData, meta_title: e.target.value})} className="w-full border border-emerald-300 rounded-lg p-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-emerald-700">Meta Description (SEO)</label>
                <textarea value={formData.meta_description} onChange={e => setFormData({...formData, meta_description: e.target.value})} className="w-full border border-emerald-300 rounded-lg p-2 text-sm h-24 text-slate-600" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-emerald-700">Keywords (cách nhau dấu phẩy)</label>
                <input value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})} className="w-full border border-emerald-300 rounded-lg p-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700">Trạng thái bài viết</label>
                <select value={formData.is_published ? "published" : "draft"} onChange={e => setFormData({...formData, is_published: e.target.value === "published"})} className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold">
                  <option value="draft">🟡 Bản nháp (Đang ẩn)</option>
                  <option value="published">✅ Đã xuất bản (Công khai)</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-md">
                {editId ? "CẬP NHẬT BÀI VIẾT" : "LƯU BÀI VIẾT"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
