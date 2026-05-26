import { useEffect, useMemo, useRef, useState } from "react";
import { getBadge, missions } from "../data/gameData";
import { toPng } from "html-to-image";
import { createShareQuery, getSiteUrl } from "../lib/shareResultQuery";

type Props = {
  nickname: string;
  missionScore: number;
  missionsDone: number;
  quizCorrect: number;
  quizScore: number;
  quizTotal: number;
  rank: number;
  resultId?: string;
  onCertificate: () => void;
  onLeaderboard: () => void;
  onReplay: () => void;
};

export function ResultScreen({
  nickname,
  missionScore,
  missionsDone,
  quizCorrect,
  quizScore,
  quizTotal,
  rank,
  resultId,
  onCertificate,
  onLeaderboard,
  onReplay,
}: Props) {
  const total = missionScore + quizScore;
  const badge = getBadge(total);
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [nativeShareSupported, setNativeShareSupported] = useState(false);

  const shareResult = useMemo(
    () => ({
      id: resultId || "preview",
      nickname,
      mission_score: missionScore,
      quiz_score: quizScore,
      total_score: total,
      title: badge.title,
      badge: badge.emoji,
    }),
    [badge.emoji, badge.title, missionScore, nickname, quizScore, resultId, total],
  );

  const sharePath = `/share/result/${encodeURIComponent(shareResult.id)}?${createShareQuery(shareResult)}`;
  const shareText = `Chúc mừng ${nickname} đã đạt danh hiệu ${badge.title} với ${total} điểm trong Bé An Toàn Số!`;

  const getShareUrl = () => {
    const publicSiteUrl = getSiteUrl();
    const origin =
      publicSiteUrl.startsWith("http://localhost") ||
      publicSiteUrl.startsWith("http://127.0.0.1")
        ? window.location.origin
        : publicSiteUrl;

    return new URL(sharePath, origin).toString();
  };

  const isLocalShareUrl = (url: string) => {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  };

  useEffect(() => {
    if (!("share" in navigator) || !("canShare" in navigator)) return;

    try {
      const file = new File([""], "achievement.png", { type: "image/png" });
      setNativeShareSupported(navigator.canShare({ files: [file] }));
    } catch {
      setNativeShareSupported(false);
    }
  }, []);

  const createAchievementImage = async () => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
  };

  const downloadImage = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `thanh-tich-${nickname}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadImage = async () => {
    setSharing(true);
    try {
      const dataUrl = await createAchievementImage();
      if (!dataUrl) return;
      downloadImage(dataUrl);
    } catch (err) {
      console.error('Error creating achievement image:', err);
      alert('Không thể tạo ảnh lúc này. Vui lòng thử lại!');
    } finally {
      setSharing(false);
    }
  };

  const handleNativeShare = async () => {
    setSharing(true);
    try {
      const dataUrl = await createAchievementImage();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'be-an-toan-so-thanh-tich.png', { type: blob.type });
      const shareData = {
        title: 'Thành tích Bé An Toàn Số',
        text: shareText,
        url: getShareUrl(),
        files: [file],
      };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }

      downloadImage(dataUrl);
    } catch (err) {
      const error = err as { name?: string };
      if (error.name !== "AbortError") {
        console.error('Error sharing image:', err);
        alert('Không thể chia sẻ lúc này. Ảnh sẽ được tải xuống để em đăng thủ công nhé!');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleFacebookShare = () => {
    const shareUrl = getShareUrl();
    if (isLocalShareUrl(shareUrl)) {
      alert('Facebook cần URL công khai để đọc ảnh xem trước. Hãy cấu hình NEXT_PUBLIC_SITE_URL bằng domain đã deploy, hoặc tải ảnh để đăng thủ công.');
      return;
    }

    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div 
        ref={cardRef}
        className="bg-white rounded-3xl p-6 shadow-xl border-4 border-amber-200 text-center relative overflow-hidden"
      >
        <div className="text-6xl mb-2">{badge.emoji}</div>
        <h2 className="text-indigo-700 mb-1">Chúc mừng {nickname}!</h2>
        <p className="text-slate-600 mb-2">Em đã hoàn thành hành trình.</p>
        {rank > 0 && (
          <p className="text-amber-700 mb-4">
            🏆 Hạng hiện tại của em: <span className="text-2xl">#{rank}</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 my-6">
          <Stat label="Tổng điểm" value={`${total}`} color="from-pink-400 to-rose-500" />
          <Stat
            label="Danh hiệu"
            value={badge.title}
            color="from-amber-400 to-orange-500"
            small
          />
          <Stat
            label="Chặng hoàn thành"
            value={`${missionsDone}/${missions.length}`}
            color="from-emerald-400 to-teal-500"
          />
          <Stat
            label="Bài kiểm tra đúng"
            value={`${quizCorrect}/${quizTotal}`}
            color="from-sky-400 to-indigo-500"
          />
        </div>
        
        {/* Only show logo when generating image */}
        <div className="absolute bottom-2 right-4 opacity-10 text-xl font-bold italic hidden print:block">
          Bé An Toàn Số
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        <button
          onClick={() => setShareOpen((open) => !open)}
          disabled={sharing}
          aria-expanded={shareOpen}
          aria-controls="result-share-actions"
          className="py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
        >
          {sharing ? "⏳ Đang tạo ảnh..." : "📸 Chia sẻ thành tích"}
        </button>
        <button
          onClick={onCertificate}
          className="py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:scale-[1.02] active:scale-95 transition"
        >
          📜 Nhận chứng nhận
        </button>
        <button
          onClick={onLeaderboard}
          className="py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:scale-[1.02] active:scale-95 transition"
        >
          🏆 Xem bảng xếp hạng
        </button>
        <button
          onClick={onReplay}
          className="py-3 rounded-2xl bg-white border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 active:scale-95 transition"
        >
          🔄 Chơi lại
        </button>
      </div>

      {shareOpen && (
        <div
          id="result-share-actions"
          className="mt-3 rounded-3xl border-2 border-sky-100 bg-white p-4 shadow-lg"
        >
          <p className="mb-3 text-center text-sm font-bold text-slate-500">
            Chọn cách chia sẻ phù hợp với thiết bị của em
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={handleFacebookShare}
              className="rounded-2xl bg-[#1877F2] px-4 py-3 font-bold text-white shadow transition hover:scale-[1.02] active:scale-95"
            >
              Facebook
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={sharing}
              className="rounded-2xl bg-amber-100 px-4 py-3 font-bold text-amber-800 shadow transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              Tải ảnh
            </button>
            {nativeShareSupported && (
              <button
                onClick={handleNativeShare}
                disabled={sharing}
                className="rounded-2xl bg-emerald-100 px-4 py-3 font-bold text-emerald-800 shadow transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                Chia sẻ máy
              </button>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            Facebook dùng trang thành tích công khai; ảnh tải xuống dùng để đăng thủ công khi cần.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 text-white bg-gradient-to-br ${color} shadow-md`}
    >
      <p className="opacity-80">{label}</p>
      <p className={small ? "text-lg font-bold" : "text-2xl"}>{value}</p>
    </div>
  );
}
