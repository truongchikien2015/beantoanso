import { getBadge } from "../data/gameData";

type Props = {
  nickname: string;
  totalScore: number;
  onBack: () => void;
};

export function Certificate({ nickname, totalScore, onBack }: Props) {
  const badge = getBadge(totalScore);
  const today = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const certId = `BATS-${Math.abs(
    Array.from(nickname).reduce((a, c) => a + c.charCodeAt(0), 0) * 7 +
      Date.now() % 100000,
  )
    .toString(36)
    .toUpperCase()
    .slice(0, 10)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 print:p-0 print:max-w-none">
      <div className="flex justify-between mb-4 print:hidden">
        <button onClick={onBack} className="text-indigo-600 hover:underline">
          ← Quay lại
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          🖨️ In chứng nhận
        </button>
      </div>

      <div
        id="certificate"
        className="relative bg-white aspect-[1.55/1] w-full overflow-hidden shadow-2xl print:shadow-none print:aspect-auto"
        style={{
          boxShadow:
            "0 20px 50px -10px rgba(15, 76, 92, 0.25), 0 0 0 1px rgba(15, 76, 92, 0.06)",
        }}
      >
        {/* Corner decorations */}
        <CornerShapes />

        {/* Inner content */}
        <div className="relative z-10 h-full flex flex-col items-center px-6 sm:px-16 py-8 sm:py-10 text-center">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <span className="text-xl">🛡️</span>
            </div>
            <div className="text-left leading-tight">
              <p className="tracking-[0.3em] text-slate-500 uppercase">
                Học viện
              </p>
              <p className="text-slate-800 tracking-wide">
                Bé An Toàn Số
              </p>
            </div>
          </div>

          {/* Title */}
          <p className="mt-6 sm:mt-8 tracking-[0.4em] uppercase text-teal-700">
            Chứng nhận hoàn thành
          </p>
          <div className="mt-1 h-[2px] w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Recipient name */}
          <h1
            className="mt-5 sm:mt-7 text-amber-500"
            style={{
              fontFamily:
                "'Brush Script MT', 'Lucida Handwriting', cursive",
              fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
              lineHeight: 1,
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            {nickname}
          </h1>

          {/* Description */}
          <p className="mt-5 sm:mt-7 max-w-2xl text-slate-600 leading-relaxed">
            đã xuất sắc hoàn thành khóa học{" "}
            <span className="text-slate-800">
              Bé An Toàn Số – Sử dụng Internet An Toàn
            </span>
            <br className="hidden sm:block" />
            với danh hiệu{" "}
            <span className="text-amber-600">{badge.title}</span> và{" "}
            <span className="text-amber-600">{totalScore} điểm</span>
          </p>

          <p className="mt-3 text-slate-500">Ngày cấp: {today}</p>

          {/* Footer: signatures + seal */}
          <div className="mt-auto pt-6 sm:pt-8 w-full grid grid-cols-3 items-end gap-4">
            <SignatureBlock
              name="Robot An Toàn"
              title="Giảng viên trưởng"
              accent="text-sky-700"
            />
            <SealBadge emoji={badge.emoji} />
            <SignatureBlock
              name="Bé Kiên"
              title="Đại sứ chương trình"
              accent="text-rose-600"
              align="right"
            />
          </div>
        </div>

        {/* Bottom strip */}
        <div className="absolute left-0 right-0 bottom-0 z-10 px-6 sm:px-10 py-3 flex flex-wrap justify-between gap-2 text-slate-400 border-t border-slate-100 bg-white/70">
          <span>Mã chứng nhận: {certId}</span>
          <span>Xác thực tại: beantoan.so/verify</span>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { background: white; }
          header, .print\\:hidden { display: none !important; }
          #certificate { width: 100vw; height: 100vh; aspect-ratio: auto; }
        }
      `}</style>
    </div>
  );
}

function CornerShapes() {
  return (
    <>
      {/* Top-left teal layered triangles */}
      <svg
        className="absolute top-0 left-0 w-40 sm:w-56 h-40 sm:h-56"
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
      >
        <polygon points="0,0 200,0 0,160" fill="#14b8a6" opacity="0.95" />
        <polygon points="0,0 140,0 0,110" fill="#0f766e" />
        <polygon points="0,0 80,0 0,60" fill="#fbbf24" />
      </svg>

      {/* Top-right gold ribbon/medal */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5">
        <RibbonSeal />
      </div>

      {/* Bottom-right teal layered triangles */}
      <svg
        className="absolute bottom-0 right-0 w-40 sm:w-56 h-40 sm:h-56"
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
      >
        <polygon points="200,200 0,200 200,40" fill="#14b8a6" opacity="0.95" />
        <polygon points="200,200 60,200 200,90" fill="#0f766e" />
        <polygon points="200,200 120,200 200,140" fill="#fbbf24" />
      </svg>

      {/* Bottom-left small accent */}
      <svg
        className="absolute bottom-12 left-0 w-16 h-16"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon points="0,100 0,40 60,100" fill="#fbbf24" opacity="0.85" />
      </svg>
    </>
  );
}

function RibbonSeal() {
  return (
    <div className="relative">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-lg ring-4 ring-amber-200">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-400 border-2 border-amber-600/50 flex items-center justify-center">
          <span className="text-2xl sm:text-3xl">⭐</span>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 top-[80%] flex gap-1">
        <div className="w-3 h-8 sm:h-10 bg-amber-500 [clip-path:polygon(0_0,100%_0,100%_70%,50%_100%,0_70%)]" />
        <div className="w-3 h-8 sm:h-10 bg-amber-600 [clip-path:polygon(0_0,100%_0,100%_70%,50%_100%,0_70%)]" />
      </div>
    </div>
  );
}

function SignatureBlock({
  name,
  title,
  accent,
  align = "left",
}: {
  name: string;
  title: string;
  accent: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p
        className={accent}
        style={{
          fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
          fontSize: "clamp(1.1rem, 2vw, 1.6rem)",
          lineHeight: 1,
        }}
      >
        {name}
      </p>
      <div className="my-1 h-px bg-slate-300" />
      <p className="text-slate-600">{title}</p>
    </div>
  );
}

function SealBadge({ emoji }: { emoji: string }) {
  return (
    <div className="flex justify-center">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-white border-2 border-slate-300 shadow-inner">
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed border-slate-300"
          style={{ transform: "scale(0.85)" }}
        />
        <div className="absolute inset-0 rounded-full border border-slate-200" />
        <span className="text-2xl sm:text-3xl">{emoji}</span>
      </div>
    </div>
  );
}
