"use client";

import { useCallback, useEffect, useState } from "react";
import { Teacher } from "@/lib/store";

type TeacherRow = Teacher;

type CreateForm = { name: string; email: string; password: string; schoolId: string };
type ResetForm = { newPassword: string; confirmPassword: string };

function apiHeaders(): HeadersInit {
  // Read from the same localStorage key Admin.login() uses
  const pw = localStorage.getItem("be_an_toan_so_admin") ?? "";
  return { "Content-Type": "application/json", "x-admin-password": pw };
}

async function apiGetTeachers(): Promise<TeacherRow[]> {
  const res = await fetch("/api/teachers", { headers: apiHeaders() });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
  return (await res.json()).data;
}

async function apiCreateTeacher(body: CreateForm): Promise<TeacherRow> {
  const res = await fetch("/api/teachers", { method: "POST", headers: apiHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
  return (await res.json()).data;
}

async function apiUpdateTeacher(id: string, body: Partial<TeacherRow>): Promise<TeacherRow> {
  const res = await fetch(`/api/teachers/${id}`, { method: "PATCH", headers: apiHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
  return (await res.json()).data;
}

async function apiDeleteTeacher(id: string): Promise<void> {
  const res = await fetch(`/api/teachers/${id}`, { method: "DELETE", headers: apiHeaders() });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
}

async function apiResetPassword(id: string, newPassword: string): Promise<void> {
  const res = await fetch(`/api/teachers/${id}/reset-password`, { method: "POST", headers: apiHeaders(), body: JSON.stringify({ newPassword }) });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
}

// ── Modal Wrapper ──────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="ModalOverlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ModalBox" style={{ maxWidth: 480 }}>
        <div className="ModalHeader">
          <h3 className="ModalTitle">{title}</h3>
          <button onClick={onClose} className="Btn BtnGhost" style={{ padding: "4px 10px" }}>✕</button>
        </div>
        <div className="ModalBody">{children}</div>
      </div>
    </div>
  );
}

// ── Form Fields ──────────────────────────────────────────────────────────────
function F({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="Field">
      <label className="FieldLabel">
        {label}{required && <span className="FieldRequired">*</span>}
      </label>
      {children}
      {error && <span className="FieldError">{error}</span>}
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: TeacherRow) => void }) {
  const [form, setForm] = useState<CreateForm>({ name: "", email: "", password: "", schoolId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) { setError("Vui lòng điền đầy đủ thông tin bắt buộc."); return; }
    if (form.password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    setLoading(true); setError("");
    try {
      const teacher = await apiCreateTeacher({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() });
      onCreated(teacher);
      onClose();
    } catch (err: any) { setError(err.message ?? "Lỗi không xác định"); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="➕ Tạo tài khoản giáo viên" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <F label="Họ tên" required>
          <input className="FieldInput" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A" autoFocus />
        </F>
        <F label="Email" required>
          <input className="FieldInput" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="giaovien@truong.edu.vn" />
        </F>
        <F label="Mật khẩu" required>
          <input className="FieldInput" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" />
        </F>
        <F label="Trường / Đơn vị">
          <input className="FieldInput" type="text" value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} placeholder="THCS Nguyễn Trãi" />
        </F>
        {error && <div className="Badge BadgeError" style={{ padding: "8px 14px" }}>{error}</div>}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading} className="Btn BtnPrimary flex-1 justify-center">{loading ? "Đang tạo..." : "Tạo tài khoản"}</button>
          <button type="button" onClick={onClose} className="Btn BtnSm">Hủy</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Reset Password Modal ────────────────────────────────────────────────────
function ResetModal({ teacher, onClose }: { teacher: TeacherRow; onClose: () => void }) {
  const [form, setForm] = useState<ResetForm>({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (form.newPassword.length < 6) { setError("Mật khẩu phải ít nhất 6 ký tự."); return; }
    if (form.newPassword !== form.confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    try { await apiResetPassword(teacher.id, form.newPassword); setSuccess("Đặt lại mật khẩu thành công!"); setTimeout(onClose, 1500); }
    catch (err: any) { setError(err.message ?? "Lỗi không xác định"); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="🔑 Đặt lại mật khẩu" onClose={onClose}>
      <p className="text-sm text-slate-500 mb-4">Giáo viên: <strong>{teacher.name}</strong> ({teacher.email})</p>
      <form onSubmit={submit} className="space-y-4">
        <F label="Mật khẩu mới" required>
          <input className="FieldInput" type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder="Ít nhất 6 ký tự" autoFocus />
        </F>
        <F label="Xác nhận mật khẩu" required>
          <input className="FieldInput" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Nhập lại mật khẩu mới" />
        </F>
        {error && <div className="Badge BadgeError" style={{ padding: "8px 14px" }}>{error}</div>}
        {success && <div className="Badge BadgeActive" style={{ padding: "8px 14px" }}>{success}</div>}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading} className="Btn BtnPrimary flex-1 justify-center">{loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}</button>
          <button type="button" onClick={onClose} className="Btn BtnSm">Hủy</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Delete Modal ────────────────────────────────────────────────────────────
function DeleteModal({ teacher, onClose, onDeleted }: { teacher: TeacherRow; onClose: () => void; onDeleted: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const confirm = async () => {
    setLoading(true); setError("");
    try { await apiDeleteTeacher(teacher.id); onDeleted(teacher.id); onClose(); }
    catch (err: any) { setError(err.message ?? "Lỗi không xác định"); }
    finally { setLoading(false); }
  };
  return (
    <Modal title="⚠️ Xóa tài khoản giáo viên" onClose={onClose}>
      <p className="text-slate-600">
        Bạn có chắc chắn muốn xóa tài khoản của <strong>{teacher.name}</strong> ({teacher.email})?{" "}
        Hành động này <em>không thể hoàn tác</em>.
      </p>
      {error && <div className="Badge BadgeError mt-3" style={{ padding: "8px 14px" }}>{error}</div>}
      <div className="flex gap-2 mt-4">
        <button onClick={confirm} disabled={loading} className="Btn flex-1 justify-center" style={{ background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3" }}>
          {loading ? "Đang xóa..." : "Xóa vĩnh viễn"}
        </button>
        <button onClick={onClose} className="Btn BtnSm">Hủy</button>
      </div>
    </Modal>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ teacher, onClose }: { teacher: TeacherRow; onClose: () => void }) {
  return (
    <Modal title="👤 Chi tiết tài khoản" onClose={onClose}>
      <dl className="space-y-3">
        {[
          ["Họ tên", teacher.name],
          ["Email", teacher.email],
          ["Trường", teacher.schoolId || "—"],
          ["Trạng thái", teacher.isActive ? "Hoạt động" : "Bị khóa", teacher.isActive ? "BadgeActive" : "BadgeInactive"],
          ["Ngày tạo", new Date(teacher.createdAt).toLocaleString("vi-VN")],
          ["Cập nhật cuối", new Date(teacher.updatedAt).toLocaleString("vi-VN")],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="flex items-start gap-3">
            <dt className="w-28 text-sm text-slate-400 shrink-0 pt-0.5">{label}</dt>
            <dd className="text-sm text-slate-700">
              {cls ? <span className={`Badge ${cls}`}>{value as string}</span> : <strong>{value as string}</strong>}
            </dd>
          </div>
        ))}
      </dl>
      <button onClick={onClose} className="Btn BtnSm w-full mt-5 justify-center">Đóng</button>
    </Modal>
  );
}

// ── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl px-5 py-4 text-center min-w-0">
      <div style={{ background: color }} className="rounded-xl p-4">
        <p className="text-xl font-bold text-slate-700 leading-tight">{value}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "detail"; teacher: TeacherRow }
  | { type: "reset"; teacher: TeacherRow }
  | { type: "delete"; teacher: TeacherRow };

export function TeacherManager({ onLogout, onHome }: { onLogout: () => void; onHome: () => void }) {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const PAGE_SIZE = 15;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setTeachers(await apiGetTeachers()); }
    catch (err: any) { setError(err.message ?? "Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (teacher: TeacherRow) => {
    try {
      const updated = await apiUpdateTeacher(teacher.id, { isActive: !teacher.isActive });
      setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: any) { alert(err.message ?? "Lỗi"); }
  };

  const q = search.trim().toLowerCase();
  const filtered = q ? teachers.filter((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)) : teachers;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="p-8 space-y-6">
      {/* Header */}
      <div className="p-6 pb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-800" style={{ letterSpacing: "-0.02em" }}>Giáo viên</h1>
          <p className="text-slate-400 text-sm mt-1">{teachers.length} tài khoản</p>
        </div>
        <button onClick={() => setModal({ type: "create" })} className="Btn BtnPrimary flex-shrink-0" style={{ whiteSpace: "nowrap" }}>
          <span>➕</span> Tạo tài khoản
        </button>
      </div>

      {/* Card */}
      <div className="Card" style={{ margin: "0 24px 24px" }}>
        {/* Search */}
        <div className="CardHeader">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo tên hoặc email..."
            className="Input"
            style={{ maxWidth: 280, minWidth: 0 }}
          />
        </div>

          {/* Table */}
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="text-3xl mb-3">⏳</div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="text-3xl mb-3">⚠️</div>
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={load} className="Btn BtnSm">Thử lại</button>
            </div>
          ) : paged.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <div className="text-3xl mb-3">{search ? "🔍" : "📭"}</div>
              <p>{search ? "Không tìm thấy giáo viên phù hợp." : "Chưa có tài khoản giáo viên nào."}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="TableTh">Họ tên</th>
                      <th className="TableTh hidden md:table-cell">Email</th>
                      <th className="TableTh hidden lg:table-cell">Trường</th>
                      <th className="TableTh">Trạng thái</th>
                      <th className="TableTh hidden sm:table-cell">Ngày tạo</th>
                      <th className="TableTh">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((t) => (
                      <tr key={t.id} className="TableTr">
                        <td className="TableTd font-medium text-slate-800">
                          <button onClick={() => setModal({ type: "detail", teacher: t })} className="hover:text-indigo-500 transition-colors truncate max-w-[140px] block">
                            {t.name}
                          </button>
                        </td>
                        <td className="TableTd text-slate-500 hidden md:table-cell max-w-[180px]">
                          <span className="truncate block">{t.email}</span>
                        </td>
                        <td className="TableTd text-slate-400 hidden lg:table-cell text-sm max-w-[120px]">
                          <span className="truncate block">{t.schoolId || "—"}</span>
                        </td>
                        <td className="TableTd">
                          <span className={`Badge ${t.isActive ? "BadgeActive" : "BadgeInactive"}`}>
                            {t.isActive ? "●" : "○"} {t.isActive ? "Active" : "Locked"}
                          </span>
                        </td>
                        <td className="TableTd text-slate-400 text-sm hidden sm:table-cell">
                          {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="TableTd">
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button onClick={() => setModal({ type: "detail", teacher: t })} className="Btn BtnSm" title="Chi tiết" style={{ padding: "4px 8px" }}>👁</button>
                            <button onClick={() => setModal({ type: "reset", teacher: t })} className="Btn BtnSm" title="Đặt lại mật khẩu" style={{ padding: "4px 8px" }}>🔑</button>
                            <button onClick={() => handleToggle(t)} className={`Btn BtnSm ${t.isActive ? "BtnDanger" : ""}`} title={t.isActive ? "Khóa" : "Kích hoạt"} style={{ padding: "4px 8px" }}>
                              {t.isActive ? "🔒" : "🔓"}
                            </button>
                            <button onClick={() => setModal({ type: "delete", teacher: t })} className="Btn BtnSm" style={{ color: "#ef4444", padding: "4px 8px" }} title="Xóa">🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <p className="text-sm text-slate-400">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="Btn BtnSm">←</button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="Btn BtnSm">→</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatPill label="Tổng tài khoản" value={teachers.length} color="#f1f5f9" />
          <StatPill label="Hoạt động" value={teachers.filter((t) => t.isActive).length} color="#dcfce7" />
          <StatPill label="Bị khóa" value={teachers.filter((t) => !t.isActive).length} color="#f1f5f9" />
        </div>
      </div>

      {/* Modals */}
      {modal.type === "create" && <CreateModal onClose={() => setModal({ type: "none" })} onCreated={(t) => { setTeachers((p) => [t, ...p]); setModal({ type: "none" }); }} />}
      {modal.type === "detail" && <DetailModal teacher={modal.teacher} onClose={() => setModal({ type: "none" })} />}
      {modal.type === "reset" && <ResetModal teacher={modal.teacher} onClose={() => setModal({ type: "none" })} />}
      {modal.type === "delete" && <DeleteModal teacher={modal.teacher} onClose={() => setModal({ type: "none" })} onDeleted={(id) => setTeachers((p) => p.filter((t) => t.id !== id))} />}
    </>
  );
}
