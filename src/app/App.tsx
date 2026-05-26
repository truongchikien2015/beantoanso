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
import { supabase } from "../lib/supabase";

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
  | "teacher";

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

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data: profile }) => {
          setNickname(profile?.full_name || session.user.email);
          setGender(profile?.gender || "other");
          setBirthYear(profile?.birth_year || 2010);
          setProfileXp(profile?.xp || 0);
          setPlayerId(session.user.id);
          setScreen("path-select");
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
        }
      }
    });

    // Fetch all topics from Supabase
    supabase.from('topics').select('*').eq('is_active', true).order('topic_order', { ascending: true }).then(({ data }) => {
      if (data) setAllTopics(data);
    });
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

    // Fetch random question matching age and gender
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_slug', topic.slug)
      .lte('min_age', age)
      .gte('max_age', age)
      .in('target_gender', ['all', userGender]);

    if (error) {
      console.error("Supabase Error fetching questions:", error);
      alert(`Lỗi khi lấy câu hỏi: ${error.message}`);
      return;
    }
    
    if (data && data.length > 0) {
      const randomQ = data[Math.floor(Math.random() * data.length)];
      setActiveTopic(topic);
      setActiveQuestion(randomQ);
      setScreen("mission");
    } else {
      // Fallback: fetch any question for this topic if specific age/gender has no questions
      const { data: fallbackData } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_slug', topic.slug);
        
      if (fallbackData && fallbackData.length > 0) {
        const randomQ = fallbackData[Math.floor(Math.random() * fallbackData.length)];
        setActiveTopic(topic);
        setActiveQuestion(randomQ);
        setScreen("mission");
      } else {
        const { data: allData, error: allErr } = await supabase.from('questions').select('id').limit(1);
        if (allErr || !allData || allData.length === 0) {
          alert("⚠️ Database chưa có câu hỏi nào! Hãy chạy lệnh: node scripts/seed.mjs");
        } else {
          alert(`Chưa có câu hỏi cho chủ đề: ${topic.label}`);
        }
      }
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

    // Sync XP to Supabase for logged in members
    if (user) {
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          const newXp = (profile.xp || 0) + total_score;
          // Every 100 XP = 1 Level
          const newLevel = Math.floor(newXp / 100) + 1;
          const newTotalScore = (profile.total_score || 0) + total_score;

          await supabase.from('profiles').update({
            xp: newXp,
            level: newLevel,
            total_score: newTotalScore,
            updated_at: new Date().toISOString()
          }).eq('id', user.id);
          setProfileXp(newXp);
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
    await supabase.auth.signOut();
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
      <LearningPathSelector
        nickname={nickname}
        onSelect={handleSelectPath}
        onBack={() => setScreen("home")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-pink-50 to-amber-50">
      <Header
        nickname={nickname}
        totalScore={totalScore}
        xp={user ? profileXp : (playerId ? totalXpForPlayer(playerId) : 0)}
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
          onBack={() => setScreen("result")}
        />
      )}
    </div>
  );
}
