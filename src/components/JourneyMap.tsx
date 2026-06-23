import { useMemo } from "react";
import { RobotGuide } from "./RobotGuide";
import { sfx } from "../lib/sound";
import { Check, Lock, Play, Flag } from "lucide-react";

type Props = {
  topics: any[];
  results: Record<string, { score: number; correct: boolean }>;
  onPickMission: (id: string) => void;
  onGoQuiz: () => void;
};

const QUIZ_POS = { x: 650, y: 246 };

export function JourneyMap({ topics, results, onPickMission, onGoQuiz }: Props) {
  const completedCount = Object.keys(results).length;
  const allDone = completedCount >= topics.length && topics.length > 0;
  const progress = topics.length > 0 ? (completedCount / topics.length) * 100 : 0;

  const nextStageIndex = topics.findIndex((m) => !results[m.id]);
  const activeIndex = nextStageIndex === -1 ? topics.length : nextStageIndex;

  const nodePos = useMemo(() => {
    // Custom coordinates tailored for the beautiful adventure_map_bg.png road
    const fixedPos = [
      { x: 240, y: 476, color: "#FF6B6B" }, // Chặng 1
      { x: 360, y: 403, color: "#FFE66D" }, // Chặng 2
      { x: 500, y: 375, color: "#4ECDC4" }, // Chặng 3
      { x: 630, y: 342, color: "#A06CD5" }, // Chặng 4
      { x: 540, y: 297, color: "#FF8E53" }, // Chặng 5
      { x: 520, y: 263, color: "#FF6B8B" }, // Chặng 6
    ];
    if (topics.length === 6) return fixedPos;
    
    // Fallback: generate programmatically if length differs
    const nodes = [];
    const startX = 130;
    const endX = 870;
    const stepX = topics.length > 1 ? (endX - startX) / (topics.length - 1) : 0;
    const colors = ["#FF6B6B", "#FFE66D", "#4ECDC4", "#A06CD5", "#FF8E53", "#FF6B8B"];
    for (let i = 0; i < topics.length; i++) {
      nodes.push({
        x: startX + stepX * i,
        y: i % 2 === 0 ? 420 : 200,
        color: colors[i % colors.length],
      });
    }
    return nodes;
  }, [topics.length]);

  const handleStartActiveLesson = () => {
    sfx.click();
    if (allDone) {
      onGoQuiz();
    } else {
      const activeTopic = topics[activeIndex];
      if (activeTopic) {
        onPickMission(activeTopic.id);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-slate-50/50 rounded-[32px] shadow-sm border border-slate-100 mt-4">
      {/* Title and Progress Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
              <Flag className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Tiến độ hành trình
            </h1>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 shadow-inner">
              {completedCount}/{topics.length} chặng hoàn thành
            </span>
          </div>
          
          {/* Progress track */}
          <div className="relative w-full max-w-lg h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleStartActiveLesson}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-extrabold text-sm shadow-[0_4px_14px_rgba(107,70,193,0.3)] hover:shadow-[0_6px_20px_rgba(107,70,193,0.4)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current stroke-[3]" />
          Vào bài học ngay
        </button>
      </div>

      {/* Map board container */}
      <div
        className="relative w-full rounded-[32px] overflow-hidden shadow-xl border-4 border-white bg-slate-100"
        style={{ aspectRatio: "1000 / 560", minHeight: 360 }}
      >
        {/* Background image */}
        <img
          src="/images/adventure_map_bg.png"
          alt="Bản đồ hành trình"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Stage nodes */}
        {topics.map((m, idx) => {
          const pos = nodePos[idx] || { x: 100, y: 100 };
          const done = !!results[m.id];
          const isCurrent = !done && idx === activeIndex;
          // Perspective scale calculation: items further up (smaller Y) are smaller
          const scale = pos.y ? Math.max(0.7, Math.min(1.0, 0.7 + (pos.y - 200) / 400)) : 1.0;

          return (
            <StageNode
              key={m.id}
              x={pos.x}
              y={pos.y}
              number={idx + 1}
              icon={m.icon}
              title={m.label.replace("phồng cháy", "phòng cháy")}
              done={done}
              current={isCurrent}
              score={results[m.id]?.score}
              scale={scale}
              onClick={() => {
                sfx.click();
                onPickMission(m.id);
              }}
            />
          );
        })}

        {/* Final assessment castle node */}
        <CastleNode
          x={QUIZ_POS.x}
          y={QUIZ_POS.y}
          unlocked={allDone}
          scale={0.8}
          onClick={() => {
            if (!allDone) {
              sfx.wrong();
              return;
            }
            sfx.click();
            onGoQuiz();
          }}
        />

        {/* Player avatar bouncing */}
        {topics.length > 0 && (
          <PlayerMarker
            x={
              allDone
                ? QUIZ_POS.x
                : nodePos[activeIndex]?.x ?? nodePos[0].x
            }
            y={
              (allDone
                ? QUIZ_POS.y
                : nodePos[activeIndex]?.y ?? nodePos[0].y) - 52
            }
          />
        )}

        {/* Robot guide balloon inside map (Desktop/Tablet) */}
        <div className="absolute left-4 bottom-4 max-w-[50%] md:max-w-[40%] hidden sm:block z-10">
          <RobotGuide
            message={
              allDone
                ? "Tuyệt vời! Bấm vào lâu đài để làm quiz cuối nhé!"
                : `Chào mừng trở lại! Hãy tiếp tục Chặng ${activeIndex + 1} nhé!`
            }
          />
        </div>
      </div>

      {/* Mobile robot guide */}
      <div className="sm:hidden mt-4">
        <RobotGuide
          message={
            allDone
              ? `Hoàn thành ${topics.length} trạm! Vào quiz cuối thôi!`
              : `Chào mừng trở lại! Hãy tiếp tục Chặng ${activeIndex + 1} nhé!`
          }
        />
      </div>

      {/* Stage details list */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {topics.map((m, idx) => {
          const result = results[m.id];
          const done = !!result;
          const isCurrent = !done && idx === activeIndex;
          const isLocked = !done && idx > activeIndex;

          if (isCurrent) {
            return (
              <button
                key={m.id}
                onClick={() => {
                  sfx.click();
                  onPickMission(m.id);
                }}
                className="relative text-left rounded-2xl p-4 bg-blue-600 text-white shadow-lg border-2 border-blue-500 transform hover:-translate-y-1 transition duration-200 active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-lg shadow-md">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-purple-700/50 text-white">
                        Đang học
                      </span>
                    </div>
                    <p className="text-blue-100 text-xs font-semibold mt-0.5">Chặng {idx + 1}</p>
                    <p className="font-extrabold text-base leading-snug">
                      {m.icon} {m.label.replace("phồng cháy", "phòng cháy")}
                    </p>
                  </div>
                </div>
              </button>
            );
          }

          if (isLocked) {
            return (
              <div
                key={m.id}
                className="text-left rounded-2xl p-4 bg-slate-100 border border-slate-200 opacity-70 flex items-center gap-3 select-none"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shadow-inner">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 text-xs font-medium">Chặng {idx + 1}</p>
                  <p className="text-slate-500 font-semibold text-sm leading-snug">
                    {m.label.replace("phồng cháy", "phòng cháy")}
                  </p>
                </div>
              </div>
            );
          }

          // Completed Stage
          return (
            <button
              key={m.id}
              onClick={() => {
                sfx.click();
                onPickMission(m.id);
              }}
              className="text-left rounded-2xl p-4 bg-slate-50/80 hover:bg-slate-50 border border-blue-100 hover:border-blue-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition duration-200 active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div className="flex-1">
                  <p className="text-blue-600 text-xs font-bold">Chặng {idx + 1} • Đã hoàn thành</p>
                  <p className="text-slate-800 font-extrabold text-sm leading-snug">
                    {m.icon} {m.label.replace("phồng cháy", "phòng cháy")}
                  </p>
                </div>
                {result && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                    ⭐ {result.score}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StageNode({
  x,
  y,
  number,
  icon,
  title,
  done,
  current,
  score,
  scale = 1.0,
  onClick,
}: {
  x: number;
  y: number;
  number: number;
  icon: string;
  title: string;
  done: boolean;
  current: boolean;
  score?: number;
  scale?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!done && !current}
      className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform active:scale-95 duration-200 ${
        !done && !current ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{
        left: `${(x / 1000) * 100}%`,
        top: `${(y / 560) * 100}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <div className="relative">
        {current && (
          <span
            className="absolute inset-0 rounded-full animate-ping bg-blue-500 opacity-60"
            style={{ margin: "-4px" }}
          />
        )}

        {done ? (
          /* Completed: green check badge */
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 border-white bg-emerald-500 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
            <Check className="w-6 h-6 stroke-[3.5]" />
          </div>
        ) : current ? (
          /* Current / Active: blue circle with active icon and indicator */
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <span className="text-xl sm:text-2xl">{icon}</span>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-purple-600 text-[10px] font-bold border border-white text-white shadow">
              #{number}
            </span>
          </div>
        ) : (
          /* Locked: gray circle with lock icon */
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-white bg-slate-300 text-slate-500 flex items-center justify-center shadow-md opacity-85">
            <Lock className="w-4 h-4" />
          </div>
        )}

        {/* Tooltip Card */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-lg border border-slate-700/50 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition duration-200 z-30">
          Chặng {number}: {title}
          {done && score !== undefined && (
            <span className="ml-1.5 text-amber-300">⭐ {score} điểm</span>
          )}
        </div>
      </div>
    </button>
  );
}

function CastleNode({
  x,
  y,
  unlocked,
  scale = 1.0,
  onClick,
}: {
  x: number;
  y: number;
  unlocked: boolean;
  scale?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform active:scale-95 duration-200 ${
        unlocked ? "cursor-pointer" : "cursor-not-allowed"
      }`}
      style={{
        left: `${(x / 1000) * 100}%`,
        top: `${(y / 560) * 100}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
      title={unlocked ? "Vào bài kiểm tra cuối" : "Hoàn thành tất cả các chặng để mở khóa lâu đài"}
    >
      <div className="relative">
        {unlocked && (
          <span className="absolute inset-0 rounded-full bg-amber-400 opacity-40 blur-xl animate-pulse" />
        )}
        <div
          className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl border-4 border-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105 ${
            unlocked
              ? "bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-white"
              : "bg-slate-300 text-slate-500 opacity-80"
          }`}
        >
          {unlocked ? (
            <span className="text-4xl sm:text-5xl animate-bounce">🏰</span>
          ) : (
            <Lock className="w-8 h-8" />
          )}
        </div>
        <p className={`absolute left-1/2 -translate-x-1/2 -bottom-6 text-xs font-bold drop-shadow whitespace-nowrap px-2 py-0.5 rounded-full ${
          unlocked ? "bg-amber-500 text-white shadow" : "bg-slate-500 text-slate-100"
        }`}>
          Kiểm tra cuối
        </p>
      </div>
    </button>
  );
}

function PlayerMarker({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-1000 ease-in-out z-20"
      style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 560) * 100}%` }}
    >
      <div className="relative animate-bounce">
        <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 border-3 border-white flex items-center justify-center shadow-2xl">
          <span className="text-2xl sm:text-3xl">👦</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-3 bg-blue-500 rotate-45 border-r border-b border-white" />
      </div>
    </div>
  );
}

