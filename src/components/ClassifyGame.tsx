import { useMemo, useState } from "react";
import { sfx } from "../lib/sound";

type Item = { id: string; text: string; safe: boolean };

const POOL: Item[] = [
  { id: "a", text: "Địa chỉ nhà em", safe: false },
  { id: "b", text: "Số điện thoại bố mẹ", safe: false },
  { id: "c", text: "Ảnh thẻ học sinh", safe: false },
  { id: "d", text: "Mật khẩu Facebook", safe: false },
  { id: "e", text: "Tên trường + lớp đầy đủ", safe: false },
  { id: "f", text: "Số CCCD/CMND", safe: false },
  { id: "g", text: "Vị trí thời gian thực", safe: false },
  { id: "h", text: "Màu yêu thích", safe: true },
  { id: "i", text: "Bộ phim em vừa xem", safe: true },
  { id: "j", text: "Bài vẽ em mới hoàn thành", safe: true },
  { id: "k", text: "Thú cưng (không lộ địa điểm)", safe: true },
  { id: "l", text: "Món ăn ngon em đã thử", safe: true },
  { id: "m", text: "Sở thích đọc sách", safe: true },
  { id: "n", text: "Lời chúc bạn bè", safe: true },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ClassifyGame({ onBack }: { onBack: () => void }) {
  const initial = useMemo(() => shuffle(POOL).slice(0, 10), []);
  const [items, setItems] = useState<Item[]>(initial);
  const [safe, setSafe] = useState<Item[]>([]);
  const [unsafe, setUnsafe] = useState<Item[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string>("");

  const place = (item: Item, target: "safe" | "unsafe") => {
    setItems((prev) => prev.filter((p) => p.id !== item.id));
    const correct = (target === "safe") === item.safe;
    if (correct) {
      sfx.correct();
      setScore((s) => s + 10);
      setFeedback("✅ Chính xác! Bạn nhỏ trả lời rất tốt.");
    } else {
      sfx.wrong();
      setScore((s) => Math.max(0, s - 5));
      setFeedback(
        item.safe
          ? "❌ Chưa đúng rồi! Món này có thể chia sẻ bình thường."
          : "❌ Ôi nguy hiểm! Thông tin này nên giữ riêng tư!",
      );
    }
    if (target === "safe") setSafe((p) => [...p, item]);
    else setUnsafe((p) => [...p, item]);
  };

  const finished = items.length === 0;

  const reset = () => {
    setItems(shuffle(POOL).slice(0, 10));
    setSafe([]);
    setUnsafe([]);
    setScore(0);
    setFeedback("");
  };

  return (
    <div className="kid-paper-page min-h-screen pb-12">
      {/* Header */}
      <header className="kid-paper-header px-4 py-5 mb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="min-h-12 text-white/85 hover:text-white font-bold text-sm flex items-center gap-1"
          >
            ← Trang chủ
          </button>
          <h1 className="font-black text-white text-lg flex items-center gap-2">
            🧩 Trò chơi Phân loại
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="text-center mb-4 animate-bounce-in">
          <h2 className="text-3xl font-black text-[var(--kid-ink)]">🧩 Thử tài Phân Loại</h2>
          <p className="text-[var(--kid-muted)] font-bold mt-1">
            Bấm vào từng thẻ thông tin bên dưới rồi chọn hộp thả thích hợp nhé!
          </p>
          <div className="inline-flex items-center gap-3 mt-4 px-5 py-2 rounded-full bg-[var(--kid-yellow-new)]/30 text-amber-800 font-black text-lg shadow-sm">
            ⭐ Điểm: {score}
          </div>
          {feedback && (
            <p className={`mt-3 font-black text-base transition-all ${feedback.startsWith("✅") ? "text-[var(--kid-success)] animate-bounce" : "text-[var(--kid-coral-new)] animate-shake"}`}>{feedback}</p>
          )}
        </div>

        <div className="card-kid p-6 bg-white animate-fade-up">
          <p className="text-slate-400 font-bold mb-3 uppercase tracking-wider text-xs">Cần phân loại:</p>
          {items.length === 0 ? (
            <p className="text-[var(--kid-success)] font-black text-lg text-center py-4">🎉 Bạn đã phân loại xuất sắc toàn bộ thông tin!</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {items.map((it) => (
                <ItemChip key={it.id} item={it} onPlace={place} />
              ))}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 animate-fade-up delay-100">
          <Bucket
            title="✅ Có thể chia sẻ"
            accent="emerald"
            items={safe}
          />
          <Bucket
            title="🔒 Nên giữ riêng tư"
            accent="rose"
            items={unsafe}
          />
        </div>

        {finished && (
          <div className="mt-8 text-center animate-bounce-in">
            <button
              onClick={reset}
              className="btn-kid btn-kid-coral px-8 py-3 text-lg"
            >
              🔄 Chơi lại
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function ItemChip({
  item,
  onPlace,
}: {
  item: Item;
  onPlace: (i: Item, t: "safe" | "unsafe") => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => {
          sfx.click();
          setOpen((o) => !o);
        }}
        className={`px-4 py-3 rounded-2xl border-2 font-black text-base shadow-sm transition-all
          ${open 
            ? "border-[var(--kid-coral-new)] bg-[var(--kid-coral-new)]/10 text-slate-800 scale-105" 
            : "border-sky-100 bg-sky-50/50 text-slate-700 hover:border-[var(--kid-coral-new)]/50 hover:bg-white"}`}
      >
        {item.text}
      </button>
      {open && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-lg p-2 flex gap-2 animate-bounce-in min-w-[200px] justify-center">
          <button
            onClick={() => {
              setOpen(false);
              onPlace(item, "safe");
            }}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm transition-colors"
          >
            ✅ Chia sẻ
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onPlace(item, "unsafe");
            }}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm transition-colors"
          >
            🔒 Riêng tư
          </button>
        </div>
      )}
    </div>
  );
}

function Bucket({
  title,
  accent,
  items,
}: {
  title: string;
  accent: "emerald" | "rose";
  items: Item[];
}) {
  const cls =
    accent === "emerald"
      ? "border-[var(--kid-success)] bg-[var(--kid-success)]/5 text-[var(--kid-success)]"
      : "border-[var(--kid-coral-new)] bg-[var(--kid-coral-new)]/5 text-[var(--kid-coral-new)]";
  return (
    <div className={`card-kid border-3 border-dashed p-5 min-h-[200px] ${cls}`}>
      <p className="font-black text-lg mb-4">{title}</p>
      <div className="flex flex-wrap gap-2.5">
        {items.length === 0 ? (
          <p className="text-slate-400 font-bold text-sm italic">Hộp đang trống...</p>
        ) : (
          items.map((i) => (
            <span
              key={i.id}
              className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-100 text-slate-700 font-bold text-sm shadow-sm"
            >
              {i.text}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
