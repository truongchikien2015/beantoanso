import { NextResponse } from "next/server";
import { createChatCompletion, AiProviderError } from "../../../../lib/server/aiProvider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Yêu cầu tin nhắn hợp lệ" }, { status: 400 });
    }

    // Blacklist filter for safety (Client and Server safeguard)
    const blacklist = [
      "hách", "hack", "crack", "bạo lực", "chửi", "đụ", "lồn", "buồi", "cặc", "vú", "mông", "sex"
    ];
    
    const hasBadWord = blacklist.some(word => message.toLowerCase().includes(word));
    if (hasBadWord) {
      return NextResponse.json({
        text: "Cú Cú An Toàn phát hiện tin nhắn có từ ngữ chưa phù hợp hoặc liên quan tới hành vi xấu. Con hãy luôn giao tiếp lịch sự và văn minh trên mạng nhé!"
      });
    }

    const systemPrompt = `Bạn là Cú Cú An Toàn, một chú chim cú mèo hoạt hình thông thái, trợ lý ảo đồng hành cùng học sinh tiểu học (6-12 tuổi) trên website Bé An Toàn Số.
Nhiệm vụ duy nhất của bạn là giải thích các câu hỏi về:
1. An toàn mật khẩu, bảo mật tài khoản.
2. Nhận biết lừa đảo mạng (phishing), trúng thưởng giả mạo, nạp thẻ game lừa đảo.
3. Ứng xử văn minh trực tuyến, phòng chống bắt nạt trên mạng.
4. Bảo vệ thông tin cá nhân (địa chỉ, số điện thoại, hình ảnh cá nhân).

Nguyên tắc trả lời:
- Luôn trả lời bằng tiếng Việt, ngắn gọn (tối đa 3 câu), ngôn từ vui tươi, ấm áp, thân thiện với học sinh lớp 1-5.
- Tuyệt đối KHÔNG trả lời về các chủ đề ngoài phạm vi an toàn mạng (ví dụ giải toán, viết code, làm văn, kể chuyện ma, chuyện phiếm...). Khi đó, hãy trả lời: "Cú Cú chỉ biết giúp con bảo vệ an toàn trên mạng thôi nè. Con hãy hỏi Cú về mật khẩu, link lạ hoặc tin nhắn người lạ nhé!"
- Nếu trẻ đang kể về tình huống bị đe dọa hoặc nguy hiểm thật, hãy khuyên trẻ dừng nhắn tin ngay, giữ bằng chứng và báo ngay cho bố mẹ hoặc thầy cô.`;

    const result = await createChatCompletion({
      maxTokens: 200,
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    return NextResponse.json({ text: result.text });
  } catch (err) {
    console.error("Mascot Chat Error:", err);
    return NextResponse.json({
      text: "Cú Cú đang ngủ một chút rồi, con hãy thử hỏi lại sau nhé! 💤"
    });
  }
}
