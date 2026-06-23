import { useEffect, useMemo, useState } from "react";
import { HomeScreen } from "../components/HomeScreen";
import { LearningPathSelector } from "../components/LearningPathSelector";
import { JourneyMap } from "../components/JourneyMap";
import { MissionScreen } from "../components/MissionScreen";
import { QuizScreen } from "../components/QuizScreen";
import { ResultScreen } from "../components/ResultScreen";
import { Certificate } from "../components/Certificate";
import { Header } from "../components/Header";
import { Leaderboard } from "../components/Leaderboard";
import { AdminLogin } from "../components/admin/AdminLogin";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { LessonsScreen } from "../components/LessonsScreen";
import { DailyChallenge } from "../components/DailyChallenge";
import { ClassifyGame } from "../components/ClassifyGame";
import { getBadge } from "../data/gameData";
import { Admin, Results, Player, FinalResult } from "../lib/store";
import { totalXpForPlayer } from "../lib/xp";
import { fetchStudentSession, getStudentToken } from "../lib/studentApi";
import { sfx } from "../lib/sound";

import { ChatSimulation } from "../components/simulations/ChatSimulation";
import { EmailSimulation } from "../components/simulations/EmailSimulation";
import { EntryQuiz } from "../components/EntryQuiz";
import { AiMascot } from "../components/AiMascot";
import { HelpModal } from "../components/HelpModal";

type Screen =
  | "home"
  | "path-select"
  | "map"
  | "mission"
  | "quiz"
  | "result"
  | "certificate"
  | "leaderboard"
  | "admin"
  | "admin-questions"
  | "lessons"
  | "daily"
  | "classify"
  | "teacher"
  | "chat-sim"
  | "email-sim";

type SaveData = {
  nickname: string;
  gender?: string;
  birthYear?: number;
  playerId: string;
  missionResults: Record<string, { score: number; correct: boolean }>;
  quiz?: { correct: number; score: number; total: number };
  lastResultId?: string;
};

const STORAGE_KEY = "be-an-toan-so:v2";

function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

