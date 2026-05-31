"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTeacherContentStore } from "@/lib/teacherContentStore";
import { supabase } from "@/lib/supabase";
import { parseStudentFile, validateAndPrepareImport } from "@/lib/excelParser";
import { Download, Upload, Trash2, UserCheck, Plus, X, Check, AlertCircle, Route, Search, SlidersHorizontal, RotateCcw, LayoutGrid, List, KeyRound } from "lucide-react";

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
  } = useTeacherContentStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<{ errors: Array<{ row: number; message: string }> } | null>(null);
  const [importedCredentials, setImportedCredentials] = useState<ImportedCredential[] | null>(null);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [assignPathId, setAssignPathId] = useState("");
  const [resetTarget, setResetTarget] = useState<{ id: string; nickname: string } | null>(null);
  const [resetForm, setResetForm] = useState({ newPassword: "", confirmPassword: "" });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Multi-select state for bulk assign
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [bulkAssignSuccess, setBulkAssignSuccess] = useState("");

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
      if (statusFilter === "assigned" && !s.assigned_path_id) return false;
      if (statusFilter === "unassigned" && s.assigned_path_id) return false;

      // Path filter
      if (pathFilter && s.assigned_path_id !== pathFilter) return false;

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
      const rows = await parseStudentFile(file);
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

      const { data: sessionData } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } };
      const token = sessionData.session?.access_token;

      // Call API to import
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ students: valid }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setImportError({ errors: [{ row: 0, message: body.error ?? "Lỗi nhập học sinh" }] });
        return;
      }

      const body = await res.json();

      // Show credentials
      if (body.created && body.created.length > 0) {
        setImportedCredentials(body.created);
      }

      // Show errors
      if (body.result?.failed > 0) {
        setImportError({ errors: body.result.errors ?? [] });
      }

      // Refresh student list
      await fetchStudents();

    } catch (err) {
      setImportError({ errors: [{ row: 0, message: `Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}` }] });
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

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa học sinh này?")) return;
    await deleteStudent(id);
  };

  const handleAssign = async (studentId: string) => {
    if (!assignPathId) return;
    await assignPathToStudent(studentId, assignPathId);
    setAssignTarget(null);
    setAssignPathId("");
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
    if (!assignPathId || selectedStudents.size === 0) return;
    setBulkAssignLoading(true);
    setBulkAssignSuccess("");
    try {
      const { data: sessionData } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } };
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/teacher/learning-paths/${assignPathId}/assign-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ studentIds: Array.from(selectedStudents) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi gán lộ trình");
      setBulkAssignSuccess(`Đã gán lộ trình cho ${data.assignedCount} học sinh!`);
      setSelectedStudents(new Set());
      setShowBulkAssign(false);
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
          <button onClick={downloadTemplate} className="Btn Btn--outline Btn--sm flex items-center gap-1">
            <Download size={14} /> Tải mẫu CSV
          </button>
          <label className="Btn Btn--primary Btn--sm flex items-center gap-1 cursor-pointer">
            <Upload size={14} /> Nhập từ Excel
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange}
              className="hidden" disabled={importing} />
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
        {students.length === 0 && !importedCredentials && (
          <div className="Card p-8 text-center text-gray-500 text-sm">
            Chưa có học sinh nào. Tải mẫu CSV để bắt đầu.
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
            <div className="hidden grid-cols-[44px_1.2fr_0.55fr_0.7fr_1.2fr_132px] gap-3 bg-sky-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-sky-900 md:grid">
              <span></span>
              <span>Học sinh</span>
              <span>Lớp</span>
              <span>Mã</span>
              <span>Lộ trình</span>
              <span className="text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-sky-50">
              {filteredStudents.map(student => {
                const path = learningPaths.find(p => p.id === student.assigned_path_id);
                return (
                  <div key={student.id} className={`grid gap-3 px-4 py-3 transition hover:bg-sky-50/50 md:grid-cols-[44px_1.2fr_0.55fr_0.7fr_1.2fr_132px] md:items-center ${selectedStudents.has(student.id) ? "bg-indigo-50/70" : ""}`}>
                    <div className="flex items-center justify-between md:block">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelect(student.id)}
                        className="h-5 w-5 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label={`Chọn ${student.nickname}`}
                      />
                      <div className="flex gap-1 md:hidden">
                        {!student.assigned_path_id && learningPaths.length > 0 && (
                          <button onClick={() => { setAssignTarget(student.id); setAssignPathId(""); }} className="Btn Btn--ghost Btn--sm" title="Gán lộ trình">
                            <Plus size={14} />
                          </button>
                        )}
                        <button onClick={() => openResetPassword(student)} className="Btn Btn--ghost Btn--sm text-amber-600" title="Đổi mật khẩu">
                          <KeyRound size={14} />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="Btn Btn--ghost Btn--sm text-red-500" title="Xóa">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{student.nickname}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600"><UserCheck size={11} /> Hoạt động</p>
                    </div>
                    <span className="text-sm text-slate-600">{student.class_name || "Chưa có lớp"}</span>
                    <span className="w-fit rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">{student.student_code}</span>
                    <div className="min-w-0">
                      {path ? (
                        <span className="inline-flex max-w-full items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                          <span className="truncate">{path.title}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Chưa gán lộ trình</span>
                      )}
                    </div>
                    <div className="hidden justify-end gap-1 md:flex">
                      {!student.assigned_path_id && learningPaths.length > 0 && (
                        <button onClick={() => { setAssignTarget(student.id); setAssignPathId(""); }} className="Btn Btn--ghost Btn--sm" title="Gán lộ trình">
                          <Plus size={14} />
                        </button>
                      )}
                      <button onClick={() => openResetPassword(student)} className="Btn Btn--ghost Btn--sm text-amber-600" title="Đổi mật khẩu">
                        <KeyRound size={14} />
                      </button>
                      <button onClick={() => handleDelete(student.id)} className="Btn Btn--ghost Btn--sm text-red-500" title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {assignTarget === student.id && (
                      <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 md:col-span-6">
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                          <select className="Input w-full text-sm" value={assignPathId} onChange={e => setAssignPathId(e.target.value)}>
                            <option value="">-- Chọn lộ trình --</option>
                            {learningPaths.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                          </select>
                          <button onClick={() => handleAssign(student.id)} disabled={!assignPathId} className="Btn Btn--primary Btn--sm text-xs">Gán</button>
                          <button onClick={() => { setAssignTarget(null); setAssignPathId(""); }} className="Btn Btn--secondary Btn--sm text-xs">Hủy</button>
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
                    <p className="font-medium text-gray-900 truncate">{student.nickname}</p>
                    {student.class_name && <p className="text-xs text-gray-500">{student.class_name}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {student.student_code}
                      </span>
                      <span className="text-xs text-green-600 flex items-center gap-0.5"><UserCheck size={10} /> Hoạt động</span>
                    </div>
                    {student.assigned_path_id && (
                      <div className="mt-1">
                        {(() => {
                          const path = learningPaths.find(p => p.id === student.assigned_path_id);
                          return path
                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                Lộ trình: {path.title}
                              </span>
                            : <span className="text-xs text-gray-400">Đã gán lộ trình</span>;
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!student.assigned_path_id && learningPaths.length > 0 && (
                      <button onClick={() => { setAssignTarget(student.id); setAssignPathId(""); }} className="Btn Btn--ghost Btn--sm" title="Gán lộ trình">
                        <Plus size={14} />
                      </button>
                    )}
                    <button onClick={() => openResetPassword(student)} className="Btn Btn--ghost Btn--sm text-amber-600" title="Đổi mật khẩu">
                      <KeyRound size={14} />
                    </button>
                    <button onClick={() => handleDelete(student.id)} className="Btn Btn--ghost Btn--sm text-red-500" title="Xóa">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {assignTarget === student.id && (
                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <select className="Input w-full text-sm" value={assignPathId} onChange={e => setAssignPathId(e.target.value)}>
                      <option value="">-- Chọn lộ trình --</option>
                      {learningPaths.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <button onClick={() => handleAssign(student.id)} disabled={!assignPathId} className="Btn Btn--primary Btn--sm text-xs">Gán</button>
                      <button onClick={() => { setAssignTarget(null); setAssignPathId(""); }} className="Btn Btn--secondary Btn--sm text-xs">Hủy</button>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lộ trình học tập</label>
              <select
                className="Input w-full"
                value={assignPathId}
                onChange={e => setAssignPathId(e.target.value)}
              >
                <option value="">-- Chọn lộ trình --</option>
                {learningPaths.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
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
                disabled={!assignPathId || selectedStudents.size === 0 || bulkAssignLoading}
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
    </div>
  );
}
