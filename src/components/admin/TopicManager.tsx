import { useState, useEffect } from "react";
import { Admin, CustomTopic } from "../../lib/store";
import { supabase } from "../../lib/supabase";

const mapTopic = (row: any): CustomTopic => ({
  id: row.id,
  slug: row.slug,
  label: row.label,
  icon: row.icon,
  color: row.color,
  order: row.topic_order,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const COLORS = [
  { label: "Indigo", value: "indigo" },
  { label: "Emerald", value: "emerald" },
  { label: "Rose", value: "rose" },
  { label: "Amber", value: "amber" },
  { label: "Sky", value: "sky" },
  { label: "Violet", value: "violet" },
  { label: "Teal", value: "teal" },
  { label: "Orange", value: "orange" },
  { label: "Fuchsia", value: "fuchsia" },
  { label: "Cyan", value: "cyan" },
];

const ICONS = [
  "👤", "🎣", "🔑", "🔒", "🌐", "⏰", "🚫", "📱", "💬", "🔍",
  "🛡️", "⚠️", "📧", "🌐", "🎮", "📸", "🔗", "🗑️", "💰", "💳",
];

const COLOR_BG: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-700",
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
  teal: "bg-teal-100 text-teal-700",
  orange: "bg-orange-100 text-orange-700",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700",
  cyan: "bg-cyan-100 text-cyan-700",
};

type Props = {
  onLogout: () => void;
  onHome: () => void;
};

export function TopicManager({ onLogout, onHome }: Props) {
  const [topics, setTopics] = useState<CustomTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<CustomTopic | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CustomTopic | null>(null);

  const refresh = async () => {
    if (!supabase) return;
    setIsLoading(true);
    const { data, error } = await supabase.from('topics').select('*').order('topic_order', { ascending: true });
    if (error) {
      console.error(error);
    } else if (data) {
      setTopics(data.map(mapTopic));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="text-slate-800 font-medium">Quản lý Chủ đề</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onHome}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm"
            >
              🏠 Trang chủ
            </button>
            <button
              onClick={() => {
                Admin.logout();
                onLogout();
              }}
              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 text-sm">
              Quản lý các chủ đề học tập. Giáo viên có thể tạo, sửa, xóa và sắp xếp thứ tự chủ đề.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          >
            ➕ Thêm chủ đề
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin text-4xl">⏳</div>
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-12 text-center">
            <span className="text-5xl mb-4 block">📚</span>
            <p className="text-slate-500 mb-2">Chưa có chủ đề nào</p>
            <p className="text-slate-400 text-sm mb-4">Tạo chủ đề đầu tiên để bắt đầu</p>
            <button
              onClick={() => setCreating(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              ➕ Tạo chủ đề
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 w-16">#</th>
                  <th className="text-left px-4 py-3">Biểu tượng</th>
                  <th className="text-left px-4 py-3">Tên chủ đề</th>
                  <th className="text-left px-4 py-3">Slug</th>
                  <th className="text-left px-4 py-3">Màu</th>
                  <th className="text-left px-4 py-3">Thứ tự</th>
                  <th className="text-left px-4 py-3">Trạng thái</th>
                  <th className="text-left px-4 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {[...topics]
                  .sort((a, b) => a.order - b.order)
                  .map((t, idx) => (
                    <tr
                      key={t.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-2xl">{t.icon}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-sm ${COLOR_BG[t.color] || "bg-slate-100 text-slate-700"}`}>
                          {t.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-500">{t.slug}</td>
                      <td className="px-4 py-3">
                        <div className={`w-6 h-6 rounded-full ${
                          t.color === "indigo" ? "bg-indigo-500" :
                          t.color === "emerald" ? "bg-emerald-500" :
                          t.color === "rose" ? "bg-rose-500" :
                          t.color === "amber" ? "bg-amber-500" :
                          t.color === "sky" ? "bg-sky-500" :
                          t.color === "violet" ? "bg-violet-500" :
                          t.color === "teal" ? "bg-teal-500" :
                          t.color === "orange" ? "bg-orange-500" :
                          t.color === "fuchsia" ? "bg-fuchsia-500" :
                          "bg-cyan-500"
                        }`} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{t.order}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            if (!supabase) return;
                            const { error } = await supabase.from('topics').update({ is_active: !t.isActive }).eq('id', t.id);
                            if (error) alert("Lỗi: " + error.message);
                            else refresh();
                          }}
                          className={`px-2 py-1 rounded-full text-xs ${
                            t.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {t.isActive ? "● Active" : "○ Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditing(t)}
                            className="px-2 py-1 rounded-md hover:bg-indigo-50 text-indigo-600 text-sm"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => setConfirmDelete(t)}
                            className="px-2 py-1 rounded-md hover:bg-rose-50 text-rose-600 text-sm"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {(creating || editing) && (
        <TopicForm
          initial={editing ?? undefined}
          existingSlugs={topics.map((t) => t.slug)}
          existingOrders={topics.map((t) => t.order)}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={async (data) => {
            if (!supabase) return;
            const dbData = {
              slug: data.slug,
              label: data.label,
              icon: data.icon,
              color: data.color,
              topic_order: data.order,
              is_active: data.isActive
            };

            if (editing) {
              const { error } = await supabase.from('topics').update(dbData).eq('id', editing.id);
              if (error) alert("Lỗi: " + error.message);
            } else {
              const { error } = await supabase.from('topics').insert(dbData);
              if (error) alert("Lỗi: " + error.message);
            }
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Xóa chủ đề?"
          message={`"${confirmDelete.label}" sẽ bị xóa vĩnh viễn.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            if (!supabase) return;
            const { error } = await supabase.from('topics').delete().eq('id', confirmDelete.id);
            if (error) alert("Lỗi: " + error.message);
            setConfirmDelete(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// === Topic Form Modal ===
type FormData = Omit<CustomTopic, "id" | "createdAt" | "updatedAt">;

function TopicForm({
  initial,
  existingSlugs,
  existingOrders,
  onCancel,
  onSave,
}: {
  initial?: CustomTopic;
  existingSlugs: string[];
  existingOrders: number[];
  onCancel: () => void;
  onSave: (data: FormData) => void;
}) {
  const maxOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : 0;

  const [label, setLabel] = useState(initial?.label ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "📚");
  const [color, setColor] = useState(initial?.color ?? "indigo");
  const [order, setOrder] = useState(initial?.order ?? maxOrder + 1);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState("");

  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const handleSave = () => {
    if (!label.trim()) {
      setError("Tên chủ đề không được để trống");
      return;
    }
    if (!initial && existingSlugs.includes(slug)) {
      setError("Slug đã tồn tại, vui lòng đổi tên");
      return;
    }
    onSave({ label: label.trim(), slug, icon, color, order, isActive });
  };

  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">
          {initial ? "✏️ Sửa chủ đề" : "➕ Thêm chủ đề mới"}
        </h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tên chủ đề</label>
          <input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setError("");
            }}
            placeholder="VD: An toàn khi gặp người lạ"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400"
          />
          {slug && (
            <p className="text-xs text-slate-400 mt-1">
              Slug: <span className="font-mono">{slug}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Biểu tượng</label>
          <div className="grid grid-cols-10 gap-1">
            {ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`text-xl p-2 rounded-lg border transition ${
                  icon === ic
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-300"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Màu sắc</label>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
                  color === c.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-300"
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${
                  c.value === "indigo" ? "bg-indigo-500" :
                  c.value === "emerald" ? "bg-emerald-500" :
                  c.value === "rose" ? "bg-rose-500" :
                  c.value === "amber" ? "bg-amber-500" :
                  c.value === "sky" ? "bg-sky-500" :
                  c.value === "violet" ? "bg-violet-500" :
                  c.value === "teal" ? "bg-teal-500" :
                  c.value === "orange" ? "bg-orange-500" :
                  c.value === "fuchsia" ? "bg-fuchsia-500" :
                  "bg-cyan-500"
                }`} />
                <span className="text-xs text-slate-600">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thứ tự hiển thị</label>
            <input
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-full py-2 rounded-xl border transition ${
                isActive
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 bg-slate-50 text-slate-500"
              }`}
            >
              {isActive ? "● Active" : "○ Inactive"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-slate-800 mb-2 font-semibold">{title}</h3>
        <p className="text-slate-600 mb-4">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
