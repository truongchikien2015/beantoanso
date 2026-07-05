import { NextResponse } from "next/server";
import { createChatCompletion } from "../../../../lib/server/aiProvider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Yêu cầu nội dung hợp lệ" }, { status: 400 });
    }

    // Local rules/regex checks as fallback or pre-analyzer
    const contentLower = content.toLowerCase();
    
    // Check for high-risk signs
    const redFlags = ["otp", "mật khẩu", "mat khau", "dang nhap", "đăng nhập", "chuyển tiền", "nạp thẻ", "nap the", "freefire", "liên quân", "kim cương miễn phí", "kim cuong mien phi"];
    const yellowFlags = ["trúng thưởng", "nhận quà", "khuyến mại", "khuyến mãi", "gửi link", "bấm vào đây", "nhấp vào"];

    let localRisk: "green" | "yellow" | "red" | null = null;
    let localExplanation = "";

    if (redFlags.some(flag => contentLower.includes(flag))) {
      localRisk = "red";
      localExplanation = "Tin nhắn có chứa từ khóa yêu cầu mật khẩu, OTP hoặc nạp thẻ game. Đây là hành vi lừa đảo cực kỳ nguy hiểm để lấy cắp tài khoản của con!";
    } else if (yellowFlags.some(flag => contentLower.includes(flag))) {
      localRisk = "yellow";
      localExplanation = "Tin nhắn quảng cáo trúng thưởng hoặc yêu cầu bấm vào đường link lạ. Con nên hỏi ý kiến bố mẹ trước khi click vào nhé.";
    }

    try {
      const systemPrompt = `Bạn là chuyên gia phân tích an toàn mạng của Bé An Toàn Số.
Phân tích văn bản (đường link, email hoặc tin nhắn) người dùng gửi và đưa ra kết quả dưới dạng JSON có cấu trúc chính xác sau:
{
  "risk": "green" hoặc "yellow" hoặc "red",
  "explanation": "Lời giải thích bằng tiếng Việt cực kỳ ngắn gọn (1-2 câu), dễ hiểu cho học sinh cấp 1"
}
Quy định mức độ nguy cơ (risk):
- "red": Nếu chứa liên kết lừa đảo giả mạo, yêu cầu cung cấp OTP, mật khẩu, nạp tiền/nạp thẻ, hoặc đe dọa.
- "yellow": Nếu là tin nhắn quảng cáo trúng thưởng quá hấp dẫn, liên kết chưa xác minh, rủ rê nói chuyện riêng.
- "green": Nếu là nội dung hỏi han, tin nhắn học tập thông thường không có dấu hiệu dụ dỗ.

Trả về DUY NHẤT một chuỗi JSON hợp lệ. Không viết thêm chữ nào ngoài chuỗi JSON này.`;

      const result = await createChatCompletion({
        maxTokens: 150,
        temperature: 0.3,
        responseFormat: "json_object",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Văn bản cần kiểm tra: "${content}"` }
        ]
      });

      const parsed = JSON.parse(result.text);
      if (parsed && (parsed.risk === "green" || parsed.risk === "yellow" || parsed.risk === "red") && parsed.explanation) {
        return NextResponse.json(parsed);
      }
    } catch (aiErr) {
      console.warn("AI Scam Detection failed or timed out, using local rules:", aiErr);
    }

    // Fallback response if AI failed
    return NextResponse.json({
      risk: localRisk || "green",
      explanation: localExplanation || "Nội dung này hiện chưa phát hiện dấu hiệu nguy hiểm rõ rệt. Tuy nhiên con vẫn nên cẩn trọng, không đưa thông tin cá nhân cho người khác."
    });
  } catch (err) {
    console.error("Detect Scam Error:", err);
    return NextResponse.json({
      risk: "yellow",
      explanation: "Không thể kết nối máy chủ phân tích. Con hãy hỏi ý kiến người lớn trước khi thực hiện yêu cầu trong tin nhắn nhé!"
    });
  }
}
