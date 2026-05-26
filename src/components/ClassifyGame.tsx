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
      <button onClick={onBack} className="text-indigo-600 hover:underline mb-4">
        ← Trang chủ
      </button>

      <div className="text-center mb-4">
        <h2 className="text-indigo-700">🧩 Phân loại thông tin</h2>
        <p className="text-slate-600">
          Bấm vào thông tin rồi thả vào hộp phù hợp.
        </p>
        <div className="inline-flex items-center gap-3 mt-2 px-4 py-1 rounded-full bg-amber-100 text-amber-700">
          ⭐ Điểm: {score}
        </div>
        {feedback && (
          <p className="mt-2 text-slate-600">{feedback}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow border border-sky-100 mb-4">
        <p className="text-slate-500 mb-2">Cần phân loại:</p>
        {items.length === 0 ? (
          <p className="text-emerald-600">🎉 Đã phân loại xong!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
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
        />
        <Bucket
          title="🔒 Nên giữ riêng tư"
          accent="rose"
          items={unsafe}
        />
      </div>

      {finished && (
        <div className="mt-6 text-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
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
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-slate-700 hover:bg-sky-100"
      >
        {item.text}
      </button>
      {open && (
        <div className="absolute z-10 left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-md p-1 flex gap-1">
          <button
            onClick={() => {
              setOpen(false);
              onPlace(item, "safe");
            }}
            className="px-2 py-1 rounded-lg hover:bg-emerald-50 text-emerald-700"
          >
            ✅ Chia sẻ
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onPlace(item, "unsafe");
            }}
            className="px-2 py-1 rounded-lg hover:bg-rose-50 text-rose-700"
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
      ? "border-emerald-300 bg-emerald-50"
      : "border-rose-300 bg-rose-50";
  return (
    <div className={`rounded-2xl border-2 border-dashed p-4 min-h-[140px] ${cls}`}>
      <p className="text-slate-700 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i.id}
            className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700"
          >
            {i.text}
          </span>
        ))}
      </div>
    </div>
  );
}
