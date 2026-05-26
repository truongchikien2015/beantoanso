import { useMemo } from "react";
import { RobotGuide } from "./RobotGuide";
import { sfx } from "../lib/sound";

type Props = {
  topics: any[];
  results: Record<string, { score: number; correct: boolean }>;
  onPickMission: (id: string) => void;
  onGoQuiz: () => void;
};

const QUIZ_POS = { x: 970, y: 200 };

const generateNodes = (count: number) => {
  const nodes = [];
  const startX = 130;
  const endX = 870;
  const stepX = count > 1 ? (endX - startX) / (count - 1) : 0;
  const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#facc15", "#4ade80"];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: startX + stepX * i,
      y: i % 2 === 0 ? 420 : 200,
      color: colors[i % colors.length]
    });
  }
  return nodes;
};

const generatePath = (nodes: {x: number, y: number}[], quizPos: {x: number, y: number}) => {
  if (nodes.length === 0) return "";
  let d = `M ${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i-1];
    const curr = nodes[i];
    const ctrlX = prev.x + (curr.x - prev.x) / 2;
    d += ` C ${ctrlX} ${prev.y} ${ctrlX} ${curr.y} ${curr.x} ${curr.y}`;
  }
  const last = nodes[nodes.length - 1];
  const ctrlX = last.x + (quizPos.x - last.x) / 2;
  d += ` C ${ctrlX} ${last.y} ${ctrlX} ${quizPos.y} ${quizPos.x} ${quizPos.y}`;
  return d;
};

export function JourneyMap({ topics, results, onPickMission, onGoQuiz }: Props) {
  const completedCount = Object.keys(results).length;
  const allDone = completedCount >= topics.length && topics.length > 0;
  const progress = topics.length > 0 ? (completedCount / topics.length) * 100 : 0;

  const nextStageIndex = topics.findIndex((m) => !results[m.id]);
  const activeIndex = nextStageIndex === -1 ? topics.length : nextStageIndex;

  const nodePos = useMemo(() => generateNodes(topics.length), [topics.length]);
  const pathD = useMemo(() => generatePath(nodePos, QUIZ_POS), [nodePos]);

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4">
      {/* Top bar */}
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="flex justify-between mb-1 text-slate-700">
            <span>📍 Tiến độ hành trình</span>
            <span>
              {completedCount}/{topics.length}
            </span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => {
            sfx.click();
            if (allDone) onGoQuiz();
          }}
          disabled={!allDone}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition"
        >
          🏰 Vào quiz cuối
        </button>
      </div>

      {/* Map board */}
      <div
        className="relative w-full rounded-3xl overflow-hidden shadow-xl border-4 border-white"
        style={{ aspectRatio: "1000 / 560", minHeight: 360 }}
      >
        <Scenery />

        {topics.length > 0 && (
          <svg
            viewBox="0 0 1000 560"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Path shadow */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(15,23,42,0.15)"
              strokeWidth="22"
              strokeLinecap="round"
            />
            {/* Path base */}
            <path
              d={pathD}
              fill="none"
              stroke="#fde68a"
              strokeWidth="18"
              strokeLinecap="round"
            />
            {/* Dashed center line */}
            <path
              d={pathD}
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeDasharray="8 12"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Stage nodes */}
        {topics.map((m, idx) => {
          const pos = nodePos[idx];
          const done = !!results[m.id];
          const isCurrent = !done && idx === activeIndex;
          return (
            <StageNode
              key={m.id}
              x={pos.x}
              y={pos.y}
              color={pos.color}
              number={idx + 1}
              icon={m.icon}
              title={m.label}
              done={done}
              current={isCurrent}
              score={results[m.id]?.score}
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
          onClick={() => {
            if (!allDone) {
              sfx.wrong();
              return;
            }
            sfx.click();
            onGoQuiz();
          }}
        />

        {/* Bé Kiên avatar at next stage */}
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
                : nodePos[activeIndex]?.y ?? nodePos[0].y) - 70
            }
          />
        )}

        {/* Robot guide */}
        <div className="absolute left-2 sm:left-4 bottom-2 sm:bottom-4 max-w-[60%] sm:max-w-[40%] hidden sm:block">
          <RobotGuide
            message={
              allDone
                ? "Tuyệt vời! Bấm vào lâu đài để vào quiz cuối nhé!"
                : `Đi đến trạm số ${activeIndex + 1} nào!`
            }
          />
        </div>
      </div>

      {/* Mobile guide */}
      <div className="sm:hidden mt-3">
        <RobotGuide
          message={
            allDone
              ? `Hoàn thành ${topics.length} trạm! Vào quiz cuối thôi!`
              : `Đi đến trạm số ${activeIndex + 1} nào!`
          }
        />
      </div>

      {/* Stage list (mobile-friendly fallback) */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {topics.map((m, idx) => {
          const result = results[m.id];
          const done = !!result;
          return (
            <button
              key={m.id}
              onClick={() => {
                sfx.click();
                onPickMission(m.id);
              }}
              className={`text-left rounded-2xl p-3 shadow border-2 transition hover:shadow-md ${
                done
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-white border-sky-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow"
                  style={{ background: nodePos[idx]?.color }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-slate-500">Chặng {idx + 1}</p>
                  <p className="text-slate-800">
                    {m.icon} {m.label}
                  </p>
                </div>
                {done && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    ✅ {result.score}
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
  color,
  number,
  icon,
  title,
  done,
  current,
  score,
  onClick,
}: {
  x: number;
  y: number;
  color: string;
  number: number;
  icon: string;
  title: string;
  done: boolean;
  current: boolean;
  score?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 560) * 100}%` }}
    >
      <div className="relative">
        {/* Pulse for current */}
        {current && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: color, opacity: 0.4 }}
          />
        )}
        {/* Outer ring */}
        <div
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white flex items-center justify-center shadow-xl transition-transform group-hover:scale-110"
          style={{ background: color }}
        >
          <div className="text-white text-center leading-tight">
            <div>{icon}</div>
            <div className="text-[10px] sm:text-xs">#{number}</div>
          </div>
          {done && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs shadow">
              ✓
            </span>
          )}
        </div>
        {/* Tooltip card */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-lg bg-white shadow-md border border-slate-200 whitespace-nowrap text-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition">
          {title}
          {done && score !== undefined && (
            <span className="ml-1 text-amber-600">⭐ {score}</span>
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
  onClick,
}: {
  x: number;
  y: number;
  unlocked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 560) * 100}%` }}
      title={unlocked ? "Vào bài kiểm tra cuối" : "Hoàn thành 5 trạm để mở khóa"}
    >
      <div className="relative">
        {unlocked && (
          <span className="absolute inset-0 rounded-full bg-amber-300 opacity-50 blur-xl animate-pulse" />
        )}
        <div
          className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 ${
            unlocked
              ? "bg-gradient-to-br from-amber-300 to-orange-500"
              : "bg-gradient-to-br from-slate-400 to-slate-600 grayscale"
          }`}
        >
          <span className="text-4xl sm:text-5xl">{unlocked ? "🏰" : "🔒"}</span>
        </div>
        <p className="absolute left-1/2 -translate-x-1/2 -bottom-6 text-white drop-shadow whitespace-nowrap">
          Bài kiểm tra cuối
        </p>
      </div>
    </button>
  );
}

function PlayerMarker({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 560) * 100}%` }}
    >
      <div className="relative animate-bounce">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 border-2 border-white flex items-center justify-center shadow-lg">
          <span className="text-2xl sm:text-3xl">👧</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-3 h-3 bg-rose-500 rotate-45" />
      </div>
    </div>
  );
}

