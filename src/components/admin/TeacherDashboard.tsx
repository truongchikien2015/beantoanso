"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as XLSX from "xlsx";
import {
  TeacherStats,
  StudentAnswers,
  TOPIC_VALUES,
  topicLabels,
  SortOption,
} from "../../lib/store";
import { QuestionSetManager } from "./QuestionSetManager";
import { LearningPathManager } from "./LearningPathManager";
import { StudentImportManager } from "./StudentImportManager";
import { TeacherScenarioManager } from "./TeacherScenarioManager";

type TeacherTab = "overview" | "students" | "chart" | "question-sets" | "learning-paths" | "students-manage" | "scenarios";

export default function TeacherDashboard({
  onLogout,
  initialTab = "overview",
}: {
  onLogout: () => void;
  initialTab?: TeacherTab;
}) {
  const [tab, setTab] = useState<TeacherTab>(initialTab);
  const [isPrinting, setIsPrinting] = useState(false);

  const allRows = useMemo(() => TeacherStats.aggregate(), []);
  const stats = useMemo(() => TeacherStats.overview(), []);

  const NAV_ITEMS: { key: TeacherTab; label: string; icon: string }[] = [
    { key: "overview", label: "Tổng quan", icon: "📊" },
    { key: "students", label: "Học sinh", icon: "👨‍🎓" },
    { key: "chart", label: "Biểu đồ", icon: "📈" },
    { key: "question-sets", label: "Bộ câu hỏi", icon: "📝" },
    { key: "learning-paths", label: "Lộ trình", icon: "🛤️" },
    { key: "scenarios", label: "Kho tình huống", icon: "💡" },
    { key: "students-manage", label: "QL Học sinh", icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-800">
      {/* Sidebar - Light Mode */}
      <aside className="w-64 bg-[#f0f4f8] flex flex-col min-h-screen flex-shrink-0 border-r border-slate-200">
        <div className="pt-8 pb-6 px-4 flex flex-col items-center border-b border-slate-200/60 mb-4">
          <div className="w-[72px] h-[72px] rounded-full bg-slate-200 overflow-hidden mb-3 border-4 border-white shadow-sm">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-lg font-black text-[#0060ac]">Bé An Toàn Số</h2>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">Admin Portal</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
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
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-white hover:text-[#0060ac] text-sm font-bold transition-all">
            <span className="text-lg opacity-70 grayscale">⚙️</span>
            <span>Cài đặt</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 text-sm font-bold transition-all"
          >
            <span className="text-lg opacity-70 grayscale">🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen">
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <span className="text-slate-600 font-bold text-sm">Chào các thầy cô!</span>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0060ac] hover:bg-[#005090] text-white rounded-lg text-xs font-bold transition shadow-sm">
              <span>⚡</span>
              <span>Dữ liệu trực tiếp</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition relative">
              <span className="text-xl">🔔</span>
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition overflow-hidden shadow-sm">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher" alt="Avatar" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-auto p-8">
          {tab === "overview" && <OverviewTab stats={stats} />}
          {tab === "students" && <StudentsTab allRows={allRows} onPrint={() => setIsPrinting(true)} />}
          {tab === "chart" && <ChartTab />}
          {tab === "question-sets" && (
            <ManagerShell>
              <QuestionSetManager />
            </ManagerShell>
          )}
          {tab === "learning-paths" && (
            <ManagerShell>
              <LearningPathManager />
            </ManagerShell>
          )}
          {tab === "scenarios" && (
            <ManagerShell>
              <TeacherScenarioManager />
            </ManagerShell>
          )}
          {tab === "students-manage" && (
            <ManagerShell>
              <StudentImportManager />
            </ManagerShell>
          )}
        </main>
      </div>

      {isPrinting && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto printable-report">
          <PrintableReport
            rows={allRows}
            stats={stats}
            onClose={() => setIsPrinting(false)}
          />
        </div>
      )}
    </div>
  );
}

function ManagerShell({ children }: { children: ReactNode }) {
  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto">
        {children}
      </div>
    </div>
  );
}

// === Overview Tab ===
function OverviewTab({ stats }: { stats: any }) {
  const seedDemoData = () => {
    const students = [
      { nickname: "Bé Minh", scores: [80, 70] },
      { nickname: "Bé Lan", scores: [90, 80] },
      { nickname: "Bé Nam", scores: [60, 50] },
      { nickname: "Bé Vy", scores: [100, 90] },
      { nickname: "Bé Hoàng", scores: [70, 60] },
      { nickname: "Bé Trang", scores: [50, 40] },
      { nickname: "Bé Tuấn", scores: [95, 85] },
      { nickname: "Bé Linh", scores: [80, 80] },
      { nickname: "Bé Sơn", scores: [40, 30] },
      { nickname: "Bé Mai", scores: [75, 75] },
      { nickname: "Bé Hùng", scores: [85, 75] },
      { nickname: "Bé Yến", scores: [95, 85] },
      { nickname: "Bé Cường", scores: [55, 45] },
      { nickname: "Bé Hạnh", scores: [65, 55] },
      { nickname: "Bé Khoa", scores: [75, 65] },
      { nickname: "Bé Ngọc", scores: [85, 90] },
      { nickname: "Bé Đăng", scores: [45, 50] },
      { nickname: "Bé Quân", scores: [90, 85] },
      { nickname: "Bé Thảo", scores: [75, 70] },
      { nickname: "Bé Đức", scores: [60, 65] }
    ];

    const now = new Date();
    const finalResults: any[] = [];
    const studentAnswers: any[] = [];

    students.forEach((s, idx) => {
      const playerId = `demo-player-${idx}`;
      const missionScore = s.scores[0];
      const quizScore = s.scores[1];
      const totalScore = missionScore + quizScore;
      
      let title = "Tân binh";
      let badge = "🌱";
      if (totalScore >= 160) { title = "Hiệp sĩ An toàn số"; badge = "🏆"; }
      else if (totalScore >= 130) { title = "Bạn nhỏ thông minh"; badge = "🌟"; }
      else if (totalScore >= 90) { title = "Em đã hiểu cơ bản"; badge = "🎖️"; }
      else { title = "Luyện tập thêm"; badge = "💪"; }

      finalResults.push({
        id: `res-${idx}`,
        player_id: playerId,
        nickname: s.nickname,
        mission_score: missionScore,
        quiz_score: quizScore,
        total_score: totalScore,
        title,
        badge,
        completed_at: new Date(now.getTime() - idx * 2 * 3600000).toISOString()
      });

      const topics = ["stranger", "phishing", "password", "privacy", "behavior", "screentime", "badcontent"];
      const topicLabels: Record<string, string> = {
        stranger: "Người lạ trên mạng",
        password: "Bảo vệ mật khẩu",
        privacy: "Quyền riêng tư",
        behavior: "Ứng xử văn minh",
        screentime: "Thời gian sử dụng",
        badcontent: "Nội dung xấu",
        phishing: "Lừa đảo trực tuyến"
      };

      topics.forEach((t) => {
        let isCorrect = Math.random() > 0.3;
        if (t === "stranger" || t === "phishing") {
          isCorrect = Math.random() > 0.65; // Lower accuracy for stranger/phishing
        }

        studentAnswers.push({
          id: `ans-${idx}-${t}`,
          playerId,
          nickname: s.nickname,
          topicId: t,
          topicLabel: topicLabels[t],
          selectedOption: isCorrect ? "B" : "A",
          correctOption: "B",
          isCorrect,
          timestamp: new Date(now.getTime() - idx * 3600000).toISOString()
        });
      });
    });

    localStorage.setItem("bats:final_results:v1", JSON.stringify(finalResults));
    localStorage.setItem("bats:student_answers:v1", JSON.stringify(studentAnswers));
    window.location.reload();
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Báo cáo Lớp 5A</h1>
        <p className="text-slate-500 font-medium text-sm mt-1.5">
          Theo dõi tiến trình học tập của lớp trong tuần này.
        </p>
      </div>

      {/* 3 Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-[16px] flex items-center justify-center text-indigo-500 text-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <span className="bg-sky-50 text-sky-600 font-bold text-[11px] px-2.5 py-1 rounded-md">📈 +12%</span>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800 block mb-1">{stats.totalAttempts}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tổng lượt học</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-[16px] flex items-center justify-center text-blue-500 text-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </div>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800 block mb-1">{stats.studentsParticipated || 0}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số bé tham gia</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-[16px] flex items-center justify-center text-blue-500 text-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <span className="bg-sky-50 text-sky-600 font-bold text-[11px] px-2.5 py-1 rounded-md">📈 +5pt</span>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800 block mb-1">{stats.averageScore}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Điểm trung bình</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & Topics & Top Student */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart Card */}
        <div className="lg:col-span-8 bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col min-h-[360px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Lưu lượng & Tương tác</h3>
              <p className="text-xs font-medium text-slate-500">Hoạt động trong tuần</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>
          <div className="flex-1 relative flex items-end">
            {/* Extremely simple mockup of the area chart as per the image */}
            <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox="0 0 100 100">
               <defs>
                 <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2"/>
                   <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
                 </linearGradient>
               </defs>
               <path d="M0,100 L0,50 Q20,50 40,50 T60,90 T80,100 L100,100 Z" fill="url(#chartGradient)" />
               <path d="M0,50 Q20,50 40,50 T60,90 T80,100 L100,100" fill="none" stroke="#0ea5e9" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] font-bold text-slate-400 px-2 translate-y-6">
              <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
            </div>
          </div>
          <div className="h-6"></div> {/* Spacer for x-axis */}
        </div>

        {/* Right Column: Topics & Top Student */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Topics Card */}
          <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-slate-100 flex-1 flex flex-col justify-between">
            <h3 className="text-base font-bold text-slate-800 mb-6">Chủ đề cần lưu ý</h3>
            
            <div className="space-y-5">
              {/* Progress 1 */}
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1.5">
                  <span className="text-slate-600">Người lạ nhắn tin</span>
                  <span className="text-[#0060ac]">85%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-[#0060ac] h-1.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              {/* Progress 2 */}
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1.5">
                  <span className="text-slate-600">Link lạ và lừa đảo</span>
                  <span className="text-[#0074c9]">62%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-[#0074c9] h-1.5 rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>

              {/* Progress 3 */}
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1.5">
                  <span className="text-slate-600">Bảo mật thông tin</span>
                  <span className="text-slate-500">45%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-slate-400 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Student Card */}
          <div className="bg-[#0074c9] rounded-[24px] p-6 sm:p-7 shadow-md relative overflow-hidden flex flex-col justify-between h-[140px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400 rounded-full blur-3xl -mr-10 -mt-10 opacity-30"></div>
            <div className="relative z-10 flex items-center gap-2 text-sky-100 text-[10px] font-bold uppercase tracking-widest mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8m-4-4v4m0-11V3m-4 4h8l-4 4-4-4Z"/></svg>
              Bé xuất sắc nhất
            </div>
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-slate-200 shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stats.topStudent?.nickname || 'Student'}`} alt="Student" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-bold text-lg leading-tight truncate">
                  {stats.topStudent ? stats.topStudent.nickname : "Chưa có"}
                </h4>
                {stats.topStudent && (
                  <p className="text-sky-200 text-xs font-medium flex items-center gap-1 mt-0.5">
                    ☆ {stats.topStudent.score} điểm thưởng
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// === Students Tab ===
function StudentsTab({
  allRows,
  onPrint,
}: {
  allRows: any[];
  onPrint: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(0);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const PAGE_SIZE = 20;

  const { items, total } = useMemo(
    () =>
      TeacherStats.sortAndFilter(allRows, {
        query: search,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    [allRows, search, sort, page]
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExportExcel = () => {
    const data = allRows.map((r) => ({
      "Tên học sinh": r.nickname,
      "Điểm nhiệm vụ (XP)": r.missionScore,
      "Điểm kiểm tra (XP)": r.quizScore,
      "Tổng điểm (XP)": r.totalScore,
      "Danh hiệu": r.title,
      "Độ chính xác trung bình (%)": r.accuracy,
      "Chủ đề đã học": r.topicsAttempted,
      "Số câu trả lời đúng": r.correctCount,
      "Tổng số câu trả lời": r.answerCount,
      "Ngày hoàn thành gần nhất": new Date(r.completedAt).toLocaleDateString("vi-VN"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo tiến bộ");
    
    // Auto-fit columns
    const max_len = data.reduce((acc, row) => {
      Object.keys(row).forEach((key, idx) => {
        const val = row[key as keyof typeof row]?.toString() ?? "";
        acc[idx] = Math.max(acc[idx] || 0, val.length, key.length);
      });
      return acc;
    }, [] as number[]);
    worksheet["!cols"] = max_len.map((len) => ({ wch: len + 3 }));

    XLSX.writeFile(workbook, `Bao_cao_Lop_5A_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    setPage(0);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">👨‍🎓 Học sinh</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            disabled={allRows.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-sm font-bold shadow-sm cursor-pointer transition hover:scale-[1.02] active:scale-95"
          >
            📊 Xuất Excel
          </button>
          <button
            onClick={onPrint}
            disabled={allRows.length === 0}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-sm font-bold shadow-sm cursor-pointer transition hover:scale-[1.02] active:scale-95"
          >
            🖨️ In Báo Cáo PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="🔎 Tìm theo tên học sinh..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400 text-sm"
          />
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400 text-sm bg-white"
          >
            <option value="newest">Mới nhất</option>
            <option value="score">Điểm cao nhất</option>
            <option value="az">Tên A-Z</option>
            <option value="za">Tên Z-A</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 text-sm">Học sinh</th>
                <th className="text-left px-4 py-3 text-sm hidden sm:table-cell">Nhiệm vụ</th>
                <th className="text-left px-4 py-3 text-sm hidden sm:table-cell">Bài kiểm tra</th>
                <th className="text-left px-4 py-3 text-sm">Tổng</th>
                <th className="text-left px-4 py-3 text-sm hidden lg:table-cell">Danh hiệu</th>
                <th className="text-left px-4 py-3 text-sm hidden lg:table-cell">Ngày</th>
                <th className="text-left px-4 py-3 text-sm">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, idx) => (
                <tr
                  key={`${r.playerId}-${r.completedAt}-${idx}`}
                  className="border-t border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800 text-sm max-w-[120px] block truncate" title={r.nickname}>
                      {r.nickname}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm hidden sm:table-cell">
                    {r.missionScore}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm hidden sm:table-cell">
                    {r.quizScore}
                  </td>
                  <td className="px-4 py-3 text-amber-600 font-bold text-sm">
                    ⭐ {r.totalScore}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm hidden lg:table-cell">
                    {r.badge} {r.title}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm hidden lg:table-cell">
                    {new Date(r.completedAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedPlayerId(r.playerId);
                        setShowModal(true);
                      }}
                      className="px-2 py-1 rounded-md hover:bg-indigo-50 text-indigo-600 text-sm"
                    >
                      📋 Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {total === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 text-sm">
                    {search ? "Không tìm thấy học sinh" : "Chưa có dữ liệu học sinh."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-between border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total} học sinh
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-sm"
              >
                ←
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-600">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-sm"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedPlayerId && (
        <StudentDetailModal
          playerId={selectedPlayerId}
          answers={StudentAnswers.byPlayer(selectedPlayerId)}
          onClose={() => {
            setShowModal(false);
            setSelectedPlayerId(null);
          }}
        />
      )}
    </div>
  );
}

