import { useState } from "react";
import { Admin } from "../../lib/store";
import { sfx } from "../../lib/sound";

export function AdminLogin({
  onSuccess,
  onBack,
}: {
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (Admin.login(pw)) {
      sfx.correct();
      onSuccess();
    } else {
      sfx.wrong();
      setError("Mật khẩu không đúng");
    }
  };

  return (
    <div className="app-page flex items-center justify-center p-4">
      <div className="Card w-full max-w-md p-8">
        <button onClick={onBack} className="text-sky-700 font-bold hover:underline mb-4">
          ← Trang chủ
        </button>
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🔐</div>
          <h2 className="text-sky-900 font-black">Quản trị viên</h2>
          <p className="text-slate-500">
            Nhập mật khẩu để vào trang quản lý câu hỏi
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Mật khẩu admin"
            className="Input"
          />
          {error && <p className="text-rose-600">{error}</p>}
          <button
            onClick={handleSubmit}
            className="Btn BtnPrimary w-full justify-center py-3"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
