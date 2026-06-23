import { useState, useEffect } from "react";
import { Admin, CustomTopic } from "../../lib/store";

type LearningPathDB = {
  id: string;
  title: string;
  description: string;
  topic_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type LearningPathUI = {
  id: string;
  title: string;
  description: string;
  topicIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const mapPath = (row: LearningPathDB): LearningPathUI => ({
  id: row.id,
  title: row.title,
  description: row.description,
  topicIds: row.topic_ids || [],
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type TopicDB = {
  id: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  topic_order: number;
  is_active: boolean;
};

const mapTopic = (row: TopicDB): CustomTopic => ({
  id: row.id,
  slug: row.slug,
  label: row.label,
  icon: row.icon,
  color: row.color,
  order: row.topic_order,
  isActive: row.is_active,
  createdAt: "",
  updatedAt: "",
});

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

export function PathManager({ onLogout, onHome }: Props) {
  const [paths, setPaths] = useState<LearningPathUI[]>([]);
  const [topics, setTopics] = useState<CustomTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<LearningPathUI | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<LearningPathUI | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const adminPassword = Admin.getPassword();
      const [pathsRes, topicsRes] = await Promise.all([
        fetch("/api/admin/learning-paths", {
          headers: { "x-admin-password": adminPassword },
        }).then((res) => res.json()),
        fetch("/api/admin/topics", {
          headers: { "x-admin-password": adminPassword },
        }).then((res) => res.json()),
      ]);

      if (pathsRes.data) setPaths(pathsRes.data.map(mapPath));
      if (topicsRes.data) setTopics(topicsRes.data.map(mapTopic));
    } catch (err) {
      console.error("Failed to refresh paths:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleToggle = async (path: LearningPathUI) => {
    const adminPassword = Admin.getPassword();
    try {
      await fetch(`/api/admin/learning-paths/${path.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ is_active: !path.isActive }),
      });
      refresh();
    } catch (err) {
      console.error("Failed to toggle path status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const adminPassword = Admin.getPassword();
    try {
      await fetch(`/api/admin/learning-paths/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword,
        },
      });
      setConfirmDelete(null);
      refresh();
    } catch (err) {
      console.error("Failed to delete path:", err);
    }
  };

  const handleSave = async (data: { title: string; description: string; topicIds: string[]; isActive: boolean }, editId?: string) => {
    const adminPassword = Admin.getPassword();
    const row = {
      title: data.title,
      description: data.description,
      topic_ids: data.topicIds,
      is_active: data.isActive,
    };

    try {
      if (editId) {
        await fetch(`/api/admin/learning-paths/${editId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": adminPassword,
          },
          body: JSON.stringify(row),
        });
      } else {
        await fetch("/api/admin/learning-paths", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": adminPassword,
          },
          body: JSON.stringify(row),
        });
      }
      setCreating(false);
      setEditing(null);
      refresh();
    } catch (err) {
      console.error("Failed to save path:", err);
    }
  };

  const getTopicLabel = (id: string): string => topics.find((t) => t.id === id)?.label || id;
  const getTopicIcon = (id: string): string => topics.find((t) => t.id === id)?.icon || "📚";
  const getTopicColor = (id: string): string => topics.find((t) => t.id === id)?.color || "indigo";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <span className="text-slate-800 font-medium">Quản lý Lộ trình học tập</span>
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
              Tạo lộ trình học tập từ danh sách chủ đề. Mỗi lộ trình gồm các chủ đề được sắp xếp theo thứ tự.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          >
            ➕ Tạo lộ trình
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-12 text-center">
            <span className="text-5xl mb-4 block animate-bounce">⏳</span>
            <p className="text-slate-500">Đang tải lộ trình từ database...</p>
          </div>
        ) : paths.length === 0 ? (
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-12 text-center">
            <span className="text-5xl mb-4 block">🗺️</span>
            <p className="text-slate-500 mb-2">Chưa có lộ trình nào</p>
            <p className="text-slate-400 text-sm mb-4">Tạo lộ trình đầu tiên để sắp xếp thứ tự học tập</p>
            <button
              onClick={() => setCreating(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              ➕ Tạo lộ trình
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {paths.map((path) => (
              <div
                key={path.id}
                className="bg-white rounded-2xl shadow border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-slate-800 font-semibold text-lg">{path.title}</h3>
                      <button
                        onClick={() => handleToggle(path)}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          path.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {path.isActive ? "● Active" : "○ Inactive"}
                      </button>
                    </div>
                    <p className="text-slate-500 text-sm mb-3">{path.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {path.topicIds.map((tid, i) => (
                        <span
                          key={`${tid}-${i}`}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                            COLOR_BG[getTopicColor(tid)] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span>{getTopicIcon(tid)}</span>
                          <span>{getTopicLabel(tid)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditing(path)}
                      className="px-3 py-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 text-sm"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => setConfirmDelete(path)}
                      className="px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 text-sm"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {(creating || editing) && (
        <PathForm
          initial={editing ?? undefined}
          allTopics={topics}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(data) => handleSave(data, editing?.id)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Xóa lộ trình?"
          message={`"${confirmDelete.title}" sẽ bị xóa vĩnh viễn.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
        />
      )}
    </div>
  );
}

// === Path Form Modal ===
type FormData = { title: string; description: string; topicIds: string[]; isActive: boolean };

function PathForm({
  initial,
  allTopics,
  onCancel,
  onSave,
}: {
  initial?: LearningPathUI;
  allTopics: CustomTopic[];
  onCancel: () => void;
  onSave: (data: FormData) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initial?.topicIds ?? allTopics.map((t) => t.id),
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState("");

  const toggleTopic = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    if (idx === selectedIds.length - 1) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError("Tên lộ trình không được để trống");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Phải chọn ít nhất 1 chủ đề");
      return;
    }
    onSave({ title: title.trim(), description: description.trim(), topicIds: selectedIds, isActive });
  };

  const getTopic = (id: string): CustomTopic | undefined =>
    allTopics.find((t) => t.id === id);

  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-8 space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">
          {initial ? "✏️ Sửa lộ trình" : "➕ Tạo lộ trình mới"}
        </h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tên lộ trình</label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            placeholder="VD: Lộ trình An toàn Internet Cơ bản"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mô tả <span className="text-slate-400 font-normal">(tùy chọn)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về lộ trình học tập..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Chủ đề trong lộ trình ({selectedIds.length} đã chọn)
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Bấm chọn để thêm/bỏ chủ đề. Dùng ▲▼ để sắp xếp thứ tự hiển thị.
          </p>

          {selectedIds.length > 0 ? (
            <div className="space-y-1 mb-3">
              {selectedIds.map((id, idx) => {
                const t = getTopic(id);
                if (!t) return null;
                return (
                  <div
                    key={`${id}-${idx}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50"
                  >
                    <span className="text-slate-400 text-xs w-5 text-right">{idx + 1}</span>
                    <span className="text-xl">{t.icon}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-sm ${
                      COLOR_BG[t.color] || "bg-slate-100 text-slate-700"
                    }`}>
                      {t.label}
                    </span>
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-30"
                        title="Di chuyển lên"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === selectedIds.length - 1}
                        className="px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-30"
                        title="Di chuyển xuống"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => toggleTopic(id)}
                        className="px-2 py-1 rounded hover:bg-rose-100 text-rose-500"
                        title="Xóa khỏi lộ trình"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-3 py-2">Chưa chọn chủ đề nào</p>
          )}

          <p className="text-xs text-slate-400 mb-2">Bấm để thêm chủ đề:</p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl">
            {allTopics.map((t) => {
              const isSelected = selectedIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTopic(t.id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition ${
                    isSelected
                      ? "border-indigo-300 bg-indigo-100 opacity-50"
                      : `border-slate-200 hover:border-indigo-300 ${COLOR_BG[t.color] || "bg-slate-100 text-slate-700"}`
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {isSelected && <span className="text-indigo-600 ml-1">✓</span>}
                </button>
              );
            })}
          </div>
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
            {isActive ? "● Active — Lộ trình có thể sử dụng" : "○ Inactive — Lộ trình bị ẩn"}
          </button>
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
