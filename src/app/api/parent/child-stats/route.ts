import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { TeacherStudent } from "../../../../lib/db/models/TeacherStudent";
import { TeacherStudentStats } from "../../../../lib/db/models/TeacherStudentStats";
import { StudentAnswer } from "../../../../lib/db/models/StudentAnswer";
import { Profile } from "../../../../lib/db/models/Profile";
import { createChatCompletion, getDefaultAiProvider } from "../../../../lib/server/aiProvider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const topicLabels: Record<string, string> = {
  stranger: "Người lạ trên mạng",
  password: "Bảo vệ mật khẩu",
  privacy: "Quyền riêng tư",
  behavior: "Ứng xử văn minh",
  screentime: "Thời gian sử dụng thiết bị",
  badcontent: "Nội dung xấu",
  phishing: "Lừa đảo trực tuyến",
};

/** Build static fallback vulnerabilities/recommendations from topic accuracies */
function buildStaticInsights(
  topicAccuracies: Record<string, number>
): { vulnerabilities: string[]; recommendations: string[] } {
  const vulnerabilities: string[] = [];
  const recommendations: string[] = [];

  if (topicAccuracies["stranger"] < 70) {
    vulnerabilities.push("Con chưa cảnh giác cao độ khi có người lạ tiếp cận, nhắn tin xin thông tin cá nhân trên mạng xã hội.");
    recommendations.push("Phụ huynh nhắc nhở con: Tuyệt đối không chia sẻ ảnh cá nhân, số điện thoại, địa chỉ nhà cho người không quen biết.");
  }
  if (topicAccuracies["phishing"] < 70) {
    vulnerabilities.push("Con dễ bị hấp dẫn bởi các phần quà game miễn phí (kim cương, trang phục) và click vào link lạ.");
    recommendations.push("Hướng dẫn con thói quen rà soát địa chỉ email gửi đến và không bao giờ nhập thông tin tài khoản vào link không chính thức.");
  }
  if (topicAccuracies["password"] < 70) {
    vulnerabilities.push("Con đặt mật khẩu quá ngắn hoặc dễ đoán (ngày sinh, 123456) hoặc chia sẻ mật khẩu cho bạn bè.");
    recommendations.push("Cùng con tạo mật khẩu mạnh có chứa chữ hoa, số và ký tự đặc biệt, đồng thời giải thích mật khẩu là bí mật tuyệt đối.");
  }
  if (topicAccuracies["privacy"] < 70) {
    vulnerabilities.push("Con chưa biết cách bảo mật quyền riêng tư tài khoản cá nhân, dễ đăng tải thông tin nhạy cảm.");
    recommendations.push("Xem lại các thiết lập bảo mật mạng xã hội của con và giải thích những gì đăng lên mạng sẽ tồn tại mãi mãi.");
  }
  if (topicAccuracies["behavior"] < 70) {
    vulnerabilities.push("Con dễ tham gia vào các cuộc đùa cợt, nói xấu hoặc ứng xử chưa văn minh trong các nhóm chat học sinh.");
    recommendations.push("Nhắc nhở con quy tắc ứng xử trên mạng: Không nói những lời gây tổn thương người khác như khi giao tiếp trực tiếp.");
  }
  if (topicAccuracies["screentime"] < 70) {
    vulnerabilities.push("Con sử dụng thiết bị điện tử quá thời gian quy định, khó kiểm soát thời gian giải trí.");
    recommendations.push("Thỏa thuận với con thời gian biểu rõ ràng (ví dụ tối đa 1 tiếng/ngày) và sử dụng các ứng dụng quản lý thời gian.");
  }
  if (topicAccuracies["badcontent"] < 70) {
    vulnerabilities.push("Con tò mò click vào các nội dung bạo lực, giật gân hoặc không phù hợp với lứa tuổi.");
    recommendations.push("Cài đặt bộ lọc tìm kiếm an toàn (SafeSearch) và khuyên con hãy tắt tab ngay và báo cho cha mẹ khi gặp nội dung xấu.");
  }

  if (vulnerabilities.length === 0) {
    vulnerabilities.push("Không phát hiện điểm yếu kỹ năng đáng lo ngại nào. Con có phản xạ an toàn số rất tốt!");
    recommendations.push("Khuyến khích con tiếp tục học tập và làm các thử thách hàng tuần để duy trì phong độ.");
  }

  return { vulnerabilities, recommendations };
}

