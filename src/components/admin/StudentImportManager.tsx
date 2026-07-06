"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTeacherContentStore } from "@/lib/teacherContentStore";
import { parseStudentFile, validateAndPrepareImport } from "@/lib/excelParser";
import { Download, Upload, Trash2, UserCheck, Plus, X, Check, AlertCircle, Route, Search, SlidersHorizontal, RotateCcw, LayoutGrid, List, KeyRound, Users, Copy, Share2, UserPlus, Loader2 } from "lucide-react";

const SAMPLE_HEADERS = ["nickname", "email", "class_name", "student_code", "password"];

interface ImportedCredential {
  nickname: string;
  student_code: string;
  password: string;
}

export function StudentImportManager() {
  const {
    students, learningPaths, fetchStudents, fetchLearningPaths,
    deleteStudent, assignPathToStudent, resetStudentPassword, error, clearError,
    loading: storeLoading,
  } = useTeacherContentStore();

  // True on the very first fetch (no students loaded yet) — used to swap the
  // student list for a skeleton. Once the list has been rendered once, we let
  // reloads show a subtle pill instead of yanking the whole list.
  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    if (!storeLoading) setInitialLoad(false);
  }, [storeLoading]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<{ errors: Array<{ row: number; message: string }> } | null>(null);
  const [importedCredentials, setImportedCredentials] = useState<ImportedCredential[] | null>(null);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [assignPathIds, setAssignPathIds] = useState<string[]>([]);
  const [resetTarget, setResetTarget] = useState<{ id: string; nickname: string } | null>(null);
  const [resetForm, setResetForm] = useState({ newPassword: "", confirmPassword: "" });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const [parentLinkTarget, setParentLinkTarget] = useState<{ id: string; nickname: string; parent_access_code: string | null } | null>(null);
  const [parentLinkLoading, setParentLinkLoading] = useState(false);
  const [parentLinkCopied, setParentLinkCopied] = useState(false);

  // Multi-select state for bulk assign
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [bulkAssignSuccess, setBulkAssignSuccess] = useState("");

  // Single-student add
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [pathFilter, setPathFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  useEffect(() => { fetchStudents(); fetchLearningPaths(); }, []);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derived filter options
  const classOptions = useMemo(() => {
    const classes = [...new Set(
      students
        .filter(s => s.is_active && s.class_name)
        .map(s => s.class_name as string)
    )];
    return classes.sort((a, b) => a.localeCompare(b, "vi"));
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (!s.is_active) return false;

      // Search filter
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matchName = s.nickname.toLowerCase().includes(q);
        const matchCode = s.student_code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }

      // Class filter
      if (classFilter && s.class_name !== classFilter) return false;

      // Status filter
      if (statusFilter === "assigned" && (!s.assigned_path_ids || s.assigned_path_ids.length === 0)) return false;
      if (statusFilter === "unassigned" && s.assigned_path_ids && s.assigned_path_ids.length > 0) return false;

      // Path filter
      if (pathFilter && !(s.assigned_path_ids || []).includes(pathFilter)) return false;

      return true;
    });
  }, [students, debouncedSearch, classFilter, statusFilter, pathFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setClassFilter(null);
    setStatusFilter("all");
    setPathFilter(null);
  }, []);

  // Has active filters
  const hasActiveFilters = searchQuery || classFilter || statusFilter !== "all" || pathFilter;
  const activeStudentsCount = students.filter(s => s.is_active).length;
  const selectedPathLabel = pathFilter
    ? learningPaths.find(p => p.id === pathFilter)?.title ?? "Lộ trình đã chọn"
    : null;

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);
    setImportedCredentials(null);
    clearError();
    try {
      // Stage 1: parse file
      let rows;
      try {
        rows = await parseStudentFile(file);
      } catch (parseErr) {
        setImportError({ errors: [{ row: 0, message: `[Đọc file] ${parseErr instanceof Error ? parseErr.message : String(parseErr)}` }] });
        return;
      }

      if (rows.length === 0) {
        setImportError({ errors: [{ row: 0, message: `File "${file.name}" không có dòng nào có tên học sinh. Kiểm tra cột "nickname".` }] });
        return;
      }

      // Stage 2: validate + prepare
      const existingCodes = new Set(students.map(s => s.student_code));
      const { valid, errors } = validateAndPrepareImport(rows, existingCodes);

      if (errors.length > 0) {
        setImportError({ errors });
        return;
      }

      if (valid.length === 0) {
        setImportError({ errors: [{ row: 0, message: "Không tìm thấy dữ liệu học sinh hợp lệ trong file." }] });
        return;
      }

      // Stage 3: check auth
      const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
      if (!token) {
        setImportError({ errors: [{ row: 0, message: "[Chưa đăng nhập] Không tìm thấy teacher_token trong localStorage. Đăng nhập lại giáo viên rồi thử." }] });
        return;
      }

      // Stage 4: POST to API
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ students: valid }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body.error ?? `HTTP ${res.status} ${res.statusText}`;
        setImportError({ errors: [{ row: 0, message: `[API] ${detail}` }] });
        return;
      }

      const body = await res.json();
      if (body.created && body.created.length > 0) setImportedCredentials(body.created);
      if (body.result?.failed > 0) setImportError({ errors: body.result.errors ?? [] });

      await fetchStudents();
    } catch (err) {
      // Catch-all — network fail, JSON parse fail, etc.
      setImportError({ errors: [{ row: 0, message: `[Không xác định] ${err instanceof Error ? err.message : String(err)}` }] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [students, clearError, fetchStudents]);

  const downloadTemplate = () => {
    const headers = SAMPLE_HEADERS.join(",");
    const example = `Nguyen Van A,nguyenvana@email.com,10A1,HS001,Matkhau123\nTran Thi B,tranthib@email.com,10A2,,`;
    const note = `# Cột password là tùy chọn. Nếu để trống, mật khẩu sẽ được tự động sinh.\n# Các cột bắt buộc: nickname`;
    const csv = `${note}\n${headers}\n${example}`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "hocsinh_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCredentials = () => {
    if (!importedCredentials || importedCredentials.length === 0) return;
    const headers = "nickname,student_code,password";
    const rows = importedCredentials
      .map(c => `"${c.nickname}","${c.student_code}","${c.password}"`)
      .join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ket_qua_import.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (student: { id: string; nickname: string; source?: "teacher" | "self" }) => {
    const isSelf = student.source === "self";
    const confirmMsg = isSelf
      ? `Bỏ "${student.nickname}" khỏi lớp của bạn? (Tài khoản học sinh không bị xoá.)`
      : `Xoá học sinh "${student.nickname}"?`;
    if (!confirm(confirmMsg)) return;

    if (isSelf) {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
        const res = await fetch(`/api/teacher/students/${student.id}/unassign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          alert(body.error ?? `Lỗi ${res.status}`);
          return;
        }
        await fetchStudents();
      } catch (err) {
        alert(err instanceof Error ? err.message : String(err));
      }
    } else {
      await deleteStudent(student.id);
    }
  };

  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;
    const items = filteredStudents
      .filter((s) => selectedStudents.has(s.id))
      .map((s) => ({ id: s.id, source: s.source ?? "teacher" as const }));
    const teacherCount = items.filter((x) => x.source === "teacher").length;
    const selfCount = items.filter((x) => x.source === "self").length;
    const parts: string[] = [];
    if (teacherCount) parts.push(`Xoá ${teacherCount} học sinh do bạn tạo`);
    if (selfCount) parts.push(`bỏ ${selfCount} học sinh tự đăng ký khỏi lớp`);
    if (!confirm(`${parts.join(" và ")}?\n\nHành động không thể hoàn tác.`)) return;

    setBulkDeleting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
      const res = await fetch("/api/teacher/students/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(body.error ?? `Lỗi ${res.status}`);
        return;
      }
      setSelectedStudents(new Set());
      await fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleAssign = async (studentId: string) => {
    await assignPathToStudent(studentId, assignPathIds);
    setAssignTarget(null);
    setAssignPathIds([]);
  };

  const openResetPassword = (student: { id: string; nickname: string }) => {
    setResetTarget({ id: student.id, nickname: student.nickname });
    setResetForm({ newPassword: "", confirmPassword: "" });
    setResetError("");
    setResetSuccess("");
  };

  const closeResetPassword = () => {
    if (resetLoading) return;
    setResetTarget(null);
    setResetForm({ newPassword: "", confirmPassword: "" });
    setResetError("");
    setResetSuccess("");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError("");
    setResetSuccess("");
    if (resetForm.newPassword.length < 6) {
      setResetError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setResetLoading(true);
    const errorMessage = await resetStudentPassword(resetTarget.id, resetForm.newPassword);
    setResetLoading(false);
    if (errorMessage) {
      setResetError(errorMessage);
      return;
    }
    setResetSuccess("Đã đặt lại mật khẩu học sinh.");
    setTimeout(() => {
      setResetTarget(null);
      setResetSuccess("");
      setResetForm({ newPassword: "", confirmPassword: "" });
    }, 1200);
  };

  const handleParentLinkAction = async (action: "ensure" | "regenerate") => {
    if (!parentLinkTarget) return;
    setParentLinkLoading(true);
    clearError();
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
      const res = await fetch(`/api/teacher/students/${parentLinkTarget.id}/parent-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Lỗi thao tác mã phụ huynh");

      // Update local target state with the generated code
      setParentLinkTarget({
        ...parentLinkTarget,
        parent_access_code: body.parent_access_code,
      });

      // Update Zustand store in-memory for instant reactive UI updates
      useTeacherContentStore.setState((state) => ({
        students: state.students.map((st) =>
          st.id === parentLinkTarget.id
            ? { ...st, parent_access_code: body.parent_access_code }
            : st
        ),
      }));

      // Refresh student list from Zustand store
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || "Lỗi hệ thống khi tạo mã phụ huynh");
    } finally {
      setParentLinkLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text);
    setParentLinkCopied(true);
    setTimeout(() => setParentLinkCopied(false), 2000);
  };

  // Bulk select handlers
  const toggleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const selectAllStudents = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (assignPathIds.length === 0 || selectedStudents.size === 0) return;
    setBulkAssignLoading(true);
    setBulkAssignSuccess("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
      let assignedCount = 0;
      for (const pathId of assignPathIds) {
        const res = await fetch(`/api/teacher/learning-paths/${pathId}/assign-students`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ studentIds: Array.from(selectedStudents) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Lỗi khi gán lộ trình");
        assignedCount = data.assignedCount;
      }
      setBulkAssignSuccess(`Đã gán ${assignPathIds.length} lộ trình cho ${assignedCount} học sinh!`);
      setSelectedStudents(new Set());
      setShowBulkAssign(false);
      setAssignPathIds([]);
      await fetchStudents();
      setTimeout(() => setBulkAssignSuccess(""), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi khi gán lộ trình");
    } finally {
      setBulkAssignLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Full-screen upload overlay — dismissible-proof while parse+POST runs.
          Blocks accidental double submissions and makes the wait tangible. */}
      {importing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" aria-live="polite">
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-sky-100 p-8 max-w-sm w-full text-center space-y-4">
            <Loader2 size={48} className="mx-auto animate-spin text-sky-600" />
            <div>
              <h3 className="text-lg font-black text-sky-900">Đang tải lên...</h3>
              <p className="text-sm text-slate-500 mt-1">Đọc file, kiểm tra dữ liệu, và tạo học sinh trên hệ thống.</p>
            </div>
            <div className="w-full bg-sky-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-sky-500 animate-pulse" style={{ width: "60%" }} />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold">Không đóng trang trong lúc chờ.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-sky-900">Quản lý học sinh</h2>
        <div className="flex gap-2">
          {filteredStudents.length > 0 && learningPaths.length > 0 && (
            <button
              onClick={() => setShowBulkAssign(true)}
              className="Btn Btn--outline Btn--sm flex items-center gap-1 text-indigo-600 border-indigo-300"
            >
              <Route size={14} /> Gán lộ trình hàng loạt
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="Btn Btn--outline Btn--sm flex items-center gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
            <UserPlus size={14} /> Thêm học sinh
          </button>
          <button onClick={downloadTemplate} className="Btn Btn--outline Btn--sm flex items-center gap-1">
            <Download size={14} /> Tải mẫu CSV
          </button>
          <label
            className={`Btn Btn--primary Btn--sm flex items-center gap-1 cursor-pointer ${importing ? "opacity-70 cursor-wait" : ""}`}
            aria-busy={importing}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? "Đang tải lên..." : "Nhập từ Excel"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {/* Filter Bar */}
      <section className="Card overflow-hidden border border-sky-100 bg-white/95 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-sky-100 bg-sky-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sky-950">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm">
              <SlidersHorizontal size={16} />
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">Bộ lọc học sinh</p>
              <p className="text-xs text-slate-500">
                Hiển thị {filteredStudents.length}/{activeStudentsCount} học sinh đang hoạt động
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {searchQuery && (
              <span className="Badge bg-white text-sky-700">Tìm: {searchQuery}</span>
            )}
            {classFilter && (
              <span className="Badge bg-white text-sky-700">Lớp {classFilter}</span>
            )}
            {statusFilter !== "all" && (
              <span className="Badge bg-white text-sky-700">
                {statusFilter === "assigned" ? "Đã gán lộ trình" : "Chưa gán lộ trình"}
              </span>
            )}
            {selectedPathLabel && (
              <span className="Badge bg-white text-sky-700">{selectedPathLabel}</span>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="Btn Btn--ghost Btn--sm flex items-center gap-1 text-rose-600"
                title="Xóa toàn bộ bộ lọc"
              >
                <RotateCcw size={14} /> Đặt lại
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-[minmax(260px,1.4fr)_minmax(140px,0.7fr)_minmax(170px,0.8fr)_minmax(190px,1fr)]">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600">Tìm kiếm</span>
            <span className="relative block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Nhập mã, tên học sinh..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="Input w-full pl-9 text-sm"
              />
            </span>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600">Lớp</span>
            <select
              value={classFilter ?? ""}
              onChange={e => setClassFilter(e.target.value || null)}
              className="Input w-full text-sm"
            >
              <option value="">Tất cả lớp</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600">Trạng thái</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as "all" | "assigned" | "unassigned")}
              className="Input w-full text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="assigned">Đã gán lộ trình</option>
              <option value="unassigned">Chưa gán lộ trình</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600">Lộ trình</span>
            <select
              value={pathFilter ?? ""}
              onChange={e => setPathFilter(e.target.value || null)}
              className="Input w-full text-sm"
            >
              <option value="">Tất cả lộ trình</option>
              {learningPaths.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div className="Card p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError}><X size={14} /></button>
        </div>
      )}

      {/* Credentials result — show after successful import */}
      {importedCredentials && importedCredentials.length > 0 && (
        <div className="Card border border-green-300 overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-green-600" />
              <span className="text-sm font-semibold text-green-800">
                Nhập thành công {importedCredentials.length} học sinh!
              </span>
            </div>
            <button
              onClick={downloadCredentials}
              className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
            >
              <Download size={12} /> Tải kết quả CSV
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-green-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-green-800">Tên</th>
                  <th className="text-left px-4 py-2 font-semibold text-green-800">Mã học sinh</th>
                  <th className="text-left px-4 py-2 font-semibold text-green-800">Mật khẩu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {importedCredentials.map((c, i) => (
                  <tr key={i} className="hover:bg-green-50">
                    <td className="px-4 py-2 text-gray-800">{c.nickname}</td>
                    <td className="px-4 py-2 font-mono text-gray-600">{c.student_code}</td>
                    <td className="px-4 py-2 font-mono font-semibold text-sky-700">{c.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700">
            Hãy chia sẻ mã học sinh và mật khẩu với từng học sinh để các em đăng nhập.
          </div>
        </div>
      )}

      {/* Import errors */}
      {importError && importError.errors.length > 0 && (
        <div className="Card p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} />
            <span className="font-semibold">{importError.errors.length} dòng lỗi:</span>
          </div>
          <ul className="space-y-1 text-xs ml-5 list-disc">
            {importError.errors.map((err, i) => (
              <li key={i}>
                {err.row > 0 ? `Dòng ${err.row}: ` : ""}{err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Students list */}
      <div className="space-y-3">
        {/* Initial load skeleton — replaces the "empty state" until fetchStudents
            has resolved at least once. Prevents "Chưa có học sinh nào" flash. */}
        {initialLoad && storeLoading && (
          <div className="Card p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
              <Loader2 size={14} className="animate-spin" />
              Đang tải danh sách học sinh...
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg bg-slate-100 h-14" />
              ))}
            </div>
          </div>
        )}

        {/* Empty state — only after initial load resolved */}
        {!initialLoad && students.length === 0 && !importedCredentials && (
          <div className="Card p-8 text-center text-gray-500 text-sm">
            Chưa có học sinh nào. Tải mẫu CSV để bắt đầu.
          </div>
        )}

        {/* Reload pill — visible during background reloads (fetchStudents after
            create/delete/import) so the user knows the list is refreshing. */}
        {!initialLoad && storeLoading && students.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 px-1">
            <Loader2 size={12} className="animate-spin" />
            Đang cập nhật danh sách...
          </div>
        )}
        {selectedStudents.size > 0 && (
          <div className="Card p-3 bg-indigo-50 border border-indigo-200 flex items-center justify-between">
            <span className="text-sm text-indigo-700">
              Đã chọn <strong>{selectedStudents.size}</strong> học sinh
            </span>
            <div className="flex gap-2">
              <button onClick={() => setSelectedStudents(new Set())} className="Btn Btn--ghost Btn--sm text-xs">Bỏ chọn</button>
              <button
                onClick={() => setShowBulkAssign(true)}
                disabled={learningPaths.length === 0}
                className="Btn Btn--primary Btn--sm text-xs flex items-center gap-1"
              >
                <Route size={12} /> Gán lộ trình
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="Btn Btn--sm text-xs flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-60"
              >
                <Trash2 size={12} /> {bulkDeleting ? "Đang xoá..." : `Xoá ${selectedStudents.size} học sinh`}
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-slate-700">{filteredStudents.length} học sinh</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-sky-100 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${viewMode === "list" ? "bg-sky-600 text-white" : "text-slate-500 hover:bg-sky-50"}`}
                title="Hiển thị dạng danh sách"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${viewMode === "card" ? "bg-sky-600 text-white" : "text-slate-500 hover:bg-sky-50"}`}
                title="Hiển thị dạng thẻ"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
            <button
              onClick={selectAllStudents}
              disabled={filteredStudents.length === 0}
              className="Btn Btn--ghost Btn--sm text-xs text-indigo-600 disabled:opacity-40"
            >
              {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>
        </div>

        {filteredStudents.length === 0 && (
          <div className="Card p-8 text-center text-gray-500 text-sm">
            {hasActiveFilters ? "Không có học sinh nào phù hợp với bộ lọc." : "Chưa có học sinh nào."}
          </div>
        )}

        {viewMode === "list" && filteredStudents.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
            <div className="hidden grid-cols-[44px_1.1fr_0.5fr_0.6fr_1fr_1.1fr_132px] gap-3 bg-sky-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-sky-900 md:grid">
              <span></span>
              <span>Học sinh</span>
              <span>Lớp</span>
              <span>Mã HS</span>
              <span>Lộ trình</span>
              <span>Mã Phụ Huynh</span>
              <span className="text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-sky-50">
              {filteredStudents.map(student => {
                const assignedPaths = learningPaths.filter(p => (student.assigned_path_ids || []).includes(p.id));
                // Self-registered students (linked via Profile.teacher_id) don't
                // live in teacher_students — teacher-only actions (reset password,
                // parent code, path assign, delete) are read-only for them.
                const isSelf = student.source === "self";
                return (
                  <div key={student.id} className={`grid gap-3 px-4 py-3 transition hover:bg-sky-50/50 md:grid-cols-[44px_1.1fr_0.5fr_0.6fr_1fr_1.1fr_132px] md:items-center ${selectedStudents.has(student.id) ? "bg-indigo-50/70" : ""}`}>
                    <div className="flex items-center justify-between md:block">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelect(student.id)}
                        className="h-5 w-5 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label={`Chọn ${student.nickname}`}
                      />
                      <div className="flex gap-1 md:hidden">
                        {!isSelf && learningPaths.length > 0 && (
                          <button onClick={() => { setAssignTarget(student.id); setAssignPathIds(student.assigned_path_ids || []); }} className="Btn Btn--ghost Btn--sm" title="Gán lộ trình">
                            <Plus size={14} />
                          </button>
                        )}
                        {!isSelf && (
                          <button onClick={() => openResetPassword(student)} className="Btn Btn--ghost Btn--sm text-amber-600" title="Đổi mật khẩu">
                            <KeyRound size={14} />
                          </button>
                        )}
                        {!isSelf && (
                          <button onClick={() => setParentLinkTarget({ id: student.id, nickname: student.nickname, parent_access_code: student.parent_access_code })} className="Btn Btn--ghost Btn--sm text-indigo-600" title="Mã liên kết phụ huynh">
                            <Users size={14} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(student)} className="Btn Btn--ghost Btn--sm text-red-500" title={isSelf ? "Bỏ khỏi lớp" : "Xóa"}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 flex items-center gap-1.5">
                        {student.nickname}
                        {student.source === "self" && (
                          <span
                            title="Học sinh tự đăng ký, được admin gán vào lớp bạn"
                            className="inline-flex items-center rounded-md bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 text-[9px] font-black text-indigo-700"
                          >
                            TỰ ĐĂNG KÝ
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600"><UserCheck size={11} /> Hoạt động</p>
                    </div>
                    <span className="text-sm text-slate-600">{student.class_name || (student.source === "self" ? "Tự do" : "Chưa có lớp")}</span>
                    <span className="w-fit rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                      {student.student_code || (student.source === "self" ? "—" : "")}
                    </span>
                    <div className="min-w-0">
                      {assignedPaths.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedPaths.map(path => (
                            <span key={path.id} className="inline-flex max-w-full items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                              <span className="truncate">{path.title}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Chưa gán lộ trình</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 md:block">
                      <span className="text-xs font-bold text-slate-400 md:hidden">Mã phụ huynh: </span>
                      {isSelf ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : student.parent_access_code ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setParentLinkTarget({ id: student.id, nickname: student.nickname, parent_access_code: student.parent_access_code })}
                            className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200 font-mono hover:bg-indigo-100 transition cursor-pointer"
                            title="Xem chi tiết và quản lý mã phụ huynh"
                          >
                            {student.parent_access_code}
                          </button>
                          <button
                            onClick={() => {
                              const origin = typeof window !== "undefined" ? window.location.origin : "";
                              navigator.clipboard.writeText(`${origin}/parent?code=${student.parent_access_code}`);
                              alert("Đã sao chép liên kết phụ huynh!");
                            }}
                            className="text-slate-400 hover:text-indigo-600 p-1"
                            title="Sao chép liên kết phụ huynh"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setParentLinkTarget({ id: student.id, nickname: student.nickname, parent_access_code: student.parent_access_code })}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                        >
                          + Tạo mã
                        </button>
                      )}
                    </div>
                    <div className="hidden justify-end gap-1 md:flex">
                      {!isSelf && learningPaths.length > 0 && (
                        <button onClick={() => { setAssignTarget(student.id); setAssignPathIds(student.assigned_path_ids || []); }} className="Btn Btn--secondary Btn--sm" title="Gán lộ trình">
                          <Plus size={14} />
                        </button>
                      )}
                      {!isSelf && (
                        <button onClick={() => openResetPassword(student)} className="Btn Btn--ghost Btn--sm text-amber-600" title="Đổi mật khẩu">
                          <KeyRound size={14} />
                        </button>
                      )}
                      {!isSelf && (
                        <button onClick={() => setParentLinkTarget({ id: student.id, nickname: student.nickname, parent_access_code: student.parent_access_code })} className="Btn Btn--ghost Btn--sm text-indigo-600" title="Mã liên kết phụ huynh">
                          <Users size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(student)} className="Btn Btn--ghost Btn--sm text-red-500" title={isSelf ? "Bỏ khỏi lớp" : "Xóa"}>
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {assignTarget === student.id && (
                      <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 md:col-span-7">
                        <div className="flex flex-col gap-2.5">
                          <label className="text-xs font-bold text-sky-900">Chọn lộ trình học tập cho bé:</label>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-sky-100 bg-white p-2 rounded-xl">
                            {learningPaths.map(p => {
                              const isChecked = assignPathIds.includes(p.id);
                              return (
                                <label key={p.id} className="flex items-center gap-2 text-xs font-bold text-sky-950 cursor-pointer py-1 px-2.5 rounded bg-sky-50 hover:bg-sky-100/80 transition-all border border-sky-100">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setAssignPathIds([...assignPathIds, p.id]);
                                      } else {
                                        setAssignPathIds(assignPathIds.filter(id => id !== p.id));
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                  <span>{p.title}</span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="flex gap-2 justify-end mt-1">
                            <button onClick={() => handleAssign(student.id)} className="Btn Btn--primary Btn--sm text-xs">Gán</button>
                            <button onClick={() => { setAssignTarget(null); setAssignPathIds([]); }} className="Btn Btn--secondary Btn--sm text-xs">Hủy</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "card" && filteredStudents.length > 0 && (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filteredStudents.map(student => (
              <div key={student.id} className={"Card p-4 space-y-2 transition-all " + (selectedStudents.has(student.id) ? "ring-2 ring-indigo-400 bg-indigo-50/50" : "")}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.id)}
                    onChange={() => toggleStudentSelect(student.id)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1 flex-shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                      {student.nickname}
                      {student.source === "self" && (
                        <span
                          title="Học sinh tự đăng ký, được admin gán vào lớp bạn"
                          className="inline-flex items-center rounded-md bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 text-[9px] font-black text-indigo-700"
                        >
                          TỰ ĐK
                        </span>
                      )}
                    </p>
                    {student.class_name && <p className="text-xs text-gray-500">{student.class_name}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {student.student_code || "—"}
                      </span>
                      <span className="text-xs text-green-600 flex items-center gap-0.5"><UserCheck size={10} /> Hoạt động</span>
                    </div>
                    {student.assigned_path_ids && student.assigned_path_ids.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(() => {
                          const paths = learningPaths.filter(p => student.assigned_path_ids.includes(p.id));
                          return paths.length > 0
                            ? paths.map(path => (
                                <span key={path.id} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                  Lộ trình: {path.title}
                                </span>
                              ))
                            : <span className="text-xs text-gray-400">Đã gán lộ trình</span>;
                        })()}
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-medium">Mã phụ huynh:</span>
                      {student.parent_access_code ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setParentLinkTarget({ id: student.id, nickname: student.nickname, parent_access_code: student.parent_access_code })}
                            className="inline-flex items-center rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200 font-mono hover:bg-indigo-100 transition cursor-pointer"
                            title="Xem chi tiết và quản lý mã phụ huynh"
                          >
                            {student.parent_access_code}
                          </button>
                          <button
                            onClick={() => {
                              const origin = typeof window !== "undefined" ? window.location.origin : "";
                              navigator.clipboard.writeText(`${origin}/parent?code=${student.parent_access_code}`);
                              alert("Đã sao chép liên kết phụ huynh!");
                            }}
                            className="text-slate-400 hover:text-indigo-600 p-0.5"
                            title="Sao chép liên kết phụ huynh"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setParentLinkTarget({ id: student.id, nickname: student.nickname, parent_access_code: student.parent_access_code })}
                          className="text-xs font-semibold text-sky-600 hover:text-sky-800 underline"
                        >
                          + Tạo mã
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {learningPaths.length > 0 && (
                      <button onClick={() => { setAssignTarget(student.id); setAssignPathIds(student.assigned_path_ids || []); }} className="Btn Btn--ghost Btn--sm" title="Gán lộ trình">
                        <Plus size={14} />
                      </button>
                    )}
                    <button onClick={() => openResetPassword(student)} className="Btn Btn--ghost Btn--sm text-amber-600" title="Đổi mật khẩu">
                      <KeyRound size={14} />
                    </button>
                    <button onClick={() => setParentLinkTarget({ id: student.id, nickname: student.nickname, parent_access_code: student.parent_access_code })} className="Btn Btn--ghost Btn--sm text-indigo-600" title="Mã liên kết phụ huynh">
                      <Users size={14} />
                    </button>
                    <button onClick={() => handleDelete(student)} className="Btn Btn--ghost Btn--sm text-red-500" title={student.source === "self" ? "Bỏ khỏi lớp" : "Xóa"}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {assignTarget === student.id && (
                  <div className="pt-2 border-t border-gray-200 space-y-2.5">
                    <label className="text-xs font-bold text-sky-900">Chọn lộ trình học tập:</label>
                    <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto border border-sky-100 bg-white p-2 rounded-xl">
                      {learningPaths.map(p => {
                        const isChecked = assignPathIds.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 text-xs font-bold text-sky-950 cursor-pointer py-1 px-2 rounded hover:bg-sky-50 transition-all">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignPathIds([...assignPathIds, p.id]);
                                } else {
                                  setAssignPathIds(assignPathIds.filter(id => id !== p.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <span>{p.title}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => handleAssign(student.id)} className="Btn Btn--primary Btn--sm text-xs">Gán</button>
                      <button onClick={() => { setAssignTarget(null); setAssignPathIds([]); }} className="Btn Btn--secondary Btn--sm text-xs">Hủy</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeResetPassword(); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <KeyRound size={18} className="text-amber-600" />
                Đổi mật khẩu học sinh
              </h3>
              <button onClick={closeResetPassword} className="Btn Btn--ghost Btn--sm" disabled={resetLoading}>
                <X size={14} />
              </button>
            </div>

            <p className="text-sm text-slate-500">
              Học sinh: <strong className="text-slate-800">{resetTarget.nickname}</strong>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <label className="space-y-1 block">
                <span className="text-sm font-medium text-gray-700">Mật khẩu mới</span>
                <input
                  className="Input w-full"
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  placeholder="Ít nhất 6 ký tự"
                  autoFocus
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</span>
                <input
                  className="Input w-full"
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </label>

              {resetError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  {resetSuccess}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={closeResetPassword} className="Btn Btn--secondary Btn--sm" disabled={resetLoading}>
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || !resetForm.newPassword || !resetForm.confirmPassword}
                  className="Btn Btn--primary Btn--sm flex items-center gap-1"
                >
                  {resetLoading ? "Đang đổi..." : <><KeyRound size={14} /> Đổi mật khẩu</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssign && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowBulkAssign(false); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Route size={18} className="text-indigo-600" />
                Gán lộ trình hàng loạt
              </h3>
              <button onClick={() => setShowBulkAssign(false)} className="Btn Btn--ghost Btn--sm">
                <X size={14} />
              </button>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-sm text-indigo-700 mb-2">
                <strong>{selectedStudents.size}</strong> học sinh đã được chọn
              </p>
              <p className="text-xs text-indigo-600">
                Chọn lộ trình để gán cho tất cả các em:
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-gray-700">Lộ trình học tập</label>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto border border-sky-100 bg-white p-2.5 rounded-xl">
                {learningPaths.map(p => {
                  const isChecked = assignPathIds.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-xs font-bold text-sky-950 cursor-pointer py-1 px-2 rounded hover:bg-sky-50 transition-all">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignPathIds([...assignPathIds, p.id]);
                          } else {
                            setAssignPathIds(assignPathIds.filter(id => id !== p.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <span>{p.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {bulkAssignSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm text-center">
                {bulkAssignSuccess}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkAssign(false)}
                className="Btn Btn--secondary Btn--sm"
                disabled={bulkAssignLoading}
              >
                Hủy
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={assignPathIds.length === 0 || selectedStudents.size === 0 || bulkAssignLoading}
                className="Btn Btn--primary Btn--sm flex items-center gap-1"
              >
                {bulkAssignLoading ? (
                  "Đang gán..."
                ) : (
                  <>
                    <Route size={14} /> Gán cho {selectedStudents.size} học sinh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parent Link Modal */}
      {parentLinkTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !parentLinkLoading) setParentLinkTarget(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Mã liên kết Phụ huynh
              </h3>
              <button onClick={() => setParentLinkTarget(null)} className="Btn Btn--ghost Btn--sm" disabled={parentLinkLoading}>
                <X size={14} />
              </button>
            </div>

            <p className="text-sm text-slate-500">
              Học sinh: <strong className="text-slate-800">{parentLinkTarget.nickname}</strong>
            </p>

            <div className="space-y-4">
              {parentLinkTarget.parent_access_code ? (
                <>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-500 block">Mã phụ huynh (Parent Access Code)</span>
                    <div className="flex gap-2 items-center">
                      <span className="font-mono font-bold text-lg bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 flex-1 text-sky-800 select-all text-center">
                        {parentLinkTarget.parent_access_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(parentLinkTarget.parent_access_code!, "code")}
                        className="Btn Btn--secondary Btn--sm flex items-center gap-1"
                        title="Copy mã"
                      >
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-500 block">Link xem trực tiếp cho phụ huynh</span>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        readOnly
                        value={typeof window !== "undefined" ? `${window.location.origin}/parent?code=${parentLinkTarget.parent_access_code}` : `/parent?code=${parentLinkTarget.parent_access_code}`}
                        className="Input font-mono text-xs flex-1 bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const origin = typeof window !== "undefined" ? window.location.origin : "";
                          copyToClipboard(`${origin}/parent?code=${parentLinkTarget.parent_access_code}`, "link");
                        }}
                        className="Btn Btn--secondary Btn--sm flex items-center gap-1"
                        title="Copy link"
                      >
                        <Share2 size={14} /> Copy
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const origin = typeof window !== "undefined" ? window.location.origin : "";
                        const message = `Xin chào phụ huynh, đây là thông tin tra cứu tiến độ học tập an toàn số của con (${parentLinkTarget.nickname}) trên hệ thống Bé An Toàn Số:\n\n- Mã liên kết của con: ${parentLinkTarget.parent_access_code}\n- Link tra cứu trực tiếp: ${origin}/parent?code=${parentLinkTarget.parent_access_code}\n\nPhụ huynh chỉ cần truy cập vào đường dẫn trên hoặc vào trang chủ mục Cổng Phụ Huynh để theo dõi kết quả của con nhé!`;
                        copyToClipboard(message, "link");
                      }}
                      className="Btn Btn--outline w-full justify-center text-xs font-semibold py-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1.5"
                    >
                      <Share2 size={14} /> Copy tin nhắn gửi phụ huynh
                    </button>
                  </div>

                  {parentLinkCopied && (
                    <div className="text-xs text-emerald-600 font-bold text-center animate-pulse">
                      ✓ Đã copy thành công!
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex gap-2 justify-between">
                    <button
                      type="button"
                      disabled={parentLinkLoading}
                      onClick={() => handleParentLinkAction("regenerate")}
                      className="Btn Btn--outline Btn--sm text-amber-600 border-amber-200 hover:bg-amber-50 text-xs"
                    >
                      {parentLinkLoading ? "Đang tạo lại..." : "Tạo lại mã mới"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setParentLinkTarget(null)}
                      className="Btn Btn--primary Btn--sm text-xs"
                    >
                      Hoàn tất
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-600 font-medium">
                    * Lưu ý: Khi tạo mã mới, mã và liên kết cũ của phụ huynh sẽ hết hiệu lực ngay lập tức.
                  </p>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="text-slate-400 text-sm">
                    Học sinh này chưa được tạo mã liên kết phụ huynh.
                  </div>
                  <button
                    type="button"
                    disabled={parentLinkLoading}
                    onClick={() => handleParentLinkAction("ensure")}
                    className="Btn Btn--primary w-full justify-center py-2 flex items-center gap-2"
                  >
                    {parentLinkLoading ? "Đang tạo..." : <><Users size={16} /> Tạo mã phụ huynh</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddStudentModal
          existingCodes={new Set(students.map((s) => s.student_code))}
          onClose={() => setShowAddModal(false)}
          onCreated={async () => {
            setShowAddModal(false);
            await fetchStudents();
          }}
        />
      )}
    </div>
  );
}

// ── Add Single Student Modal ──────────────────────────────────────────────────
function AddStudentModal({
  existingCodes,
  onClose,
  onCreated,
}: {
  existingCodes: Set<string>;
  onClose: () => void;
  onCreated: (credentials: { nickname: string; student_code: string; password: string }) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [className, setClassName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ student_code: string; password: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nickname.trim()) return setError("Vui lòng nhập tên học sinh");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Email không hợp lệ");
    if (studentCode && existingCodes.has(studentCode.trim())) return setError(`Mã "${studentCode}" đã tồn tại`);
    if (password && password.length < 6) return setError("Mật khẩu phải có ít nhất 6 ký tự");

    setLoading(true);
    try {
      // Reuse the bulk import validator so codes/passwords are auto-generated
      // when omitted, and shape matches /api/teacher/students exactly.
      const { validateAndPrepareImport } = await import("@/lib/excelParser");
      const { valid, errors } = validateAndPrepareImport(
        [{ nickname: nickname.trim(), email: email.trim() || undefined, class_name: className.trim() || undefined, student_code: studentCode.trim() || undefined, password: password || undefined }],
        existingCodes,
      );
      if (errors.length > 0) {
        setError(errors[0].message);
        return;
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ students: valid }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? `Lỗi ${res.status}`);
        return;
      }
      const created = body.created?.[0];
      if (created) {
        setSuccess({ student_code: created.student_code, password: created.password });
        onCreated(created);
      } else {
        setError(body.result?.errors?.[0]?.message ?? "Không tạo được học sinh");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="text-center space-y-3">
            <div className="text-4xl">🎉</div>
            <h3 className="text-lg font-black text-emerald-700">Đã tạo học sinh</h3>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 space-y-2 text-left">
              <div className="text-xs font-bold text-emerald-800">Thông tin đăng nhập:</div>
              <div className="font-mono text-sm"><span className="text-slate-500">Mã HS:</span> <strong>{success.student_code}</strong></div>
              <div className="font-mono text-sm"><span className="text-slate-500">Mật khẩu:</span> <strong>{success.password}</strong></div>
              <p className="text-[11px] text-amber-700 font-semibold pt-2">⚠️ Hãy chép lại — sau khi đóng sẽ không xem lại được.</p>
            </div>
            <button onClick={onClose} className="Btn Btn--primary w-full justify-center">Đóng</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <UserPlus size={20} className="text-emerald-600" /> Thêm học sinh mới
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-black text-slate-600 mb-1">Tên học sinh <span className="text-rose-500">*</span></label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} required autoFocus
              className="Input w-full rounded-lg border-2 border-slate-200 focus:border-emerald-500 p-2 text-sm"
              placeholder="Ví dụ: Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 mb-1">Email (tuỳ chọn)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="Input w-full rounded-lg border-2 border-slate-200 focus:border-emerald-500 p-2 text-sm"
              placeholder="example@email.com" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 mb-1">Lớp (tuỳ chọn)</label>
            <input value={className} onChange={(e) => setClassName(e.target.value)}
              className="Input w-full rounded-lg border-2 border-slate-200 focus:border-emerald-500 p-2 text-sm"
              placeholder="Ví dụ: 5A" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 mb-1">Mã học sinh (để trống → tự sinh)</label>
            <input value={studentCode} onChange={(e) => setStudentCode(e.target.value)}
              className="Input w-full rounded-lg border-2 border-slate-200 focus:border-emerald-500 p-2 text-sm font-mono"
              placeholder="HS001" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 mb-1">Mật khẩu (để trống → tự sinh)</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
              className="Input w-full rounded-lg border-2 border-slate-200 focus:border-emerald-500 p-2 text-sm font-mono"
              placeholder="Tối thiểu 6 ký tự" />
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold">
              ❌ {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="Btn Btn--primary flex-1 justify-center">
              {loading ? "Đang tạo..." : "Tạo học sinh"}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="Btn Btn--outline">Huỷ</button>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold text-center">
            Học sinh sẽ được tự động gán cho giáo viên đang đăng nhập.
          </p>
        </form>
      </div>
    </div>
  );
}