// === Chart Tab ===
function ChartTab() {
  const stats = useMemo(() => TeacherStats.topicChart(), []);
  const maxAnswers = useMemo(
    () => Math.max(...stats.map((s) => s.totalAnswers), 1),
    [stats]
  );

  const TOPIC_COLORS: Record<string, string> = {
    stranger: "from-orange-400 to-red-500",
    phishing: "from-red-400 to-pink-500",
    password: "from-blue-400 to-indigo-500",
    privacy: "from-sky-400 to-blue-500",
    behavior: "from-green-400 to-emerald-500",
    screentime: "from-cyan-400 to-teal-500",
    badcontent: "from-yellow-400 to-amber-500",
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">📈 Câu hỏi theo chủ đề</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600 text-sm mb-6">
          Số câu trả lời theo từng chủ đề (tổng lượt trả lời từ tất cả học sinh)
        </p>
        <div className="space-y-4">
          {stats.map((s) => (
            <div key={s.topicId} className="flex items-center gap-4">
              <span className="w-36 text-slate-700 text-sm font-medium truncate shrink-0">
                {s.topicLabel}
              </span>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${TOPIC_COLORS[s.topicId] ?? "from-indigo-400 to-blue-500"} rounded-full transition-all`}
                  style={{ width: `${Math.max((s.totalAnswers / maxAnswers) * 100, s.totalAnswers > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-slate-500 text-sm w-16 text-right shrink-0">
                {s.totalAnswers} câu
              </span>
              <span className="text-slate-400 text-xs w-12 text-right shrink-0">
                {s.totalAnswers > 0 ? `${s.accuracy}% đúng` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600 text-sm mb-4">Bảng thống kê chi tiết</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 text-sm">Chủ đề</th>
                <th className="text-right px-4 py-3 text-sm">Tổng câu trả lời</th>
                <th className="text-right px-4 py-3 text-sm">Đúng</th>
                <th className="text-right px-4 py-3 text-sm">Độ chính xác</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.topicId} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700 text-sm font-medium">{s.topicLabel}</td>
                  <td className="px-4 py-3 text-slate-600 text-sm text-right">{s.totalAnswers}</td>
                  <td className="px-4 py-3 text-slate-600 text-sm text-right">{s.correctAnswers}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {s.totalAnswers > 0 ? (
                      <span
                        className={
                          s.accuracy >= 70
                            ? "text-emerald-600 font-medium"
                            : s.accuracy >= 40
                            ? "text-amber-600 font-medium"
                            : "text-rose-600 font-medium"
                        }
                      >
                        {s.accuracy}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// === Student Detail Modal ===
function StudentDetailModal({
  playerId,
  answers,
  onClose,
}: {
  playerId: string;
  answers: ReturnType<typeof StudentAnswers.byPlayer>;
  onClose: () => void;
}) {
  const nickname = answers[0]?.nickname ?? playerId;
  const correct = answers.filter((a) => a.isCorrect).length;
  const accuracy =
    answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0;

  const byTopic = useMemo(() => {
    const m: Record<string, { total: number; correct: number }> = {};
    for (const a of answers) {
      if (!m[a.topicId]) m[a.topicId] = { total: 0, correct: 0 };
      m[a.topicId].total++;
      if (a.isCorrect) m[a.topicId].correct++;
    }
    return m;
  }, [answers]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Lịch sử trả lời của ${nickname}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-800">📋 Lịch sử trả lời</h3>
            <p className="text-slate-500 text-sm">{nickname}</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm"
          >
            ✕ Đóng
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-100">
          <div className="text-center p-3 bg-indigo-50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-600">{answers.length}</p>
            <p className="text-xs text-indigo-500">Câu trả lời</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600">{correct}</p>
            <p className="text-xs text-emerald-500">Đúng</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <p className="text-2xl font-bold text-amber-600">{accuracy}%</p>
            <p className="text-xs text-amber-500">Độ chính xác</p>
          </div>
        </div>

        {answers.length > 0 ? (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-600 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-sm">Chủ đề</th>
                  <th className="text-left px-4 py-2 text-sm">Trả lời</th>
                  <th className="text-left px-4 py-2 text-sm">Kết quả</th>
                  <th className="text-left px-4 py-2 text-sm hidden sm:table-cell">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {[...answers]
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  )
                  .map((a) => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-700 text-sm">{a.topicLabel}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-sm font-medium ${
                            a.selectedOption === "A"
                              ? "bg-blue-50 text-blue-700"
                              : a.selectedOption === "B"
                              ? "bg-green-50 text-green-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {a.selectedOption}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {a.isCorrect ? (
                          <span className="text-emerald-600 font-medium">✓ Đúng</span>
                        ) : (
                          <span className="text-rose-500 text-sm">
                            ✗ (đáp án đúng: {a.correctOption})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-400 text-xs hidden sm:table-cell">
                        {new Date(a.timestamp).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            Chưa có lịch sử trả lời
          </div>
        )}
      </div>
    </div>
  );
}

// Removed StatCard function as it is no longer used

// === Printable Report ===
function PrintableReport({
  rows,
  stats,
  onClose,
}: {
  rows: any[];
  stats: any;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      onClose();
    }, 500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto text-slate-800 font-sans printable-report">
      <style>{`
        @media print {
          body {
            background-color: white !important;
          }
          body > *:not(.printable-report) {
            display: none !important;
          }
          .printable-report {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div className="text-center border-b-2 border-indigo-600 pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-900 uppercase">BÁO CÁO TIẾN BỘ HỌC TẬP - BÉ AN TOÀN SỐ 🛡️</h1>
        <p className="text-slate-500 font-bold text-sm mt-1">Lớp học: Lớp 5A | Giáo viên chủ nhiệm: Cô Hoa</p>
        <p className="text-xs text-slate-400 mt-0.5">Ngày xuất báo cáo: {new Date().toLocaleDateString("vi-VN")}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <span className="text-xs text-slate-400 font-bold block">Sĩ số lớp</span>
          <span className="text-xl font-black text-indigo-700">{rows.length} học sinh</span>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <span className="text-xs text-slate-400 font-bold block">Điểm trung bình (XP)</span>
          <span className="text-xl font-black text-amber-600">{stats.averageScore}</span>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <span className="text-xs text-slate-400 font-bold block">Học sinh xuất sắc nhất</span>
          <span className="text-sm font-black text-emerald-700 block truncate mt-1">
            {stats.topStudent ? `${stats.topStudent.nickname} (${stats.topStudent.score} XP)` : "—"}
          </span>
        </div>
      </div>

      <h2 className="text-base font-bold text-slate-700 mb-2">📋 Danh sách điểm số & Đánh giá năng lực:</h2>
      <table className="w-full border-collapse border border-slate-300 text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-left">Họ tên</th>
            <th className="border border-slate-300 px-3 py-2 text-center">Điểm Nhiệm vụ</th>
            <th className="border border-slate-300 px-3 py-2 text-center">Điểm Kiểm tra</th>
            <th className="border border-slate-300 px-3 py-2 text-center">Tổng điểm</th>
            <th className="border border-slate-300 px-3 py-2 text-center">Độ chính xác</th>
            <th className="border border-slate-300 px-3 py-2 text-left">Danh hiệu</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
              <td className="border border-slate-300 px-3 py-1.5 font-bold">{r.nickname}</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center">{r.missionScore}</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center">{r.quizScore}</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center font-black text-indigo-700">{r.totalScore}</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center">{r.accuracy}%</td>
              <td className="border border-slate-300 px-3 py-1.5 font-medium">{r.title}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 flex justify-between text-xs text-slate-400 font-bold border-t border-slate-200 pt-4">
        <span>Hệ thống giáo dục an toàn trực tuyến Bé An Toàn Số</span>
        <span>Ký tên Giáo viên chủ nhiệm</span>
      </div>
    </div>
  );
}
