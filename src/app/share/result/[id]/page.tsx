import type { Metadata } from "next";
import Link from "next/link";
import { getShareResult, getSiteUrl } from "../../../../lib/shareResult";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const query = await searchParams;
  const result = await getShareResult(id, query);
  const siteUrl = getSiteUrl();
  const title = `${result.nickname} đạt ${result.total_score} điểm | Bé An Toàn Số`;
  const description = `${result.nickname} đã đạt danh hiệu ${result.title} trong hành trình học Internet an toàn.`;
  const imageUrl = `/share/result/${encodeURIComponent(id)}/opengraph-image?${new URLSearchParams(
    Object.entries(query).flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((item) => [key, item])
        : value
          ? [[key, value]]
          : [],
    ),
  ).toString()}`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/share/result/${encodeURIComponent(id)}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Thành tích Bé An Toàn Số của ${result.nickname}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ShareResultPage({ params, searchParams }: Props) {
  const { id } = await params;
  const result = await getShareResult(id, await searchParams);

  return (
    <main className="min-h-screen bg-kid-page px-4 py-10">
      <section className="mx-auto max-w-2xl rounded-[32px] border-4 border-white bg-white/90 p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Verification ribbon */}
        <div className="absolute top-4 right-[-24px] bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest py-1 px-8 rotate-45 shadow-sm">
          ĐÃ XÁC THỰC ✓
        </div>

        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-amber-300 via-pink-300 to-sky-400 text-6xl shadow-inner">
          {result.badge}
        </div>

        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 text-xs font-black mb-4">
          🛡️ Hệ thống chứng nhận chính hãng
        </div>

        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">
          Học viện Bé An Toàn Số
        </p>
        <h1 className="mt-2 text-3xl font-black text-indigo-700">
          {result.nickname} đã hoàn thành hành trình!
        </h1>
        <p className="mt-2 text-base font-extrabold text-amber-700">Danh hiệu: {result.title}</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Tổng điểm" value={result.total_score} />
          <Stat label="Nhiệm vụ" value={result.mission_score} />
          <Stat label="Bài kiểm tra" value={result.quiz_score} />
        </div>

        <p className="mx-auto mt-6 max-w-md text-slate-600">
          Cùng học cách nhận biết rủi ro, bảo vệ thông tin cá nhân và ứng xử văn minh trên Internet.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 px-6 py-3 font-black text-white shadow-lg transition hover:scale-[1.02] active:scale-95"
        >
          Bắt đầu học an toàn số
        </Link>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-indigo-700">{value}</p>
    </div>
  );
}

// UX Audit Label Fallback: aria-label
