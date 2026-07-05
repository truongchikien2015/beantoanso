"use client";

import { useState, useEffect, useCallback } from "react";

interface Student {
  _id: string;
  nickname: string;
  class_name: string | null;
  student_code: string;
}

interface ClassSetting {
  class_name: string;
  hourly_rate: number;
}

interface Session {
  _id: string;
  class_name: string;
  session_date: string;
  duration_hours: number;
  total_cost: number;
}

export function AttendanceManager() {
  const [classes, setClasses] = useState<ClassSetting[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [hourlyRateInput, setHourlyRateInput] = useState<number>(0);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classNames, setClassNames] = useState<string[]>([]);
  
  // Attendance state for current session creation
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent">>({});
  const [duration, setDuration] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;

  const fetchStudents = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/teacher/students", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllStudents(data);
        const names = new Set<string>();
        data.forEach((s: Student) => {
          if (s.class_name) names.add(s.class_name);
        });
        setClassNames(Array.from(names));
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchClassSettings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/teacher/classes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    fetchClassSettings();
    fetchStudents();
  }, [fetchClassSettings, fetchStudents]);

  useEffect(() => {
    if (selectedClass) {
      const filtered = allStudents.filter(s => s.class_name === selectedClass);
      setStudents(filtered);

      // Initialize all present
      const initialAtt: Record<string, "present" | "absent"> = {};
      filtered.forEach(s => { initialAtt[s._id] = "present"; });
      setAttendance(initialAtt);

      const existingClass = classes.find(c => c.class_name === selectedClass);
      setHourlyRateInput(existingClass?.hourly_rate || 0);

      fetchSessions(selectedClass);
    } else {
      setStudents([]);
      setSessions([]);
    }
  }, [selectedClass, classes]);

  const fetchSessions = async (className: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/teacher/attendance/sessions?class_name=${encodeURIComponent(className)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveHourlyRate = async () => {
    if (!token || !selectedClass) return;
    setMessage("Đang lưu...");
    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ class_name: selectedClass, hourly_rate: hourlyRateInput })
      });
      if (res.ok) {
        setMessage("Đã lưu mức giá học phí!");
        fetchClassSettings();
      } else {
        setMessage("Lỗi khi lưu.");
      }
    } catch (e) {
      setMessage("Lỗi kết nối.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const createSession = async () => {
    if (!token || !selectedClass) return;
    setLoading(true);
    try {
      const records = Object.entries(attendance).map(([student_id, status]) => ({ student_id, status }));
      const res = await fetch("/api/teacher/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ class_name: selectedClass, duration_hours: duration, records })
      });
      
      if (res.ok) {
        setMessage("Đã lưu điểm danh thành công!");
        fetchSessions(selectedClass);
      } else {
        setMessage("Lỗi khi điểm danh.");
      }
    } catch (e) {
      setMessage("Lỗi kết nối.");
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#0060ac]">Quản lý Điểm danh & Học phí</h2>
        {message && <div className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-lg">{message}</div>}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Lớp học</label>
            <select 
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-[#0060ac] focus:ring-1 focus:ring-[#0060ac] outline-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">-- Chọn lớp --</option>
              {classNames.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Học phí / giờ (VNĐ)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-[#0060ac] outline-none"
                  value={hourlyRateInput}
                  onChange={(e) => setHourlyRateInput(Number(e.target.value))}
                />
              </div>
              <button onClick={saveHourlyRate} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition h-[42px]">
                Lưu mức giá
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Session / Attendance form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Tạo Buổi học (Điểm danh)</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Số giờ:</span>
                <input 
                  type="number" 
                  step="0.5"
                  className="w-20 px-2 py-1 border border-slate-300 rounded outline-none"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
              {students.map(s => (
                <div key={s._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-bold text-slate-700">{s.nickname}</div>
                    <div className="text-xs text-slate-400">Mã HS: {s.student_code}</div>
                  </div>
                  <button 
                    onClick={() => setAttendance(prev => ({ ...prev, [s._id]: prev[s._id] === 'present' ? 'absent' : 'present' }))}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                      attendance[s._id] === 'present' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {attendance[s._id] === 'present' ? '✅ Có mặt' : '❌ Vắng'}
                  </button>
                </div>
              ))}
              {students.length === 0 && <p className="text-slate-500 italic text-sm">Không có học sinh nào trong lớp này.</p>}
            </div>

            <button 
              onClick={createSession}
              disabled={loading || students.length === 0}
              className="w-full py-3 bg-[#0060ac] hover:bg-[#005090] text-white font-bold rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Lưu Điểm danh"}
            </button>
          </div>

          {/* History */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Lịch sử Buổi học</h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {sessions.map(s => (
                <div key={s._id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-700">{new Date(s.session_date).toLocaleDateString('vi-VN')} {new Date(s.session_date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                    <div className="text-sm text-slate-500">Thời lượng: {s.duration_hours} giờ</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[#0060ac]">{s.total_cost.toLocaleString()} đ</div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && <p className="text-slate-500 italic text-sm">Chưa có buổi học nào.</p>}
            </div>
            {sessions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-600">Tổng doanh thu lớp:</span>
                <span className="text-xl font-black text-green-600">
                  {sessions.reduce((acc, curr) => acc + curr.total_cost, 0).toLocaleString()} đ
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