/** Generate AI-powered personalized analysis */
async function generateAiInsights(
  nickname: string,
  topicAccuracies: Record<string, number>,
  totalAnswers: number
): Promise<{ vulnerabilities: string[]; recommendations: string[] } | null> {
  try {
    const weakTopics = Object.entries(topicAccuracies)
      .filter(([, acc]) => acc < 70)
      .map(([key, acc]) => `- ${topicLabels[key] ?? key}: ${acc}%`)
      .join("\n");

    const strongTopics = Object.entries(topicAccuracies)
      .filter(([, acc]) => acc >= 70)
      .map(([key, acc]) => `- ${topicLabels[key] ?? key}: ${acc}%`)
      .join("\n");

    const prompt = [
      `Học sinh "${nickname}" vừa hoàn thành ${totalAnswers} câu hỏi an toàn số trên nền tảng Bé An Toàn Số.`,
      "",
      weakTopics
        ? `Các chủ đề CÒN YẾU (dưới 70%):\n${weakTopics}`
        : "Không có chủ đề yếu - học sinh đạt trên 70% ở tất cả chủ đề.",
      strongTopics
        ? `\nCác chủ đề TỐT (từ 70% trở lên):\n${strongTopics}`
        : "",
      "",
      "Hãy tạo 2 danh sách JSON theo định dạng sau (không giải thích gì thêm, chỉ trả JSON thuần):",
      `{
  "vulnerabilities": ["<điểm yếu 1 của con viết thành câu hoàn chỉnh, cụ thể, thân thiện, dưới 25 từ>", ...],
  "recommendations": ["<gợi ý cụ thể cho phụ huynh, bắt đầu bằng động từ hành động, dưới 30 từ>", ...]
}`,
      "",
      "Lưu ý:",
      "- Nếu không có chủ đề yếu, hãy khen ngợi và gợi ý duy trì.",
      "- Mỗi danh sách tối đa 4 mục.",
      "- Ngôn ngữ Việt Nam, thân thiện với phụ huynh, không hù dọa, không dùng emoji.",
      "- Gợi ý phải cụ thể, thực tế, bố mẹ có thể làm ngay tại nhà.",
    ].join("\n");

    const result = await createChatCompletion({
      provider: getDefaultAiProvider(),
      maxTokens: 500,
      temperature: 0.5,
      responseFormat: "json_object",
      messages: [
        {
          role: "system",
          content:
            "Bạn là chuyên gia giáo dục an toàn số cho trẻ em Việt Nam. Bạn phân tích kết quả học tập và đưa ra nhận xét, gợi ý cụ thể, ấm áp, thực tế cho phụ huynh. Chỉ trả về JSON hợp lệ.",
        },
        { role: "user", content: prompt },
      ],
    });

    const parsed = JSON.parse(result.text);
    if (
      Array.isArray(parsed.vulnerabilities) &&
      Array.isArray(parsed.recommendations) &&
      parsed.vulnerabilities.length > 0
    ) {
      return {
        vulnerabilities: parsed.vulnerabilities.slice(0, 4),
        recommendations: parsed.recommendations.slice(0, 4),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json({ error: "Vui lòng cung cấp mã liên kết của con." }, { status: 400 });
    }

    // 1. Try to find student in TeacherStudent (school accounts) by parent_access_code
    let child = await TeacherStudent.findOne({
      $or: [
        { parent_access_code: code },
        { parent_access_code: code.toUpperCase() }
      ]
    });
    let isMember = false;
    let nickname = "";
    let className = "";
    let xp = 0;
    let level = 1;

    if (child) {
      if (!child.is_active) {
        return NextResponse.json({ error: "Tài khoản học sinh này đã bị khóa hoặc không hoạt động." }, { status: 404 });
      }
      nickname = child.nickname;
      className = child.class_name || "Chưa xếp lớp";
      const stats = await TeacherStudentStats.findOne({ student_id: child._id.toString() });
      xp = stats?.total_xp || 0;
      level = Math.floor(xp / 100) + 1;
    } else {
      // 2. Try to find in Profiles (self-registered accounts)
      const profile = await Profile.findById(code);
      if (profile) {
        isMember = true;
        nickname = profile.full_name || "Thành viên";
        className = "Tự do";
        xp = profile.xp || 0;
        level = profile.level || 1;
      }
    }

    if (!child && !isMember) {
      return NextResponse.json({ error: "Không tìm thấy học sinh với mã liên kết này. Vui lòng kiểm tra lại." }, { status: 404 });
    }

    // 3. Fetch actual answers to calculate topic accuracies
    const answers = await StudentAnswer.find({
      $or: [
        { player_id: child ? child._id.toString() : code },
        { player_id: code },
        { nickname: child ? child.nickname : "" }
      ]
    });

    const topics = ["stranger", "phishing", "password", "privacy", "behavior", "screentime", "badcontent"];
    let topicAccuracies: Record<string, number> = {};
    let vulnerabilities: string[] = [];
    let recommendations: string[] = [];
    let aiGenerated = false;

    if (answers && answers.length > 0) {
      const topicStats: Record<string, { total: number; correct: number }> = {};

      answers.forEach((ans) => {
        const t = ans.topic_slug;
        if (!topicStats[t]) topicStats[t] = { total: 0, correct: 0 };
        topicStats[t].total += 1;
        if (ans.is_correct) topicStats[t].correct += 1;
      });

      topics.forEach((t) => {
        const stat = topicStats[t];
        topicAccuracies[t] = stat && stat.total > 0
          ? Math.round((stat.correct / stat.total) * 100)
          : 100;
      });

      // Try AI-powered insights first, fall back to static rules
      const aiInsights = await generateAiInsights(nickname, topicAccuracies, answers.length);
      if (aiInsights) {
        vulnerabilities = aiInsights.vulnerabilities;
        recommendations = aiInsights.recommendations;
        aiGenerated = true;
      } else {
        const staticInsights = buildStaticInsights(topicAccuracies);
        vulnerabilities = staticInsights.vulnerabilities;
        recommendations = staticInsights.recommendations;
      }
    } else {
      // Fallback to XP-based analysis if no answers in database yet
      if (xp < 55) {
        vulnerabilities = [
          "Chưa nắm rõ quy tắc bảo mật mật khẩu cơ bản.",
          "Dễ bị đánh lừa bởi các tin nhắn trúng thưởng giả mạo.",
          "Thiếu cảnh giác khi có người lạ rủ rê, nhắn tin trên mạng.",
        ];
        recommendations = [
          "Hướng dẫn con cách tạo mật khẩu có ký tự đặc biệt và không chia sẻ với ai.",
          "Cùng con thảo luận về việc không bao giờ bấm vào link nhận quà game miễn phí.",
          "Nhắc con báo ngay cho người lớn khi có tài khoản lạ nhắn tin xin thông tin cá nhân.",
        ];
      } else if (xp < 155) {
        vulnerabilities = [
          "Có kiến thức cơ bản về mật khẩu nhưng chưa nhận biết tốt email lừa đảo tinh vi.",
          "Dễ bị kích động hoặc tò mò khi gặp tình huống đe dọa từ bạn bè trên mạng.",
        ];
        recommendations = [
          "Cùng con làm bài tập mô phỏng nhận diện email giả mạo.",
          "Trò chuyện với con về ứng xử văn minh và không tham gia nhóm chat nói xấu bạn bè.",
        ];
      } else {
        vulnerabilities = [
          "Đã có kỹ năng an toàn số khá tốt.",
          "Cần duy trì luyện tập để nhận biết các thủ đoạn lừa đảo mới phát sinh.",
        ];
        recommendations = [
          "Khuyến khích con hoàn thành các thử thách hàng tuần để giữ vững phản xạ an toàn số.",
          "Dành thời gian hàng tuần cùng con hỏi đáp nhanh cùng trợ lý Cú Cú An Toàn.",
        ];
      }

      // Seed default accuracies based on XP for visual fallback
      topics.forEach((t) => {
        topicAccuracies[t] = xp >= 155 ? 85 : (xp >= 55 ? 65 : 40);
      });
    }

    return NextResponse.json({
      success: true,
      child: {
        nickname,
        className,
        xp,
        level,
        status: xp >= 150 ? "Hoàn thành tốt" : (xp >= 50 ? "Khá" : "Cần rèn luyện thêm"),
      },
      vulnerabilities,
      recommendations,
      accuracies: topicAccuracies,
      total_answers: answers ? answers.length : 0,
      ai_generated: aiGenerated,
    });
  } catch (err: any) {
    console.error("Parent API Error:", err);
    return NextResponse.json({ error: "Lỗi kết nối hệ thống. Vui lòng thử lại sau." }, { status: 500 });
  }
}
