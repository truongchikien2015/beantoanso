import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { RobotGuide } from "./RobotGuide";
import { sfx } from "../lib/sound";
import type { StudentLearningPathWithSteps, StudentSession } from "../types/teacher-content";

type LearningPath = {
  id: string;
  title: string;
  description: string;
  topic_ids: string[];
  is_active: boolean;
};

type Props = {
  nickname: string;
  assignedPath?: StudentLearningPathWithSteps | null;
  assignedStudent?: StudentSession | null;
  assignedLoading?: boolean;
  showDailyQuiz?: boolean;
  onOpenDailyQuiz?: () => void;
  onSelect: (path: LearningPath) => void;
  onSelectAssigned?: () => void;
  onBack: () => void;
};

const PATH_ICONS: Record<string, string> = {
  "Cơ bản": "🌱",
  "Nâng cao": "🚀",
  "Toàn diện": "🎓",
};

const PATH_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  "Cơ bản": {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    gradient: "from-emerald-400 to-teal-500",
  },
  "Nâng cao": {
    bg: "bg-cyan-50",
    border: "border-cyan-300",
    text: "text-cyan-800",
    gradient: "from-cyan-300 to-teal-400",
  },
  "Toàn diện": {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    gradient: "from-amber-400 to-orange-500",
  },
};

const DEFAULT_STYLE = {
  bg: "bg-orange-50",
  border: "border-orange-300",
  text: "text-orange-800",
  gradient: "from-orange-300 to-amber-400",
};

