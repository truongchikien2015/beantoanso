import { useEffect, useMemo, useState } from "react";
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
  const [items, setItems] = useState<Item[]>([]);
  const [mounted, setMounted] = useState(false);
  const [safe, setSafe] = useState<Item[]>([]);
  const [unsafe, setUnsafe] = useState<Item[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    setItems(shuffle(POOL).slice(0, 10));
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const place = (item: Item, target: "safe" | "unsafe") => {
    setItems((prev) => prev.filter((p) => p.id !== item.id));
    const correct = (target === "safe") === item.safe;
    if (correct) {
      sfx.correct();
      setScore((s) => s + 10);
      setFeedback("✅ Chính xác!");
    } else {
      sfx.wrong();
      setScore((s) => Math.max(0, s - 5));
      setFeedback(
        item.safe
          ? "❌ Thông tin này có thể chia sẻ bình thường."
          : "❌ Thông tin này nên giữ riêng tư!",
      );
    }
    if (target === "safe") setSafe((p) => [...p, item]);
    else setUnsafe((p) => [...p, item]);
  };

  const handleDrop = (itemId: string, target: "safe" | "unsafe") => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      place(item, target);
    }
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={onBack} className="text-indigo-600 hover:underline mb-4 cursor-pointer font-bold">
        ← Trang chủ
      </button>

      <div className="text-center mb-4">
        <h2 className="text-indigo-700 font-black text-2xl">🧩 Phân loại thông tin</h2>
        <p className="text-slate-600 font-medium mt-1">
          Kéo thả thông tin vào hộp phù hợp hoặc bấm trực tiếp để chọn.
        </p>
        <div className="inline-flex items-center gap-3 mt-3 px-4 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">
          ⭐ Điểm: {score}
        </div>
        {feedback && (
          <p className="mt-2 font-bold text-indigo-900 bg-indigo-50 inline-block px-4 py-1 rounded-full border border-indigo-100">{feedback}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow border border-sky-100 mb-6">
        <p className="text-slate-500 mb-3 font-bold">Cần phân loại:</p>
        {items.length === 0 ? (
          <p className="text-emerald-600 font-black text-center text-lg py-4">🎉 Đã phân loại xong!</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {items.map((it) => (
              <ItemChip key={it.id} item={it} onPlace={place} />
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Bucket
          title="✅ Có thể chia sẻ"
          accent="emerald"
          items={safe}
          onDropItem={(id) => handleDrop(id, "safe")}
        />
        <Bucket
          title="🔒 Nên giữ riêng tư"
          accent="rose"
          items={unsafe}
          onDropItem={(id) => handleDrop(id, "unsafe")}
        />
      </div>

      {finished && (
        <div className="mt-6 text-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            🔄 Chơi lại
          </button>
        </div>
      )}
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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("itemId", item.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="relative cursor-grab active:cursor-grabbing hover:scale-[1.03] transition-all"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-slate-700 hover:bg-sky-100 font-bold transition shadow-sm"
      >
        {item.text}
      </button>
      {open && (
        <div className="absolute z-10 left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-md p-1 flex gap-1 animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => {
              setOpen(false);
              onPlace(item, "safe");
            }}
            className="px-2 py-1 rounded-lg hover:bg-emerald-50 text-emerald-700 font-bold text-xs cursor-pointer"
          >
            ✅ Chia sẻ
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onPlace(item, "unsafe");
            }}
            className="px-2 py-1 rounded-lg hover:bg-rose-50 text-rose-700 font-bold text-xs cursor-pointer"
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
  onDropItem,
}: {
  title: string;
  accent: "emerald" | "rose";
  items: Item[];
  onDropItem: (itemId: string) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const itemId = e.dataTransfer.getData("itemId");
    if (itemId) {
      onDropItem(itemId);
    }
  };

  const cls =
    accent === "emerald"
      ? `${isOver ? "border-emerald-500 bg-emerald-100 scale-[1.01]" : "border-emerald-300 bg-emerald-50"}`
      : `${isOver ? "border-rose-500 bg-rose-100 scale-[1.01]" : "border-rose-300 bg-rose-50"}`;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 border-dashed p-4 min-h-[140px] transition-all duration-200 ${cls}`}
    >
      <p className="text-slate-700 mb-2 font-bold">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i.id}
            className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-bold shadow-sm"
          >
            {i.text}
          </span>
        ))}
      </div>
    </div>
  );
}