function Scenery() {
  return (
    <svg
      viewBox="0 0 1000 560"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="60%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
        <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="1000" height="560" fill="url(#sky)" />

      {/* Sun */}
      <circle cx="850" cy="80" r="120" fill="url(#sun)" />
      <circle cx="850" cy="80" r="40" fill="#fde047" />

      {/* Clouds */}
      <Cloud x={120} y={70} scale={1} />
      <Cloud x={420} y={50} scale={0.8} />
      <Cloud x={680} y={100} scale={0.9} />

      {/* Far hills */}
      <path
        d="M 0 360 Q 200 280 400 340 T 800 320 T 1000 340 L 1000 560 L 0 560 Z"
        fill="url(#hill2)"
        opacity="0.85"
      />
      {/* Near hills */}
      <path
        d="M 0 440 Q 150 380 300 420 T 600 410 T 1000 430 L 1000 560 L 0 560 Z"
        fill="url(#hill1)"
      />

      {/* Trees */}
      <Tree x={60} y={400} />
      <Tree x={250} y={340} scale={0.8} />
      <Tree x={460} y={320} scale={0.9} />
      <Tree x={620} y={350} scale={0.7} />
      <Tree x={780} y={310} />
      <Tree x={950} y={350} scale={0.9} />

      {/* House */}
      <House x={50} y={300} />
      {/* School */}
      <School x={420} y={260} />
      {/* Computer station */}
      <Computer x={620} y={250} />
    </svg>
  );
}

function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.9">
      <ellipse cx="0" cy="0" rx="40" ry="18" fill="#fff" />
      <ellipse cx="30" cy="-8" rx="28" ry="20" fill="#fff" />
      <ellipse cx="60" cy="2" rx="32" ry="16" fill="#fff" />
    </g>
  );
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-5" y="0" width="10" height="22" fill="#92400e" rx="2" />
      <circle cx="0" cy="-10" r="22" fill="#16a34a" />
      <circle cx="-12" cy="-2" r="14" fill="#22c55e" />
      <circle cx="12" cy="-2" r="14" fill="#22c55e" />
    </g>
  );
}

function House({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,30 30,0 60,30" fill="#ef4444" />
      <rect x="6" y="30" width="48" height="40" fill="#fed7aa" />
      <rect x="22" y="46" width="16" height="24" fill="#7c2d12" />
      <rect x="42" y="40" width="10" height="10" fill="#fde68a" />
    </g>
  );
}

function School({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="20" width="80" height="50" fill="#fef3c7" stroke="#92400e" />
      <rect x="30" y="40" width="20" height="30" fill="#92400e" />
      <rect x="8" y="28" width="14" height="10" fill="#60a5fa" />
      <rect x="58" y="28" width="14" height="10" fill="#60a5fa" />
      <polygon points="-4,20 40,0 84,20" fill="#dc2626" />
      <rect x="38" y="-8" width="4" height="14" fill="#92400e" />
      <polygon points="42,-8 56,-2 42,4" fill="#fbbf24" />
    </g>
  );
}

function Computer({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="56" height="38" rx="4" fill="#1f2937" />
      <rect x="4" y="4" width="48" height="28" fill="#38bdf8" />
      <rect x="22" y="38" width="12" height="8" fill="#475569" />
      <rect x="10" y="46" width="36" height="4" rx="2" fill="#475569" />
      <text
        x="28"
        y="22"
        textAnchor="middle"
        fontSize="14"
        fill="#fff"
        fontFamily="monospace"
      >
        @
      </text>
    </g>
  );
}
