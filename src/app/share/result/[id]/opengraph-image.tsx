import { ImageResponse } from "next/og";
import { getShareResult } from "../../../../lib/shareResult";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Image({ params, searchParams }: Props) {
  const { id } = await params;
  const result = await getShareResult(id, await searchParams);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #e0f2fe 0%, #fce7f3 48%, #fef3c7 100%)",
          fontFamily: "Arial, sans-serif",
          padding: 54,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: 48,
            border: "10px solid white",
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 30px 80px rgba(30, 41, 59, 0.22)",
            padding: 56,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #fbbf24, #f472b6, #38bdf8)",
                fontSize: 72,
              }}
            >
              {result.badge}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  color: "#0284c7",
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                }}
              >
                Bé An Toàn Số
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  color: "#4338ca",
                  fontSize: 54,
                  fontWeight: 900,
                  lineHeight: 1.05,
                }}
              >
                {`${result.nickname} đã hoàn thành hành trình!`}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 32,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ color: "#b45309", fontSize: 38, fontWeight: 900 }}>
                {result.title}
              </div>
              <div style={{ color: "#64748b", fontSize: 28, fontWeight: 700 }}>
                Học Internet an toàn, vui mà nhớ lâu.
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 260,
                height: 160,
                borderRadius: 34,
                background: "linear-gradient(135deg, #4ade80, #38bdf8)",
                color: "white",
                flexDirection: "column",
                boxShadow: "0 18px 36px rgba(56,189,248,0.35)",
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 800 }}>Tổng điểm</div>
              <div style={{ fontSize: 76, fontWeight: 900 }}>{result.total_score}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