export function LearningPathSelector({
  nickname,
  assignedPath,
  assignedStudent,
  assignedLoading = false,
  showDailyQuiz = false,
  onOpenDailyQuiz,
  onSelect,
  onSelectAssigned,
  onBack,
}: Props) {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    async function loadPaths() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading learning paths:", error);
      } else if (data) {
        setPaths(data);
      }
      setLoading(false);
    }
    loadPaths();
  }, []);

  const handleSelect = (path: LearningPath) => {
    sfx.click();
    setSelected(path.id);
    // Small delay for visual feedback
    setTimeout(() => {
      onSelect(path);
    }, 300);
  };

  if (loading) {
    return (
      <div className="kid-paper-page flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">📚</div>
          <p className="text-[var(--kid-muted)] text-lg font-extrabold">Đang tải lộ trình...</p>
        </div>
      </div>
    );
  }

  if (paths.length === 0 && !assignedPath) {
    return (
      <div className="kid-paper-page flex items-center justify-center p-4">
        <div className="kid-sticker-card max-w-md p-8 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl text-[var(--kid-ink)] font-black mb-2">Chưa có lộ trình nào</h2>
          <p className="kid-readable text-[var(--kid-muted)] mb-6">
            Giáo viên hoặc quản trị viên cần thêm lộ trình học tập.
          </p>
          <button
            onClick={onBack}
            className="btn-kid btn-kid-coral"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kid-paper-page p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-6">
          <div className="text-5xl mb-3">🗺️</div>
          <h1 className="text-3xl sm:text-4xl text-[var(--kid-ink)] font-black mb-2">
            Chọn lộ trình học tập
          </h1>
          <p className="kid-readable text-[var(--kid-muted)]">
            Xin chào <span className="font-black text-[var(--kid-coral-new)]">{assignedStudent?.nickname ?? nickname}</span>! Hãy chọn lộ trình phù hợp với em nhé.
          </p>
        </div>

        {/* Robot guide */}
        <div className="mb-6 max-w-md mx-auto">
          <RobotGuide
            message={assignedPath
              ? "Giáo viên đã chuẩn bị sẵn một lộ trình riêng cho em. Em có thể bắt đầu ngay nhé!"
              : "Mỗi lộ trình có các chủ đề khác nhau. Em hãy chọn lộ trình muốn học nhé!"}
          />
        </div>

        {assignedLoading && (
          <div className="kid-sticker-card mb-5 p-4 text-center text-base font-bold text-[var(--kid-muted)]">
            Đang kiểm tra lộ trình cá nhân...
          </div>
        )}

        {assignedPath && (
          <section className="kid-sticker-card mb-7 border-[var(--kid-teal-new)]/55 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center rounded-full bg-[var(--kid-teal-new)]/15 px-3 py-1 text-sm font-black text-teal-800">
                  Lộ trình giáo viên đã gán
                </div>
                <h2 className="text-2xl font-black text-[var(--kid-ink)]">{assignedPath.title}</h2>
                {assignedPath.description && (
                  <p className="kid-readable mt-1 text-[var(--kid-muted)]">{assignedPath.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-extrabold">
                  {assignedStudent?.class_name && (
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-800">Lớp {assignedStudent.class_name}</span>
                  )}
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                    {assignedPath.step_count} bước học
                  </span>
                  <span className="rounded-full bg-pink-50 px-3 py-1 text-pink-700">
                    Cá nhân hóa cho {assignedStudent?.nickname ?? nickname}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  sfx.click();
                  onSelectAssigned?.();
                }}
                className="btn-kid btn-kid-teal shrink-0"
              >
                Bắt đầu lộ trình của em
              </button>
            </div>
          </section>
        )}

        {showDailyQuiz && (
          <div className="mb-7">
            <section className="kid-sticker-card border-[var(--kid-yellow-new)]/70 bg-gradient-to-r from-amber-50 to-cyan-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center rounded-full bg-[var(--kid-yellow-new)]/45 px-3 py-1 text-sm font-black text-amber-800">
                    🔥 Streak mỗi ngày
                  </div>
                  <h2 className="text-2xl font-black text-[var(--kid-ink)]">Làm 5 câu hôm nay</h2>
                  <p className="kid-readable mt-1 text-[var(--kid-muted)]">
                    Trả lời 5 câu ngẫu nhiên để giữ chuỗi học và cộng XP tích lũy.
                  </p>
                </div>
                <button
                  onClick={() => {
                    sfx.click();
                    onOpenDailyQuiz?.();
                  }}
                  className="btn-kid btn-kid-yellow shrink-0"
                >
                  🎯 Vào thử thách
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Path cards */}
        {paths.length > 0 && (
          <div className="mb-4 text-center text-base font-black text-[var(--kid-muted)]">
            {assignedPath ? "Hoặc khám phá thêm lộ trình khác" : "Các lộ trình có sẵn"}
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          {paths.map((path, index) => {
            const style = PATH_COLORS[path.title] || DEFAULT_STYLE;
            const icon = PATH_ICONS[path.title] || "📘";
            const isSelected = selected === path.id;
            const tiltClass = index % 2 === 0 ? "sm:-rotate-1" : "sm:rotate-1";

            return (
              <button
                key={path.id}
                onClick={() => handleSelect(path)}
                disabled={selected !== null}
                className={`group relative min-h-[210px] text-left rounded-[28px] p-6 border-[3px] shadow-[var(--kid-sticker-shadow)] transition-all duration-300 ${tiltClass} ${
                  isSelected
                    ? `${style.bg} ${style.border} scale-[1.03] ring-4 ring-offset-2 ring-[var(--kid-teal-new)]`
                    : "bg-[var(--kid-paper)] border-slate-200 hover:border-[var(--kid-coral-new)] hover:shadow-lg hover:scale-[1.02]"
                } ${selected !== null && !isSelected ? "opacity-50 pointer-events-none" : ""}`}
              >
                {/* Icon circle */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-3xl shadow-md mb-4 group-hover:scale-110 transition`}
                >
                  {icon}
                </div>

                {/* Title */}
                <h3 className={`text-xl font-black ${style.text} mb-2`}>
                  {path.title}
                </h3>

                {/* Description */}
                <p className="kid-readable text-[var(--kid-muted)] mb-4 line-clamp-3">
                  {path.description}
                </p>

                {/* Topics count */}
                <div className="flex items-center gap-2 text-base font-extrabold text-slate-500">
                  <span>📚</span>
                  <span>{path.topic_ids.length} chủ đề</span>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg shadow-md animate-bounce">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Back button */}
        <div className="text-center mt-8 pb-6">
          <button
            onClick={() => {
              sfx.click();
              onBack();
            }}
            className="btn-kid bg-white text-[var(--kid-muted)] border-slate-200 hover:border-[var(--kid-coral-new)]"
          >
            ← Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
