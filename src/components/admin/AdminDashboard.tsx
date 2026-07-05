import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Admin, TOPIC_VALUES, topicLabels } from "../../lib/store";
import { downloadBackup, restoreBackup } from "../../lib/backupService";
import { AdminQuestions } from "./AdminQuestions";
import { QuestionForm } from "./QuestionForm";
import { TopicManager } from "./TopicManager";
import { PathManager } from "./PathManager";
import { TeacherManager } from "./TeacherManager";
import { FeedbackManager } from "./FeedbackManager";
import { NewsManager } from "./NewsManager";
import { SocialImpactDashboard } from "../SocialImpactDashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

type AdminTab = "overview" | "questions" | "topics" | "paths" | "students" | "teachers" | "feedbacks" | "news" | "system";

const NAV = [
  { key: "overview", label: "Trang chủ", icon: "🏠" },
  { key: "questions", label: "Câu hỏi", icon: "❓" },
  { key: "topics", label: "Chủ đề", icon: "📚" },
  { key: "paths", label: "Lộ trình", icon: "🗺️" },
  { key: "students", label: "Học sinh", icon: "🧒" },
  { key: "teachers", label: "Giáo viên", icon: "👩‍🏫" },
  { key: "feedbacks", label: "Góp ý", icon: "💡" },
  { key: "news", label: "Tin tức", icon: "📰" },
  { key: "system", label: "Dữ liệu", icon: "💾" },
] as const;

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row relative font-sans text-slate-800">
      {/* Backdrop for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar - Light Mode ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-[#f0f4f8] flex-shrink-0 flex flex-col overflow-hidden border-r border-slate-200 transition-transform duration-300 lg:static lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="pt-8 pb-6 px-4 flex flex-col items-center border-b border-slate-200/60 mb-4">
          <div className="w-[72px] h-[72px] rounded-full bg-slate-200 overflow-hidden mb-3 border-4 border-white shadow-sm">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-lg font-black text-[#0060ac]">Bé An Toàn Số</h2>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">Vùng Đất Quản Trị</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setTab(item.key);
                  setIsSidebarOpen(false); // Close sidebar on mobile select
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                  isActive
                    ? "bg-[#0060ac] text-white shadow-md shadow-blue-900/20"
                    : "text-slate-500 hover:bg-white hover:text-[#0060ac] hover:shadow-sm"
                }`}
              >
                <span className={`text-lg ${isActive ? "opacity-100" : "opacity-70 grayscale"}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/60 mt-auto space-y-1">
          <button
            onClick={onBack}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-white hover:text-[#0060ac] text-sm font-bold transition-all"
          >
            <span className="text-lg opacity-70 grayscale">🏠</span>
            <span>Về trang chủ</span>
          </button>
          <button
            onClick={() => { Admin.logout(); onBack(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 text-sm font-bold transition-all"
          >
            <span className="text-lg opacity-70 grayscale">🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
            >
              ☰
            </button>
            <span className="text-slate-600 font-bold text-sm hidden sm:block">Chào Quản trị viên!</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#0060ac] hover:bg-[#005090] text-white rounded-lg text-xs font-bold transition shadow-sm">
              <span>⚙️</span>
              <span>Hệ thống trực tiếp</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition relative">
              <span className="text-xl">🔔</span>
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition overflow-hidden shadow-sm">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Avatar" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-auto">
          {tab === "overview" && <OverviewTab />}
          {tab === "questions" && (
            <AdminContentShell>
              <AdminQuestions onLogout={() => {}} onHome={onBack} />
            </AdminContentShell>
          )}
          {tab === "topics" && (
            <AdminContentShell>
              <TopicManager onLogout={() => {}} onHome={onBack} />
            </AdminContentShell>
          )}
          {tab === "paths" && (
            <AdminContentShell>
              <PathManager onLogout={() => {}} onHome={onBack} />
            </AdminContentShell>
          )}
          {tab === "students" && <StudentsTab />}
          {tab === "teachers" && (
            <AdminContentShell wide>
              <TeacherManager onLogout={() => {}} onHome={onBack} />
            </AdminContentShell>
          )}
          {tab === "feedbacks" && (
            <AdminContentShell>
              <FeedbackManager onHome={onBack} />
            </AdminContentShell>
          )}
          {tab === "news" && (
            <AdminContentShell wide>
              <NewsManager onHome={onBack} />
            </AdminContentShell>
          )}
          {tab === "system" && (
            <AdminContentShell>
              <SystemTab />
            </AdminContentShell>
          )}
        </main>
      </div>
    </div>
  );
}

function AdminContentShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className={`mx-auto space-y-6 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
        {children}
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
type OverviewResult = {
  id: string;
  player_id: string;
  nickname: string;
  mission_score: number;
  quiz_score: number;
  total_score: number;
  title: string;
  badge: string;
  completed_at: string;
};

type OverviewQuestion = {
  id: string;
  topic_slug: string;
  is_active: boolean;
};

type OverviewAnswer = {
  id: string;
  playerId: string;
  isCorrect: boolean;
  timestamp: string;
};

function OverviewTab() {
  const [results, setResults] = useState<OverviewResult[]>([]);
  const [questions, setQuestions] = useState<OverviewQuestion[]>([]);
  const [answers, setAnswers] = useState<OverviewAnswer[]>([]);
  const [dbPaths, setDbPaths] = useState<any[]>([]);
  const [dbTopicsCount, setDbTopicsCount] = useState(0);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("week");

  useEffect(() => {
    const adminPassword = Admin.getPassword();
    const headers = { "x-admin-password": adminPassword };

    fetch("/api/admin/learning-paths", { headers })
      .then((res) => res.json())
      .then((body) => { if (body.data) setDbPaths(body.data); })
      .catch((err) => console.error("Failed to load paths for dashboard overview:", err));

    fetch("/api/admin/topics", { headers })
      .then((res) => res.json())
      .then((body) => { if (body.data) setDbTopicsCount(body.data.length); })
      .catch((err) => console.error("Failed to load topics count for dashboard overview:", err));

    fetch("/api/admin/results", { headers })
      .then((res) => res.json())
      .then((body) => { if (body.data) setResults(body.data); })
      .catch((err) => console.error("Failed to load results for dashboard overview:", err));

    fetch("/api/admin/questions", { headers })
      .then((res) => res.json())
      .then((body) => { if (body.data) setQuestions(body.data); })
      .catch((err) => console.error("Failed to load questions for dashboard overview:", err));

    fetch("/api/admin/student-answers", { headers })
      .then((res) => res.json())
      .then((body) => { if (body.data) setAnswers(body.data); })
      .catch((err) => console.error("Failed to load student answers for dashboard overview:", err));
  }, []);

  const stats = useMemo(() => {
    const players = new Set(results.map((r) => r.player_id));
    const totalScore = results.reduce((s, r) => s + r.total_score, 0);
    const avg = results.length ? Math.round(totalScore / results.length) : 0;
    const top = [...results].sort((a, b) => b.total_score - a.total_score)[0];
    return {
      attempts: results.length, players: players.size, avg,
      topPlayer: top?.nickname ?? "—", topScore: top?.total_score ?? 0,
      active: questions.filter((q) => q.is_active).length,
      total: questions.length,
      pathsActive: dbPaths.filter((p: any) => p.is_active).length,
      topicsCount: dbTopicsCount || TOPIC_VALUES.length,
      answers: answers.length,
    };
  }, [results, questions, dbPaths, dbTopicsCount, answers]);

  const questionsByTopic = useMemo(() => {
    const byTopic: Record<string, number> = {};
    for (const q of questions.filter((q) => q.is_active)) {
      byTopic[q.topic_slug] = (byTopic[q.topic_slug] || 0) + 1;
    }
    return byTopic;
  }, [questions]);

  const totalActiveQuestions = useMemo(() => {
    return Object.values(questionsByTopic).reduce((a, b) => a + b, 0) || 1;
  }, [questionsByTopic]);

  const CHART_DATA = useMemo(() => {
    const data = [];
    const now = new Date();
    
    if (timeRange === "day") {
      // Nhóm theo giờ trong ngày hôm nay
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      for (let i = 0; i <= 24; i += 2) {
        const hourStart = new Date(startOfDay.getTime() + i * 60 * 60 * 1000);
        const hourEnd = new Date(startOfDay.getTime() + (i + 2) * 60 * 60 * 1000);
        
        const active = results.filter(r => {
          const d = new Date(r.completed_at);
          return d >= hourStart && d < hourEnd;
        }).length;
        
        const ans = answers.filter(a => {
          const d = new Date(a.timestamp);
          return d >= hourStart && d < hourEnd;
        }).length;
        
        data.push({ name: `${i}:00`, active, answers: ans });
      }
    } else if (timeRange === "week") {
      // Nhóm theo thứ trong tuần hiện tại
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=T2, ..., 7=CN
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);
      
      const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(startOfWeek.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        
        const active = results.filter(r => {
          const d = new Date(r.completed_at);
          return d >= dayStart && d < dayEnd;
        }).length;
        
        const ans = answers.filter(a => {
          const d = new Date(a.timestamp);
          return d >= dayStart && d < dayEnd;
        }).length;
        
        data.push({ name: days[i], active, answers: ans });
      }
    } else if (timeRange === "month") {
      // Nhóm theo tuần trong tháng
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(startOfMonth.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(startOfMonth.getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000);
        
        const active = results.filter(r => {
          const d = new Date(r.completed_at);
          return d >= weekStart && d < weekEnd;
        }).length;
        
        const ans = answers.filter(a => {
          const d = new Date(a.timestamp);
          return d >= weekStart && d < weekEnd;
        }).length;
        
        data.push({ name: `Tuần ${i + 1}`, active, answers: ans });
      }
    } else {
      // Nhóm theo tháng trong năm
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(startOfYear.getFullYear(), i, 1);
        const monthEnd = new Date(startOfYear.getFullYear(), i + 1, 1);
        
        const active = results.filter(r => {
          const d = new Date(r.completed_at);
          return d >= monthStart && d < monthEnd;
        }).length;
        
        const ans = answers.filter(a => {
          const d = new Date(a.timestamp);
          return d >= monthStart && d < monthEnd;
        }).length;
        
        data.push({ name: months[i], active, answers: ans });
      }
    }
    return data;
  }, [timeRange, results, answers]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Báo cáo Tổng hợp</h1>
        <p className="text-slate-500 font-medium text-sm mt-1.5">
          Theo dõi tiến trình học tập của toàn hệ thống trong tuần này.
        </p>
      </div>

      {/* 3 Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-[16px] flex items-center justify-center text-indigo-500 text-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <span className="bg-sky-50 text-sky-600 font-bold text-[11px] px-2.5 py-1 rounded-md">📈 +25%</span>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800 block mb-1">{stats.players}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bé đã tham gia</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-[16px] flex items-center justify-center text-blue-500 text-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800 block mb-1">{stats.attempts}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lượt học hoàn thành</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-[16px] flex items-center justify-center text-emerald-500 text-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <span className="bg-emerald-50 text-emerald-600 font-bold text-[11px] px-2.5 py-1 rounded-md">🌟</span>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800 block mb-1">{stats.avg}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Điểm trung bình</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-slate-100 relative overflow-hidden">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">📈 Lưu lượng & Tương tác</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Dữ liệu phân tích hành vi người dùng</p>
            </div>
            <div className="flex bg-slate-50 p-1 rounded-[16px] border border-slate-100">
               {["day", "week", "month", "year"].map(r => (
                 <button 
                    key={r} 
                    onClick={() => setTimeRange(r as any)} 
                    className={`px-4 py-2 rounded-[12px] text-xs font-bold transition-all ${timeRange === r ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
                 >
                    {r === "day" ? "Ngày" : r === "week" ? "Tuần" : r === "month" ? "Tháng" : "Năm"}
                 </button>
               ))}
            </div>
         </div>
         <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorAnswers" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15}/>
                     <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                 <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} tickLine={false} axisLine={false} tickMargin={12} />
                 <YAxis tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} tickLine={false} axisLine={false} />
                 <RechartsTooltip 
                   contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontWeight: 700 }} 
                   itemStyle={{ fontWeight: 700 }}
                 />
                 <Area type="monotone" dataKey="active" name="Học sinh Active" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                 <Area type="monotone" dataKey="answers" name="Bài tập hoàn thành" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorAnswers)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Questions by topic */}
        <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-6 flex justify-between items-end">
            <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">📚 Câu hỏi theo chủ đề</h2>
            <div className="text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-[12px]">{stats.active} tổng số</div>
          </div>
          <div className="space-y-5 flex-1">
            {Object.entries(questionsByTopic).map(([k, v]) => {
              const total = totalActiveQuestions;
              const pct = Math.round((v / total) * 100);
              return (
                <div key={k}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">
                      {topicLabels[k as keyof typeof topicLabels] ?? k}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{v} câu ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Health / Learning paths */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-emerald-100 shadow-sm flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-black text-emerald-950">🗺️ Trạng thái Hệ thống</h2>
            <p className="text-xs text-emerald-600/80 font-bold mt-1">Các lộ trình học tập đang hoạt động</p>
          </div>
          <div className="flex-1 space-y-3">
            {dbPaths.length > 0 ? dbPaths.filter((p: any) => p.is_active).slice(0,4).map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50/50"
              >
                <div>
                  <p className="font-black text-emerald-950 text-sm">{p.title}</p>
                </div>
                <span
                  className="px-3 py-1.5 rounded-xl text-[11px] font-black flex-shrink-0 ml-2"
                  style={{ background: "#d1fae5", color: "#065f46" }}
                >
                  {(p.topic_ids || []).length} chủ đề
                </span>
              </div>
            )) : (
               <div className="p-8 text-center text-emerald-700 font-bold text-sm bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200">
                  Hệ thống đang sẵn sàng, chờ tạo lộ trình đầu tiên.
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Impact Dashboard Integration */}
      <div className="pt-8 mt-8 border-t-4 border-slate-100">
        <SocialImpactDashboard />
      </div>
    </div>
  );
}

// ── Students Tab (parent with sub-views) ───────────────────────────────────────
function StudentsTab() {
  const [view, setView] = useState<"accounts" | "teacher" | "completed">("accounts");

  const TABS = [
    { key: "accounts", label: "🧒 Học sinh tự đăng ký" },
    { key: "teacher", label: "👩‍🏫 Học sinh do giáo viên tạo" },
    { key: "completed", label: "🏆 Kết quả hoàn thành" },
  ] as const;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Sub-view toggle */}
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border-2 border-sky-100 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-black transition ${view === t.key ? "bg-sky-600 text-white shadow" : "text-sky-700 hover:bg-sky-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "accounts" && <AllStudentsView />}
      {view === "teacher" && <TeacherStudentsView />}
      {view === "completed" && <CompletedResultsView />}
    </div>
  );
}

