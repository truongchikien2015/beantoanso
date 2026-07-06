import { NextResponse } from "next/server";
import { createChatCompletion } from "../../../../lib/server/aiProvider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Risk = "green" | "yellow" | "red";
const RISK_ORDER: Record<Risk, number> = { green: 0, yellow: 1, red: 2 };
const maxRisk = (a: Risk, b: Risk): Risk => (RISK_ORDER[a] >= RISK_ORDER[b] ? a : b);

// Strip Vietnamese diacritics so "trung thuong" matches "trúng thưởng".
function normalizeVi(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

// A URL / phone hotline appearing anywhere in the message.
const URL_RE = /(https?:\/\/|www\.[a-z0-9\-]+\.|[a-z0-9\-]+\.(vn|com|net|org|info|xyz|top|shop|club|cc|link))/i;
const HOTLINE_RE = /\b(1900[\s.]?\d{2,6}|18\d{2}[\s.]?\d{2,6})\b/;

// Deterministic safety floor: if any of these hit, output MUST be red — even
// if the AI voted green/yellow. Never DOWNGRADES the AI verdict.
const HARD_RED = [
  /\b(otp|ma xac thuc|ma xac minh)\b/,
  /(mat khau|dang nhap tai khoan)/,
  /(nap the|nap tien vao game|chuyen khoan cho toi)/,
];
const PRIZE_HOOK = /(trung thuong|nhan qua|chuc mung.{0,30}(iphone|ipad|xe|tien|giai))/;
const IMPERSONATION = /(cong an|toa an|khoi to|dieu tra.{0,20}toi pham|ngan hang.{0,25}(khoa|dong tai khoan))/;

function hardRedCheck(originalContent: string): { isRed: boolean; reasons: string[] } {
  const norm = normalizeVi(originalContent);
  const hasUrl = URL_RE.test(originalContent) || HOTLINE_RE.test(originalContent);
  const reasons: string[] = [];

  for (const p of HARD_RED) {
    if (p.test(norm)) reasons.push("yêu cầu OTP/mật khẩu/nạp thẻ");
  }
  if (PRIZE_HOOK.test(norm) && hasUrl) {
    reasons.push("hứa trúng thưởng kèm link/hotline lạ");
  }
  if (IMPERSONATION.test(norm)) {
    reasons.push("giả danh công an / ngân hàng");
  }
  return { isRed: reasons.length > 0, reasons };
}

// Forgiving JSON extraction — AI sometimes wraps in ```json ... ``` or adds prose.
function extractJson(raw: string): { risk?: string; explanation?: string } | null {
  const trimmed = raw.trim();
  try { return JSON.parse(trimmed); } catch { /* fallthrough */ }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1].trim()); } catch { /* fallthrough */ }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch { /* fallthrough */ }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Yêu cầu nội dung hợp lệ" }, { status: 400 });
    }

    const systemPrompt = `Bạn là chuyên gia phân tích an toàn mạng cho trẻ em Việt Nam (Bé An Toàn Số).

QUAN TRỌNG: Nhiều tin lừa đảo tiếng Việt viết KHÔNG DẤU (vd "trung thuong iphone", "nap the", "mat khau"). Bạn PHẢI hiểu và phân tích chúng y hệt tiếng Việt có dấu.

Trả về DUY NHẤT một JSON hợp lệ:
{
  "risk": "green" | "yellow" | "red",
  "explanation": "1–2 câu tiếng Việt dễ hiểu cho học sinh cấp 1"
}

Quy tắc phân loại (BẮT BUỘC, thà nhầm nghiêng về nghiêm khắc):

"red" (LỪA ĐẢO RÕ RÀNG):
- Chúc mừng "trúng thưởng" (iPhone, tiền, xe, mã game...) từ chương trình bé không tham gia
- Yêu cầu OTP, mã xác thực, mật khẩu, đăng nhập
- Yêu cầu nạp thẻ, chuyển tiền, nạp game để "nhận thưởng"
- Kèm link lạ (http://..., .vn, .top...) hoặc hotline 1900xxxx để "xác nhận"
- Giả danh công an, ngân hàng, tòa án — đe dọa khóa tài khoản
- Hứa cho kim cương game, hack game miễn phí, đổi acc VIP

"yellow" (ĐÁNG NGỜ):
- Quảng cáo khuyến mại/quà tặng KHÔNG kèm dụ mật khẩu và KHÔNG hứa trúng thưởng lớn
- Người lạ nhắn xin thông tin nhẹ (tên, tuổi, trường lớp)
- Link chưa quen nhưng không dấu hiệu lừa đảo rõ

"green" (an toàn):
- Bạn bè / người thân trao đổi bình thường
- Nhắn tin học tập, chào hỏi, hỏi bài, thông báo trường lớp

BỘ VÍ DỤ CHUẨN:

Input: "Chuc mung ban da trung thuong 1 chiec iPhone 15 Promax tri gia 34.990.000d tu chuong trinh tri an khach hang. Click vao link sau de xac nhan va nhan thuong: http://nhanqua-iphone15.vn. LH: 1900xxxx"
Output: {"risk":"red","explanation":"Đây là tin lừa đảo giả trúng thưởng iPhone. Không có chương trình thật nào tự dưng tặng iPhone rồi bắt bấm link xác nhận. Tuyệt đối không bấm link, không gọi 1900. Báo bố mẹ ngay!"}

Input: "Ma OTP cua ban la 123456. Vui long xac nhan giao dich"
Output: {"risk":"red","explanation":"Không ai được đọc mã OTP của mình cho người lạ. Đây là tin lừa để chiếm tài khoản. Xoá ngay và báo bố mẹ!"}

Input: "Tang mien phi 5000 kim cuong Free Fire, nhap ID vao day: http://ffree.top"
Output: {"risk":"red","explanation":"Không có ai tặng kim cương miễn phí trên link lạ. Đây là bẫy lừa để cướp acc game. Không nhập ID vào đấy nhé!"}

Input: "Ban co the cho minh xin so dien thoai duoc khong?"
Output: {"risk":"yellow","explanation":"Người lạ hỏi số điện thoại là dấu hiệu đáng ngờ. Con hỏi ý kiến bố mẹ trước khi trả lời nhé."}

Input: "Ngay mai co bai kiem tra Toan nho ban a"
Output: {"risk":"green","explanation":"Tin nhắn học tập bình thường, an toàn."}

Chỉ trả về JSON, KHÔNG kèm markdown code block, KHÔNG lời chào giới thiệu.`;

    let aiRisk: Risk | null = null;
    let aiExplanation = "";
    let aiErrorMsg = "";

    try {
      const result = await createChatCompletion({
        provider: "deepseek",
        maxTokens: 250,
        temperature: 0.2,
        responseFormat: "json_object",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Văn bản cần kiểm tra:\n"""\n${content}\n"""` },
        ],
      });

      const parsed = extractJson(result.text ?? "");
      if (
        parsed &&
        (parsed.risk === "green" || parsed.risk === "yellow" || parsed.risk === "red") &&
        typeof parsed.explanation === "string" &&
        parsed.explanation.trim()
      ) {
        aiRisk = parsed.risk;
        aiExplanation = parsed.explanation;
      } else {
        aiErrorMsg = "AI trả về JSON không hợp lệ";
        console.warn(
          "[detect-scam] AI returned unusable payload; raw:",
          (result.text ?? "").slice(0, 300),
        );
      }
    } catch (aiErr) {
      aiErrorMsg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.error(
        "[detect-scam] AI call failed:",
        aiErrorMsg,
        "hasDeepSeek=",
        !!process.env.DEEPSEEK_API_KEY,
        "hasGrok=",
        !!process.env.XAI_API_KEY,
      );
    }

    // AI is the primary decision. Deterministic guardrail can only ESCALATE
    // to red (safety floor), never downgrade AI's verdict.
    const guardrail = hardRedCheck(content);

    if (aiRisk) {
      const finalRisk = guardrail.isRed ? maxRisk(aiRisk, "red") : aiRisk;
      const explanation =
        finalRisk === "red" && aiRisk !== "red"
          ? `Đây là tin nhắn lừa đảo (${guardrail.reasons.join(", ")}). Tuyệt đối không bấm link hay làm theo. Hãy báo bố mẹ ngay!`
          : aiExplanation;
      return NextResponse.json({ risk: finalRisk, explanation });
    }

    // AI failed → guardrail-only verdict as safe fallback.
    if (guardrail.isRed) {
      return NextResponse.json({
        risk: "red",
        explanation: `Đây là tin nhắn lừa đảo (${guardrail.reasons.join(", ")}). Tuyệt đối không bấm link, không nhập thông tin, không gọi số lạ. Báo cho bố mẹ ngay!`,
        diagnostic: {
          ai_used: false,
          ai_error: aiErrorMsg || "unknown",
          source: "guardrail",
        },
      });
    }
    return NextResponse.json({
      risk: "yellow",
      explanation: "Máy phân tích AI tạm gián đoạn. Con hỏi ý kiến bố mẹ trước khi làm theo tin nhắn này nhé.",
      diagnostic: {
        ai_used: false,
        ai_error: aiErrorMsg || "unknown",
        source: "yellow_fallback",
      },
    });
  } catch (err) {
    console.error("[detect-scam] fatal:", err instanceof Error ? err.message : err);
    return NextResponse.json({
      risk: "yellow",
      explanation: "Không thể kết nối máy chủ phân tích. Con hãy hỏi ý kiến người lớn trước khi thực hiện yêu cầu trong tin nhắn nhé!",
    });
  }
}
