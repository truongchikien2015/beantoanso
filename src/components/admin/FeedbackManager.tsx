import { useEffect, useState } from "react";
import { Admin } from "../../lib/store";

type Feedback = {
  _id: string;
  user_info?: string;
  content: string;
  feature_request: boolean;
  status: "new" | "reviewed" | "in_progress" | "done";
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Mới",
  reviewed: "Đã xem",
  in_progress: "Đang làm",
  done: "Hoàn thành",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  reviewed: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function FeedbackManager({ onHome }: { onHome: () => void }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const pw = Admin.getPassword();
      const res = await fetch("/api/admin/feedback", {
        headers: { "x-admin-password": pw },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Lỗi tải dữ liệu");
      setFeedbacks(body.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const pw = Admin.getPassword();
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": pw,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f._id === id ? { ...f, status: newStatus as any } : f))
        );
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sky-950">💡 Quản lý Góp ý & Phản hồi</h1>
          <p className="text-sky-600 font-bold text-xs sm:text-sm mt-0.5">
            Xem các ý kiến đóng góp từ người dùng và tính năng mới được yêu cầu
          </p>
        </div>
        <button onClick={load} className="Btn BtnSm rounded-2xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs px-4">
          🔄 Tải lại
        </button>
      </div>

      <div className="bg-white rounded-3xl border-4 border-sky-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center font-bold text-slate-400">⏳ Đang tải danh sách góp ý...</div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-rose-500 font-bold mb-4">{error}</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="py-20 text-center font-bold text-slate-400">Chưa có góp ý nào.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-sky-50/50">
                  <th className="TableTh text-sky-950 font-black py-4 px-4 text-left text-xs sm:text-sm">Ngày</th>
                  <th className="TableTh text-sky-950 font-black py-4 px-4 text-left text-xs sm:text-sm w-1/2">Nội dung</th>
                  <th className="TableTh text-sky-950 font-black py-4 px-4 text-left text-xs sm:text-sm">Người dùng</th>
                  <th className="TableTh text-sky-950 font-black py-4 px-4 text-left text-xs sm:text-sm">Loại</th>
                  <th className="TableTh text-sky-950 font-black py-4 px-4 text-left text-xs sm:text-sm">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((f) => (
                  <tr key={f._id} className="TableTr hover:bg-sky-50/20 border-b border-sky-100">
                    <td className="TableTd px-4 py-4 text-slate-500 font-semibold text-xs sm:text-sm align-top">
                      {new Date(f.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="TableTd px-4 py-4 align-top">
                      <p className="text-sky-950 font-medium text-sm whitespace-pre-wrap">{f.content}</p>
                    </td>
                    <td className="TableTd px-4 py-4 text-slate-600 font-semibold text-xs sm:text-sm align-top">
                      {f.user_info || <span className="text-slate-400 italic">Ẩn danh</span>}
                    </td>
                    <td className="TableTd px-4 py-4 align-top">
                      {f.feature_request ? (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                          ✨ Tính năng mới
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-semibold">Góp ý chung</span>
                      )}
                    </td>
                    <td className="TableTd px-4 py-4 align-top">
                      <select
                        value={f.status}
                        onChange={(e) => updateStatus(f._id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-200 appearance-none cursor-pointer ${STATUS_COLORS[f.status]}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// UX Audit Label Fallback: aria-label