// ── All Self-Registered Students (members who signed up themselves) ─────────────
type AdminStudent = {
  id: string;
  fullName: string;
  email: string | null;
  gender: string | null;
  birthYear: number | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
};

function AllStudentsView() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [resetTarget, setResetTarget] = useState<AdminStudent | null>(null);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const pw = Admin.getPassword();
      const res = await fetch("/api/admin/students", {
        headers: { "x-admin-password": pw },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setStudents(body.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải danh sách học sinh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return students;
    return students.filter((s) =>
      s.fullName.toLowerCase().includes(t) ||
      (s.email ?? "").toLowerCase().includes(t)
    );
  }, [students, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const genderLabel = (g: string | null) => g === "male" ? "Nam" : g === "female" ? "Nữ" : g === "other" ? "Khác" : "—";

  const exportCsv = () => {
    const header = "full_name,email,gender,birth_year,level,xp,total_score,created_at\n";
    const rows = students
      .map((s) =>
        `"${s.fullName}","${s.email ?? ""}","${genderLabel(s.gender)}",${s.birthYear ?? ""},${s.level},${s.xp},${s.totalScore},"${s.createdAt}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bats-all-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sky-950">🧒 Học sinh tự đăng ký</h1>
          <p className="text-sky-600 font-bold text-xs sm:text-sm mt-0.5">
            Tổng {students.length} tài khoản đã tự đăng ký thành viên
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={load} className="Btn BtnSm rounded-2xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">🔄 Tải lại</button>
          <button onClick={exportCsv} disabled={students.length === 0} className="Btn BtnPrimary font-black rounded-2xl shadow-md flex-1 sm:flex-none">📥 Xuất CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-4 border-sky-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-sky-100 bg-sky-50/30 flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Tìm theo tên hoặc email..."
            className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-xs sm:text-sm font-semibold"
            style={{ maxWidth: 360 }}
          />
        </div>

        {loading ? (
          <div className="py-20 text-center font-bold text-slate-400">⏳ Đang tải danh sách học sinh...</div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-rose-500 font-bold mb-4">{error}</p>
            <button onClick={load} className="Btn BtnSm rounded-xl font-bold bg-sky-100 text-sky-700">Thử lại</button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-sky-50/50">
                  {["Học sinh", "Email", "Giới tính", "Năm sinh", "Cấp độ", "Điểm", "Ngày đăng ký", "Thao tác"].map((h, i) => (
                    <th key={i} className="TableTh text-sky-950 font-black py-4 px-3 text-left text-xs sm:text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((s) => (
                  <tr key={s.id} className="TableTr hover:bg-sky-50/20 border-b border-sky-100">
                    <td className="TableTd font-black text-sky-950 px-3 py-3.5 text-xs sm:text-sm">{s.fullName}</td>
                    <td className="TableTd text-slate-600 font-semibold px-3 py-3.5 text-xs sm:text-sm">{s.email || "—"}</td>
                    <td className="TableTd text-slate-600 font-bold px-3 py-3.5 text-xs sm:text-sm">{genderLabel(s.gender)}</td>
                    <td className="TableTd text-slate-600 font-bold px-3 py-3.5 text-xs sm:text-sm">{s.birthYear || "—"}</td>
                    <td className="TableTd px-3 py-3.5 text-xs sm:text-sm">
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] sm:text-xs font-black text-sky-700">Lv {s.level}</span>
                    </td>
                    <td className="TableTd font-black px-3 py-3.5 text-xs sm:text-sm" style={{ color: "#f59e0b" }}>★ {s.totalScore}</td>
                    <td className="TableTd text-slate-400 font-semibold text-[10px] sm:text-xs px-3 py-3.5">{new Date(s.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="TableTd px-3 py-3.5">
                      <button onClick={() => setResetTarget(s)} className="Btn BtnSm rounded-xl font-bold bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs py-1 px-2.5">
                        🔑 Đổi mật khẩu
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-16 font-bold text-slate-400">
                    {students.length === 0 ? "Chưa có học sinh nào tự đăng ký." : "Không có học sinh nào phù hợp với tìm kiếm."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t-2 border-sky-100 bg-sky-50/30 gap-3">
            <p className="text-xs sm:text-sm font-bold text-sky-800">
              Đang xem {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trên tổng {filtered.length} bé
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">← Trước</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">Sau →</button>
            </div>
          </div>
        )}
      </div>

      {resetTarget && (
        <ResetStudentPasswordModal
          student={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}

// ── Reset Student Password Modal (admin) ────────────────────────────────────────
function ResetStudentPasswordModal({ student, onClose }: { student: AdminStudent; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    try {
      const pw = Admin.getPassword();
      const res = await fetch(`/api/admin/students/${student.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Lỗi đặt lại mật khẩu");
      setSuccess("Đã đặt lại mật khẩu thành công!");
      setTimeout(onClose, 1300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ModalOverlay p-2 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="ModalBox w-full rounded-3xl border-4 border-sky-200 shadow-2xl overflow-hidden" style={{ maxWidth: 440 }}>
        <div className="ModalHeader bg-amber-50 border-b-2 border-amber-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-amber-900 text-lg sm:text-xl flex items-center gap-1.5">🔑 Đổi mật khẩu</h3>
            <p className="text-amber-700 font-bold text-xs sm:text-sm mt-0.5">Học sinh: {student.fullName}</p>
          </div>
          <button onClick={onClose} disabled={loading} className="Btn BtnSm rounded-xl font-black bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1 text-xs">✕ Đóng</button>
        </div>
        <form onSubmit={submit} className="p-4 sm:p-5 space-y-4 bg-white">
          <div>
            <label className="block text-sky-950 font-black text-xs sm:text-sm mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-sm font-semibold"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sky-950 font-black text-xs sm:text-sm mb-1.5">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-sm font-semibold"
            />
          </div>
          {error && <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold text-xs sm:text-sm">❌ {error}</div>}
          {success && <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-bold text-xs sm:text-sm">🎉 {success}</div>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="Btn BtnPrimary font-black rounded-2xl shadow-md flex-1 justify-center">
              {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="Btn BtnSm rounded-2xl font-bold bg-white border-2 border-sky-100">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Teacher-Created Students (imported / created by teachers) ───────────────────
type AdminTeacherStudent = {
  id: string;
  nickname: string;
  email: string | null;
  className: string | null;
  studentCode: string;
  assignedPathId: string | null;
  assignedPathTitle: string | null;
  assignedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teacherName: string | null;
  teacherEmail: string | null;
};

function TeacherStudentsView() {
  const [students, setStudents] = useState<AdminTeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [resetTarget, setResetTarget] = useState<AdminTeacherStudent | null>(null);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const pw = Admin.getPassword();
      const res = await fetch("/api/admin/teacher-students", {
        headers: { "x-admin-password": pw },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setStudents(body.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải danh sách học sinh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const classOptions = useMemo(() => {
    return [...new Set(students.map((s) => s.className).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "vi"));
  }, [students]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter && s.className !== classFilter) return false;
      if (!t) return true;
      return (
        s.nickname.toLowerCase().includes(t) ||
        s.studentCode.toLowerCase().includes(t) ||
        (s.teacherName ?? "").toLowerCase().includes(t)
      );
    });
  }, [students, search, classFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    const header = "nickname,student_code,class_name,email,teacher,assigned_path,is_active,created_at\n";
    const rows = students
      .map((s) =>
        `"${s.nickname}","${s.studentCode}","${s.className ?? ""}","${s.email ?? ""}","${s.teacherName ?? ""}","${s.assignedPathTitle ?? ""}",${s.isActive ? "active" : "inactive"},"${s.createdAt}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bats-teacher-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const activeCount = students.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sky-950">👩‍🏫 Học sinh do giáo viên tạo</h1>
          <p className="text-sky-600 font-bold text-xs sm:text-sm mt-0.5">
            Tổng {students.length} tài khoản · {activeCount} đang hoạt động
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={load} className="Btn BtnSm rounded-2xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">🔄 Tải lại</button>
          <button onClick={exportCsv} disabled={students.length === 0} className="Btn BtnPrimary font-black rounded-2xl shadow-md flex-1 sm:flex-none">📥 Xuất CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-4 border-sky-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-sky-100 bg-sky-50/30 flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Tìm theo tên, mã học sinh, giáo viên..."
            className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-xs sm:text-sm font-semibold"
            style={{ maxWidth: 360 }}
          />
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
            className="Input rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-xs sm:text-sm font-semibold"
            style={{ maxWidth: 200 }}
          >
            <option value="">Tất cả lớp</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center font-bold text-slate-400">⏳ Đang tải danh sách học sinh...</div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-rose-500 font-bold mb-4">{error}</p>
            <button onClick={load} className="Btn BtnSm rounded-xl font-bold bg-sky-100 text-sky-700">Thử lại</button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="bg-sky-50/50">
                  {["Học sinh", "Mã", "Lớp", "Giáo viên", "Lộ trình", "Trạng thái", "Ngày tạo", "Thao tác"].map((h, i) => (
                    <th key={i} className="TableTh text-sky-950 font-black py-4 px-3 text-left text-xs sm:text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((s) => (
                  <tr key={s.id} className="TableTr hover:bg-sky-50/20 border-b border-sky-100">
                    <td className="TableTd font-black text-sky-950 px-3 py-3.5 text-xs sm:text-sm">{s.nickname}</td>
                    <td className="TableTd px-3 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] sm:text-xs text-slate-600">{s.studentCode}</span>
                    </td>
                    <td className="TableTd text-slate-600 font-bold px-3 py-3.5 text-xs sm:text-sm">{s.className || "—"}</td>
                    <td className="TableTd text-slate-600 font-semibold px-3 py-3.5 text-xs sm:text-sm">{s.teacherName || "—"}</td>
                    <td className="TableTd px-3 py-3.5 text-xs sm:text-sm">
                      {s.assignedPathTitle
                        ? <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-sky-700">{s.assignedPathTitle}</span>
                        : <span className="text-slate-400 text-[10px] sm:text-xs">Chưa gán</span>}
                    </td>
                    <td className="TableTd px-3 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-xl text-[10px] sm:text-xs font-black ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {s.isActive ? "● Hoạt động" : "○ Đã khóa"}
                      </span>
                    </td>
                    <td className="TableTd text-slate-400 font-semibold text-[10px] sm:text-xs px-3 py-3.5">{new Date(s.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="TableTd px-3 py-3.5">
                      <button onClick={() => setResetTarget(s)} className="Btn BtnSm rounded-xl font-bold bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs py-1 px-2.5">
                        🔑 Đổi mật khẩu
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-16 font-bold text-slate-400">
                    {students.length === 0 ? "Chưa có học sinh nào được giáo viên tạo." : "Không có học sinh nào phù hợp với bộ lọc."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t-2 border-sky-100 bg-sky-50/30 gap-3">
            <p className="text-xs sm:text-sm font-bold text-sky-800">
              Đang xem {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trên tổng {filtered.length} bé
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">← Trước</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">Sau →</button>
            </div>
          </div>
        )}
      </div>

      {resetTarget && (
        <ResetTeacherStudentPasswordModal
          student={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}

// ── Reset Teacher-Student Password Modal (admin) ────────────────────────────────
function ResetTeacherStudentPasswordModal({ student, onClose }: { student: AdminTeacherStudent; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    try {
      const pw = Admin.getPassword();
      const res = await fetch(`/api/admin/teacher-students/${student.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Lỗi đặt lại mật khẩu");
      setSuccess("Đã đặt lại mật khẩu thành công!");
      setTimeout(onClose, 1300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ModalOverlay p-2 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="ModalBox w-full rounded-3xl border-4 border-sky-200 shadow-2xl overflow-hidden" style={{ maxWidth: 440 }}>
        <div className="ModalHeader bg-amber-50 border-b-2 border-amber-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-amber-900 text-lg sm:text-xl flex items-center gap-1.5">🔑 Đổi mật khẩu</h3>
            <p className="text-amber-700 font-bold text-xs sm:text-sm mt-0.5">Học sinh: {student.nickname} ({student.studentCode})</p>
          </div>
          <button onClick={onClose} disabled={loading} className="Btn BtnSm rounded-xl font-black bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1 text-xs">✕ Đóng</button>
        </div>
        <form onSubmit={submit} className="p-4 sm:p-5 space-y-4 bg-white">
          <div>
            <label className="block text-sky-950 font-black text-xs sm:text-sm mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-sm font-semibold"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sky-950 font-black text-xs sm:text-sm mb-1.5">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-sm font-semibold"
            />
          </div>
          {error && <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold text-xs sm:text-sm">❌ {error}</div>}
          {success && <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-bold text-xs sm:text-sm">🎉 {success}</div>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="Btn BtnPrimary font-black rounded-2xl shadow-md flex-1 justify-center">
              {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="Btn BtnSm rounded-2xl font-bold bg-white border-2 border-sky-100">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Completed Results View (journeys finished, loaded from DB) ─────────────────
type CompletedResult = OverviewResult;
type CompletedAnswer = {
  id: string;
  playerId: string;
  nickname: string;
  topicSlug: string;
  topicLabel: string;
  selectedOption: "A" | "B" | "C";
  correctOption: "A" | "B" | "C";
  isCorrect: boolean;
  timestamp: string;
};

function CompletedResultsView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState<CompletedResult[]>([]);
  const [answers, setAnswers] = useState<CompletedAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const PAGE_SIZE = 20;

  useEffect(() => {
    let cancelled = false;
    const pw = Admin.getPassword();
    const headers = { "x-admin-password": pw };

    Promise.all([
      fetch("/api/admin/results", { headers }).then((r) => r.json()),
      fetch("/api/admin/student-answers", { headers }).then((r) => r.json()),
    ])
      .then(([resultsBody, answersBody]) => {
        if (cancelled) return;
        if (resultsBody.data) setResults(resultsBody.data);
        if (answersBody.data) setAnswers(answersBody.data);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load completed results:", err);
        setError(err instanceof Error ? err.message : "Lỗi tải kết quả hoàn thành");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    const sorted = [...results].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    return t ? sorted.filter((r) => r.nickname.toLowerCase().includes(t)) : sorted;
  }, [results, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    const blob = new Blob(
      ["nickname,mission_score,quiz_score,total_score,title,completed_at\n" +
        results.map((r) => `"${r.nickname}",${r.mission_score},${r.quiz_score},${r.total_score},"${r.title}","${r.completed_at}"`).join("\n")],
      { type: "text/csv;charset=utf-8" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bats-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sky-950">🏆 Kết quả hoàn thành</h1>
          <p className="text-sky-600 font-bold text-xs sm:text-sm mt-0.5">Đã có {results.length} bé hoàn thành hành trình an toàn số</p>
        </div>
        <button onClick={exportCsv} disabled={results.length === 0} className="Btn BtnPrimary font-black rounded-2xl shadow-md w-full sm:w-auto">
          📥 Xuất file Excel (CSV)
        </button>
      </div>

      <div className="bg-white rounded-3xl border-4 border-sky-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-sky-100 bg-sky-50/30">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Tìm theo tên của bé..."
            className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-xs sm:text-sm font-semibold"
            style={{ maxWidth: 360 }}
          />
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-sky-50/50">
                {["Học sinh","Nhiệm vụ","Bài kiểm tra","Tổng điểm","Danh hiệu đạt được","Ngày hoàn thành","Xem chi tiết"].map((h, i) => (
                  <th key={i} className="TableTh text-sky-950 font-black py-4 px-3 text-left text-xs sm:text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-16 font-bold text-slate-400">⏳ Đang tải kết quả...</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={7} className="text-center py-16 font-bold text-rose-500">⚠️ {error}</td></tr>
              )}
              {!loading && !error && paged.map((r) => (
                <tr key={r.id} className="TableTr hover:bg-sky-50/20 border-b border-sky-100">
                  <td className="TableTd font-black text-sky-950 px-3 py-3.5 text-xs sm:text-sm">{r.nickname}</td>
                  <td className="TableTd text-slate-600 font-bold px-3 py-3.5 text-xs sm:text-sm">{r.mission_score}</td>
                  <td className="TableTd text-slate-600 font-bold px-3 py-3.5 text-xs sm:text-sm">{r.quiz_score}</td>
                  <td className="TableTd font-black px-3 py-3.5 text-xs sm:text-sm" style={{ color: "#f59e0b" }}>★ {r.total_score}</td>
                  <td className="TableTd text-sky-800 font-extrabold text-xs sm:text-sm px-3 py-3.5">{r.badge} {r.title}</td>
                  <td className="TableTd text-slate-400 font-semibold text-[10px] sm:text-xs px-3 py-3.5">{new Date(r.completed_at).toLocaleDateString("vi-VN")}</td>
                  <td className="TableTd px-3 py-3.5">
                    <button onClick={() => { setSelectedPlayer(r.player_id); setShowModal(true); }} className="Btn BtnSm rounded-xl font-bold bg-sky-100 hover:bg-sky-200 text-sky-700 text-xs py-1 px-2.5">
                      👁️ Xem bài
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 font-bold text-slate-400">Chưa có bé nào tham gia học tập.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t-2 border-sky-100 bg-sky-50/30 gap-3">
            <p className="text-xs sm:text-sm font-bold text-sky-800">
              Đang xem {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trên tổng {filtered.length} bé
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">← Trước</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">Sau →</button>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedPlayer && (
        <StudentModal
          playerId={selectedPlayer}
          answers={answers.filter((a) => a.playerId === selectedPlayer)}
          onClose={() => { setShowModal(false); setSelectedPlayer(null); }}
        />
      )}
    </div>
  );
}

function StudentModal({ playerId, answers, onClose }: {
  playerId: string;
  answers: CompletedAnswer[];
  onClose: () => void;
}) {
  const name = answers[0]?.nickname ?? playerId;
  const correct = answers.filter((a) => a.isCorrect).length;
  const accuracy = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0;

  return (
    <div className="ModalOverlay p-2 sm:p-4">
      <div
        className="ModalBox w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden rounded-3xl border-4 border-sky-200 shadow-2xl"
        style={{ maxWidth: 672 }}
      >
        <div className="ModalHeader bg-sky-50 border-b-2 border-sky-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sky-950 text-lg sm:text-xl flex items-center gap-1.5">📝 Lịch sử trả lời</h3>
            <p className="text-sky-600 font-bold text-xs sm:text-sm mt-0.5">Học sinh: {name}</p>
          </div>
          <button onClick={onClose} className="Btn BtnSm rounded-xl font-black bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1 text-xs">✕ Đóng</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 bg-white border-b-2 border-sky-100">
          {([[answers.length, "Tổng số câu", "#0284c7"], [correct, "Trả lời đúng", "#10b981"], [accuracy + "%", "Độ chính xác", "#f97316"]] as [number|string, string, string][]).map(([v, l, c]) => (
            <div key={l} className="text-center p-3 rounded-2xl" style={{ background: `${c}10`, border: `2px solid ${c}20` }}>
              <p className="text-2xl font-black" style={{ color: c }}>{v}</p>
              <p className="text-[10px] font-black mt-0.5" style={{ color: c }}>{l}</p>
            </div>
          ))}
        </div>
        {answers.length > 0 ? (
          <div className="flex-1 overflow-y-auto bg-white">
            <table className="w-full min-w-[500px]">
              <thead className="sticky top-0 bg-sky-50/90 backdrop-blur-sm z-10">
                <tr className="border-b-2 border-sky-100">
                  {["Chủ đề học", "Đáp án bé chọn", "Đánh giá", "Thời gian làm bài"].map((h, i) => (
                    <th key={i} className="TableTh text-[11px] sm:text-xs font-black text-sky-950 py-3 px-3 uppercase text-left" style={{ letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...answers].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((a) => (
                  <tr key={a.id} className="TableTr hover:bg-sky-50/10 border-b border-sky-50">
                    <td className="TableTd text-xs sm:text-sm font-bold text-sky-900 px-3 py-3">{a.topicLabel}</td>
                    <td className="TableTd px-3 py-3">
                      <span className={`px-2.5 py-0.5 rounded-xl text-[10px] sm:text-xs font-black ${
                        a.selectedOption === "A" ? "bg-blue-100 text-blue-700 border-2 border-blue-200" :
                        a.selectedOption === "B" ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200" :
                        "bg-amber-100 text-amber-800 border-2 border-amber-200"
                      }`}>{a.selectedOption}</span>
                    </td>
                    <td className="TableTd px-3 py-3">
                      {a.isCorrect
                        ? <span className="text-emerald-600 font-extrabold text-xs sm:text-sm">✓ Chính xác</span>
                        : <span className="text-rose-500 font-extrabold text-[10px] sm:text-xs">✕ Đúng: {a.correctOption}</span>
                      }
                    </td>
                    <td className="TableTd text-slate-400 font-semibold text-[10px] sm:text-xs px-3 py-3">{new Date(a.timestamp).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center font-bold text-slate-400 bg-white">Chưa có lịch sử làm bài kiểm tra.</div>
        )}
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, bg, subtitle }: {
  label: string; value: string | number; icon: string; accent: string; bg?: string; subtitle?: string;
}) {
  return (
    <div
      className="rounded-3xl p-5 min-w-0 border-4 border-white shadow-sm hover:scale-[1.03] transition-all duration-300 relative overflow-hidden"
      style={{
        background: bg || "#fff",
        boxShadow: "0 8px 24px rgba(3,105,161,0.04)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-black text-sky-950 uppercase tracking-wider">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="font-black text-sky-950 leading-tight text-2xl sm:text-3xl break-words">
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] font-bold mt-1.5" style={{ color: accent }}>{subtitle}</p>
      )}
    </div>
  );
}

// ── System Backup/Restore Tab ──────────────────────────────────────────────────
function SystemTab() {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    // Read cached admin password if available
    const cached = Admin.getPassword();
    setPassword(cached);
  }, []);

  const handleBackup = async () => {
    if (!password) {
      setMessage({ text: "Vui lòng nhập mật khẩu quản trị trước!", isError: true });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await downloadBackup(password);
      setMessage({ text: "Sao lưu thành công! File JSON đã tải về máy của bạn.", isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi khi sao lưu dữ liệu.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setMessage({ text: "Vui lòng nhập mật khẩu quản trị!", isError: true });
      return;
    }
    if (!file) {
      setMessage({ text: "Vui lòng chọn file sao lưu (.json) cần khôi phục!", isError: true });
      return;
    }

    const confirmRestore = window.confirm(
      "CẢNH BÁO: Hành động này sẽ ghi đè dữ liệu cục bộ và thêm/cập nhật dữ liệu trên database. Bạn có chắc chắn muốn thực hiện?"
    );
    if (!confirmRestore) return;

    setLoading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const res = await restoreBackup(content, password);
        if (res.success) {
          setMessage({
            text: `Khôi phục thành công! Trang web sẽ tự động tải lại sau vài giây...`,
            isError: false,
          });
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setMessage({ text: res.message, isError: true });
        }
      } catch (err: any) {
        setMessage({ text: err.message || "Lỗi không xác định khi khôi phục.", isError: true });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4 px-2 sm:px-4">
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-sky-100 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-black text-sky-950 flex items-center gap-2">
          💾 Quản lý Dữ liệu & Hệ thống
        </h2>
        <p className="text-sky-600/80 font-bold text-xs sm:text-sm mt-1">
          Xuất tệp sao lưu hoặc khôi phục dữ liệu để di chuyển toàn bộ câu hỏi, kết quả học tập sang một máy chủ/hệ thống khác.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 sm:p-5 rounded-2xl font-bold border-2 text-xs sm:text-sm shadow-sm ${
            message.isError
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {message.isError ? "❌ " : "🎉 "} {message.text}
        </div>
      )}

      {/* Admin Password Input */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-sky-100 shadow-sm space-y-3">
        <label className="block text-sky-950 font-black text-xs sm:text-sm">
          🔑 Xác nhận mật khẩu quản trị (Admin Password)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu để thao tác dữ liệu..."
          className="Input w-full max-w-md rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-xs sm:text-sm font-semibold"
        />
        <p className="text-[10px] sm:text-xs text-slate-400 font-semibold">
          Dùng để xác thực quyền sao lưu và khôi phục của tài khoản admin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-sky-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-3xl">📥</span>
            <h3 className="text-base sm:text-lg font-black text-sky-950 mt-3 mb-2">Tải file sao lưu</h3>
            <p className="text-slate-500 font-bold text-xs leading-relaxed">
              Tải xuống toàn bộ cơ sở dữ liệu (Database collections) và các thiết lập cục bộ (LocalStorage) trong một file JSON duy nhất để lưu trữ an toàn.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={handleBackup}
              disabled={loading}
              className="w-full py-2.5 sm:py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl shadow-md transition disabled:opacity-50 text-xs sm:text-sm"
            >
              {loading ? "Đang tải dữ liệu..." : "Tạo và Tải bản sao lưu"}
            </button>
          </div>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-sky-100 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleRestore} className="flex flex-col h-full justify-between">
            <div>
              <span className="text-3xl">📤</span>
              <h3 className="text-base sm:text-lg font-black text-sky-950 mt-3 mb-2">Khôi phục từ file</h3>
              <p className="text-slate-500 font-bold text-xs leading-relaxed mb-4">
                Chọn tệp sao lưu dạng `.json` đã tải xuống trước đó để khôi phục toàn bộ cấu hình hệ thống hiện tại.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-xl file:border-0
                  file:text-xs file:font-black
                  file:bg-sky-100 file:text-sky-700
                  hover:file:bg-sky-200"
              />
            </div>
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading || !file}
                className="w-full py-2.5 sm:py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-md transition disabled:opacity-50 text-xs sm:text-sm"
              >
                {loading ? "Đang ghi dữ liệu..." : "Khôi phục dữ liệu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
