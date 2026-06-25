"use client";

export function Footer() {
  return (
    <footer className="w-full bg-[#f8fafc] py-8 border-t border-slate-100 mt-auto">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h4 className="font-extrabold text-blue-900 text-base mb-1 font-nunito">Bé An Toàn Số</h4>
          <p className="text-xs text-slate-400 font-extrabold">
            © 2026 Bé An Toàn Số. Đồng hành cùng trẻ em Việt trên không gian mạng.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-x-5 text-xs text-slate-400 font-extrabold">
            <button 
              onClick={() => window.dispatchEvent(new Event("openAboutModal"))}
              className="hover:text-slate-600 transition-colors"
            >
              Về chúng tôi
            </button>
            <a href="#" className="hover:text-slate-600 transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Liên hệ</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Trợ giúp</a>
          </div>
          
          {/* Share and contact buttons */}
          <div className="flex gap-3">
            <button className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition shadow-sm border border-slate-200/50">
              📎
            </button>
            <button className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition shadow-sm border border-slate-200/50">
              ✉️
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