function saveSave(data: SaveData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function genId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return "p-" + Math.random().toString(36).slice(2);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [user, setUser] = useState<any>(null);
  const [profileXp, setProfileXp] = useState<number>(0);
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState<number | undefined>();
  const [playerId, setPlayerId] = useState("");
  const [missionResults, setMissionResults] = useState<
    Record<string, { score: number; correct: boolean }>
  >({});
  
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [activePath, setActivePath] = useState<any>(null);
  const [activeTopic, setActiveTopic] = useState<any>(null);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [quiz, setQuiz] = useState<{
    correct: number;
    score: number;
    total: number;
  } | null>(null);
  const [lastResultId, setLastResultId] = useState<string | undefined>();
  const [showEntryQuiz, setShowEntryQuiz] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    // Check active session
    const token = getStudentToken();
    if (token) {
      fetchStudentSession()
        .then(({ student, assigned_path }) => {
          if (student) {
            setUser(student);
            setNickname(student.nickname);
            setGender(student.gender || "other");
            setBirthYear(student.birthYear || 2010);
            setProfileXp(student.xp || 0);
            setPlayerId(student.id);
            if (assigned_path) {
              setActivePath(assigned_path);
            }
            setScreen("path-select");

            const hasEntryQuiz = localStorage.getItem("bats:entry_weaknesses");
            if (!hasEntryQuiz) {
              setShowEntryQuiz(true);
            }
          }
        })
        .catch((err) => {
          console.error("Session verification failed:", err);
          localStorage.removeItem("student_token");
        });
    } else {
      const saved = loadSave();
      if (saved?.nickname) {
        setNickname(saved.nickname);
        setGender(saved.gender || "");
        setBirthYear(saved.birthYear);
        setPlayerId(saved.playerId);
        setMissionResults(saved.missionResults || {});
        if (saved.quiz) setQuiz(saved.quiz);
        if (saved.lastResultId) setLastResultId(saved.lastResultId);
        setScreen("path-select");

        const hasEntryQuiz = localStorage.getItem("bats:entry_weaknesses");
        if (!hasEntryQuiz) {
          setShowEntryQuiz(true);
        }
      }
    }

    // Fetch all topics from MongoDB
    fetch("/api/student/topics")
      .then((res) => res.json())
      .then((body) => {
        if (body.data) setAllTopics(body.data);
      })
      .catch((err) => console.error("Failed to fetch topics:", err));
  }, []);

  useEffect(() => {
    if (!nickname) return;
    saveSave({
      nickname,
      gender,
      birthYear,
      playerId,
      missionResults,
      quiz: quiz || undefined,
      lastResultId,
    });
  }, [nickname, gender, birthYear, playerId, missionResults, quiz, lastResultId]);

  const missionScore = useMemo(
    () => Object.values(missionResults).reduce((s, r) => s + r.score, 0),
    [missionResults],
  );
  const totalScore = missionScore + (quiz?.score ?? 0);

  const handleStart = (name: string, pGender: string, pBirthYear: number) => {
    setNickname(name);
    setGender(pGender);
    setBirthYear(pBirthYear);
    // If not logged in, generate a random ID
    if (!user) {
      setPlayerId(genId());
    }
    setMissionResults({});
    setQuiz(null);
    setLastResultId(undefined);
    setActivePath(null);
    setTopics([]);
    
    const hasEntryQuiz = localStorage.getItem("bats:entry_weaknesses");
    if (!hasEntryQuiz) {
      setShowEntryQuiz(true);
    }
    setScreen("path-select");
  };

  const handleSelectPath = (path: any) => {
    setActivePath(path);
    // Filter topics by the path's topic_ids array
    const filtered = allTopics.filter((t: any) => path.topic_ids.includes(t.id));
    // Preserve order from topic_ids
    const ordered = path.topic_ids
      .map((id: string) => filtered.find((t: any) => t.id === id))
      .filter(Boolean);
    setTopics(ordered.length > 0 ? ordered : filtered);
    setScreen("map");
  };

  const handlePickMission = async (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    
    const currentYear = new Date().getFullYear();
    const age = birthYear ? currentYear - birthYear : 99; // Default to adult if missing
    const userGender = gender || 'all';

    // Fetch random question matching age and gender from MongoDB API
    try {
      const res = await fetch(`/api/student/questions?topic_slug=${encodeURIComponent(topic.slug)}&age=${age}&gender=${userGender}`);
      if (!res.ok) {
        throw new Error(`Lỗi HTTP: ${res.status}`);
      }
      const data = await res.json();
      
      if (data && data.length > 0) {
        const randomQ = data[Math.floor(Math.random() * data.length)];
        setActiveTopic(topic);
        setActiveQuestion(randomQ);
        setScreen("mission");
      } else {
        // Fallback: fetch any question for this topic if specific age/gender has no questions
        const fallbackRes = await fetch(`/api/student/questions?topic_slug=${encodeURIComponent(topic.slug)}`);
        if (!fallbackRes.ok) {
          throw new Error(`Lỗi HTTP: ${fallbackRes.status}`);
        }
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData && fallbackData.length > 0) {
          const randomQ = fallbackData[Math.floor(Math.random() * fallbackData.length)];
          setActiveTopic(topic);
          setActiveQuestion(randomQ);
          setScreen("mission");
        } else {
          const generalRes = await fetch("/api/student/questions");
          const generalData = await generalRes.json().catch(() => []);
          if (Array.isArray(generalData) && generalData.length > 0) {
            alert(`Chưa có câu hỏi cho chủ đề: ${topic.label}`);
          } else {
            alert("⚠️ Database chưa có câu hỏi nào! Hãy chạy lệnh: node scripts/seed.mjs");
          }
        }
      }
    } catch (err: any) {
      console.error("Error fetching questions:", err);
      alert(`Lỗi khi lấy câu hỏi: ${err.message}`);
    }
  };

  const handleFinishMission = (score: number, correct: boolean) => {
    if (!activeTopic) return;
    setMissionResults((prev) => ({
      ...prev,
      [activeTopic.id]: { score, correct },
    }));
    setActiveTopic(null);
    setActiveQuestion(null);
    setScreen("map");
  };

  const handleFinishQuiz = async (correct: number, score: number, total: number) => {
    setQuiz({ correct, score, total });
    const ms = Object.values(missionResults).reduce((s, r) => s + r.score, 0);
    const total_score = ms + score;
    const badge = getBadge(total_score);
    const saved: FinalResult = Results.add({
      player_id: playerId,
      nickname,
      mission_score: ms,
      quiz_score: score,
      total_score,
      title: badge.title,
      badge: badge.emoji,
    });
    setLastResultId(saved.id);

    // Sync XP for logged in students
    if (user) {
      try {
        const token = localStorage.getItem("student_token");
        if (token) {
          const res = await fetch("/api/student/progress", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ xp: total_score, source: "quiz" }),
          });
          const body = await res.json().catch(() => ({}));
          if (res.ok && body.stats) {
            setProfileXp(body.stats.total_xp);
          }
        }
      } catch (err) {
        console.error("Failed to sync progress:", err);
      }
    }

    setScreen("result");
  };

  const handleReplay = () => {
    setMissionResults({});
    setQuiz(null);
    setLastResultId(undefined);
    setScreen("path-select");
  };

  const handleHome = () => setScreen(nickname ? (activePath ? "map" : "path-select") : "home");

  const handleLogout = async () => {
    localStorage.removeItem("student_token");
    Player.clear();
    setUser(null);
    setNickname("");
    setGender("");
    setBirthYear(undefined);
    setPlayerId("");
    setMissionResults({});
    setQuiz(null);
    setLastResultId(undefined);
    setScreen("home");
  };

  // Admin / Teacher routes — require auth
  if (screen === "admin" || screen === "admin-questions" || screen === "teacher") {
    if (!Admin.isLoggedIn()) {
      return (
        <AdminLogin
          onSuccess={() => setScreen("admin")}
          onBack={() => setScreen("home")}
        />
      );
    }
    return <AdminDashboard onBack={() => setScreen("home")} />;
  }

  if (screen === "lessons") {
    return <LessonsScreen onBack={() => setScreen(nickname ? "map" : "home")} />;
  }
  if (screen === "daily") {
    return <DailyChallenge onBack={() => setScreen(nickname ? "map" : "home")} />;
  }
  if (screen === "classify") {
    return <ClassifyGame onBack={() => setScreen(nickname ? "map" : "home")} />;
  }

  if (screen === "leaderboard") {
    return (
      <Leaderboard
        currentResultId={lastResultId}
        onHome={() => setScreen(nickname ? "map" : "home")}
        onReplay={() => {
          if (nickname) handleReplay();
          else setScreen("home");
        }}
      />
    );
  }

  if (screen === "home" || !nickname) {
    return (
      <HomeScreen
        onStart={handleStart}
        onLeaderboard={() => setScreen("leaderboard")}
        onAdmin={() => setScreen("admin")}
        onLessons={() => setScreen("lessons")}
        onDaily={() => setScreen("daily")}
        onClassify={() => setScreen("classify")}
        onTeacher={() => setScreen("teacher")}
      />
    );
  }

  if (screen === "path-select") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-pink-50 to-amber-50">
        <Header
          nickname={nickname}
          onHome={handleHome}
          onLogout={handleLogout}
        />
        <LearningPathSelector
          nickname={nickname}
          onSelect={handleSelectPath}
          onBack={() => setScreen("home")}
          onSelectChatSim={() => setScreen("chat-sim")}
          onSelectEmailSim={() => setScreen("email-sim")}
          onSelectClassify={() => setScreen("classify")}
        />
        {showEntryQuiz && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[150] overflow-y-auto">
            <div className="w-full max-w-md">
              <EntryQuiz
                onComplete={() => setShowEntryQuiz(false)}
                onClose={() => setShowEntryQuiz(false)}
              />
            </div>
          </div>
        )}
        {nickname && (
          <>
            <AiMascot />
            <button
              onClick={() => {
                sfx.click();
                setShowHelpModal(true);
              }}
              className="fixed bottom-6 left-6 z-[100] w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 border-4 border-white shadow-xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="Con cần giúp đỡ khẩn cấp!"
            >
              🚨
            </button>
          </>
        )}
        <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-pink-50 to-amber-50">
      <Header
        nickname={nickname}
        onHome={handleHome}
        onLogout={handleLogout}
      />
      {screen === "map" && (
        <JourneyMap
          topics={topics}
          results={missionResults}
          onPickMission={handlePickMission}
          onGoQuiz={() => setScreen("quiz")}
        />
      )}
      {screen === "mission" && activeTopic && activeQuestion && (
        <MissionScreen
          topic={activeTopic}
          question={activeQuestion}
          onFinish={handleFinishMission}
          onBack={() => setScreen("map")}
        />
      )}
      {screen === "quiz" && <QuizScreen onFinish={handleFinishQuiz} />}
      {screen === "result" && quiz && (
        <ResultScreen
          nickname={nickname}
          missionScore={missionScore}
          missionsDone={Object.keys(missionResults).length}
          quizCorrect={quiz.correct}
          quizScore={quiz.score}
          quizTotal={quiz.total}
          rank={lastResultId ? Results.rankOf(lastResultId) : -1}
          onCertificate={() => setScreen("certificate")}
          onLeaderboard={() => setScreen("leaderboard")}
          onReplay={handleReplay}
        />
      )}
      {screen === "certificate" && (
        <Certificate
          nickname={nickname}
          totalScore={totalScore}
          resultId={lastResultId}
          onBack={() => setScreen("result")}
        />
      )}
      {screen === "chat-sim" && (
        <div className="py-8">
          <ChatSimulation
            onBack={() => setScreen("path-select")}
            onComplete={async (simScore) => {
              if (user) {
                try {
                  const token = localStorage.getItem("student_token");
                  if (token) {
                    const res = await fetch("/api/student/progress", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ xp: simScore, source: "simulation_chat" }),
                    });
                    const body = await res.json().catch(() => ({}));
                    if (res.ok && body.stats) {
                      setProfileXp(body.stats.total_xp);
                    }
                  }
                } catch (err) {
                  console.error("Failed to sync progress:", err);
                }
              }
            }}
          />
        </div>
      )}
      {screen === "email-sim" && (
        <div className="py-8">
          <EmailSimulation
            onBack={() => setScreen("path-select")}
            onComplete={async (simScore) => {
              if (user) {
                try {
                  const token = localStorage.getItem("student_token");
                  if (token) {
                    const res = await fetch("/api/student/progress", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ xp: simScore, source: "simulation_email" }),
                    });
                    const body = await res.json().catch(() => ({}));
                    if (res.ok && body.stats) {
                      setProfileXp(body.stats.total_xp);
                    }
                  }
                } catch (err) {
                  console.error("Failed to sync progress:", err);
                }
              }
            }}
          />
        </div>
      )}

      {/* Floating AI Mascot and Urgent Help Button */}
      {nickname && (
        <>
          <AiMascot />
          <button
            onClick={() => {
              sfx.click();
              setShowHelpModal(true);
            }}
            className="fixed bottom-6 left-6 z-[100] w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 border-4 border-white shadow-xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer animate-pulse"
            title="Con cần giúp đỡ khẩn cấp!"
          >
            🚨
          </button>
        </>
      )}

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}
