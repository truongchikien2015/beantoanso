import { quizBank, QuizTopic, topicLabels } from "../data/quizQuestions";

export type AdminQuestion = {
  id: string;
  question: string;
  category: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation: string;
  is_active: boolean;
  min_age?: number;
  max_age?: number;
  target_gender?: "all" | "male" | "female";
  image_url?: string;
  created_at: string;
  updated_at: string;
};

export type FinalResult = {
  id: string;
  player_id: string;
  nickname: string;
  mission_score: number;
  quiz_score: number;
  total_score: number;
  title: string;
  badge: string;
  completed_at: string;
};

const KEYS = {
  questions: "bats:questions:v1",
  results: "bats:final_results:v1",
  admin: "bats:admin",
  player: "be-an-toan-so:v2",
  topics: "bats:topics:v1",
  paths: "bats:paths:v1",
  studentAnswers: "bats:student_answers:v1",
};

export const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "123456";
export const TOPIC_VALUES: QuizTopic[] = [
  "stranger",
  "phishing",
  "password",
  "privacy",
  "behavior",
  "screentime",
  "badcontent",
];

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function seedQuestions(): AdminQuestion[] {
  const now = new Date().toISOString();
  return quizBank.map((q) => {
    const correct = (["A", "B", "C"] as const)[q.correctIndex];
    return {
      id: uuid(),
      question: q.question,
      category: q.topic,
      option_a: q.options[0],
      option_b: q.options[1],
      option_c: q.options[2],
      correct_option: correct,
      explanation: q.explanation,
      is_active: true,
      min_age: 6,
      max_age: 99,
      target_gender: "all",
      image_url: undefined,
      created_at: now,
      updated_at: now,
    };
  });
}

function ensureSeeded(): AdminQuestion[] {
  const existing = read<AdminQuestion[] | null>(KEYS.questions, null);
  if (existing && existing.length > 0) return existing;
  const seeded = seedQuestions();
  write(KEYS.questions, seeded);
  return seeded;
}

// === Questions CRUD ===
export const Questions = {
  list(): AdminQuestion[] {
    return ensureSeeded();
  },
  active(): AdminQuestion[] {
    return ensureSeeded().filter((q) => q.is_active);
  },
  byId(id: string): AdminQuestion | undefined {
    return ensureSeeded().find((q) => q.id === id);
  },
  create(
    data: Omit<AdminQuestion, "id" | "created_at" | "updated_at">,
  ): AdminQuestion {
    const list = ensureSeeded();
    const now = new Date().toISOString();
    const item: AdminQuestion = {
      ...data,
      id: uuid(),
      created_at: now,
      updated_at: now,
    };
    write(KEYS.questions, [item, ...list]);
    return item;
  },
  update(id: string, data: Partial<AdminQuestion>): AdminQuestion | undefined {
    const list = ensureSeeded();
    let updated: AdminQuestion | undefined;
    const next = list.map((q) => {
      if (q.id !== id) return q;
      updated = { ...q, ...data, updated_at: new Date().toISOString() };
      return updated;
    });
    write(KEYS.questions, next);
    return updated;
  },
  remove(id: string) {
    write(
      KEYS.questions,
      ensureSeeded().filter((q) => q.id !== id),
    );
  },
  toggle(id: string, isActive: boolean) {
    return Questions.update(id, { is_active: isActive });
  },
  resetSeed() {
    write(KEYS.questions, seedQuestions());
  },
};

// === Final results / leaderboard ===
export const Results = {
  list(): FinalResult[] {
    return read<FinalResult[]>(KEYS.results, []);
  },
  add(input: Omit<FinalResult, "id" | "completed_at">): FinalResult {
    const item: FinalResult = {
      ...input,
      id: uuid(),
      completed_at: new Date().toISOString(),
    };
    const next = [item, ...read<FinalResult[]>(KEYS.results, [])];
    write(KEYS.results, next);
    return item;
  },
  leaderboard(limit = 10): FinalResult[] {
    return read<FinalResult[]>(KEYS.results, [])
      .slice()
      .sort((a, b) => {
        if (b.total_score !== a.total_score)
          return b.total_score - a.total_score;
        return (
          new Date(a.completed_at).getTime() -
          new Date(b.completed_at).getTime()
        );
      })
      .slice(0, limit);
  },
  rankOf(id: string): number {
    const sorted = Results.leaderboard(9999);
    const idx = sorted.findIndex((r) => r.id === id);
    return idx === -1 ? -1 : idx + 1;
  },
};

// === Player session ===
export const Player = {
  isLoggedIn(): boolean {
    try {
      return localStorage.getItem(KEYS.player) !== null;
    } catch {
      return false;
    }
  },
  clear() {
    localStorage.removeItem(KEYS.player);
  },
};

// === Admin auth ===
export const Admin = {
  isLoggedIn(): boolean {
    try {
      const v = localStorage.getItem("bats:admin") || localStorage.getItem("be_an_toan_so_admin");
      return v === ADMIN_PASSWORD;
    } catch {
      return false;
    }
  },
  login(pw: string): boolean {
    if (pw === ADMIN_PASSWORD) {
      localStorage.setItem("bats:admin", pw);
      return true;
    }
    return false;
  },
  logout() {
    localStorage.removeItem("bats:admin");
    localStorage.removeItem("be_an_toan_so_admin");
  },
  getPassword(): string {
    try {
      return localStorage.getItem("bats:admin") || localStorage.getItem("be_an_toan_so_admin") || "";
    } catch {
      return "";
    }
  },
};

// === Teacher auth (legacy fallback — Supabase Auth now primary) ===
export const Teacher = {
  logout() {
    try { localStorage.removeItem("bats:teacher_auth"); } catch { /* ignore */ }
  },
};

export { topicLabels };

// === Topic / Chủ đề ===
export type CustomTopic = {
  id: string;
  slug: string; // unique key
  label: string; // display name
  icon: string; // emoji
  color: string; // Tailwind color class
  order: number; // display order
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// === Learning Path / Lộ trình học tập ===
export type LearningPath = {
  id: string;
  title: string;
  description: string;
  topicIds: string[]; // ordered list of topic IDs
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// === Student Answer History / Lịch sử trả lời ===
export type StudentAnswer = {
  id: string;
  playerId: string;
  nickname: string;
  topicId: string;
  topicLabel: string;
  selectedOption: "A" | "B" | "C";
  correctOption: "A" | "B" | "C";
  isCorrect: boolean;
  timestamp: string;
};

// === Teacher account (Supabase Auth) ===
export type Teacher = {
  id: string;
  authUid: string;
  name: string;
  email: string;
  schoolId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// === Topics CRUD ===
export const Topics = {
  list(): CustomTopic[] {
    return read<CustomTopic[]>(KEYS.topics, []);
  },
  get(id: string): CustomTopic | undefined {
    return Topics.list().find((t) => t.id === id);
  },
  getBySlug(slug: string): CustomTopic | undefined {
    return Topics.list().find((t) => t.slug === slug);
  },
  create(data: Omit<CustomTopic, "id" | "createdAt" | "updatedAt">): CustomTopic {
    const now = new Date().toISOString();
    const item: CustomTopic = { ...data, id: uuid(), createdAt: now, updatedAt: now };
    write(KEYS.topics, [item, ...Topics.list()]);
    return item;
  },
  update(id: string, data: Partial<Omit<CustomTopic, "id" | "createdAt" | "updatedAt">>): CustomTopic | undefined {
    const list = Topics.list();
    let updated: CustomTopic | undefined;
    const next = list.map((t) => {
      if (t.id !== id) return t;
      updated = { ...t, ...data, updatedAt: new Date().toISOString() };
      return updated;
    });
    write(KEYS.topics, next);
    return updated;
  },
  remove(id: string) {
    write(KEYS.topics, Topics.list().filter((t) => t.id !== id));
  },
  reset() {
    write(KEYS.topics, []);
  },
};

// === Learning Paths CRUD ===
export const Paths = {
  list(): LearningPath[] {
    return read<LearningPath[]>(KEYS.paths, []);
  },
  get(id: string): LearningPath | undefined {
    return Paths.list().find((p) => p.id === id);
  },
  create(data: Omit<LearningPath, "id" | "createdAt" | "updatedAt">): LearningPath {
    const now = new Date().toISOString();
    const item: LearningPath = { ...data, id: uuid(), createdAt: now, updatedAt: now };
    write(KEYS.paths, [item, ...Paths.list()]);
    return item;
  },
  update(id: string, data: Partial<Omit<LearningPath, "id" | "createdAt" | "updatedAt">>): LearningPath | undefined {
    const list = Paths.list();
    let updated: LearningPath | undefined;
    const next = list.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...data, updatedAt: new Date().toISOString() };
      return updated;
    });
    write(KEYS.paths, next);
    return updated;
  },
  remove(id: string) {
    write(KEYS.paths, Paths.list().filter((p) => p.id !== id));
  },
  toggle(id: string, isActive: boolean) {
    return Paths.update(id, { isActive: isActive });
  },
};

// === Student Answers CRUD ===
export const StudentAnswers = {
  list(): StudentAnswer[] {
    return read<StudentAnswer[]>(KEYS.studentAnswers, []);
  },
  byPlayer(playerId: string): StudentAnswer[] {
    return StudentAnswers.list().filter((a) => a.playerId === playerId);
  },
  byNickname(nickname: string): StudentAnswer[] {
    return StudentAnswers.list().filter((a) => a.nickname === nickname);
  },
  byTopic(topicId: string): StudentAnswer[] {
    return StudentAnswers.list().filter((a) => a.topicId === topicId);
  },
  add(data: Omit<StudentAnswer, "id" | "timestamp">): StudentAnswer {
    const item: StudentAnswer = {
      ...data,
      id: uuid(),
      timestamp: new Date().toISOString(),
    };
    write(KEYS.studentAnswers, [item, ...StudentAnswers.list()]);
    return item;
  },
  addBatch(items: Omit<StudentAnswer, "id" | "timestamp">[]) {
    const now = new Date().toISOString();
    const records = items.map((d) => ({ ...d, id: uuid(), timestamp: now }));
    write(KEYS.studentAnswers, [...records, ...StudentAnswers.list()]);
  },
  clearByPlayer(playerId: string) {
    write(KEYS.studentAnswers, StudentAnswers.list().filter((a) => a.playerId !== playerId));
  },
  clearAll() {
    write(KEYS.studentAnswers, []);
  },
};

// === Teacher Dashboard Stats ===

export type SortOption = "newest" | "score" | "az" | "za";

export type StudentAggregate = {
  playerId: string;
  nickname: string;
  missionScore: number;
  quizScore: number;
  totalScore: number;
  title: string;
  badge: string;
  completedAt: string;
  answerCount: number;
  correctCount: number;
  accuracy: number;
  topicsAttempted: number;
};

export type TopicStats = {
  topicId: string;
  topicLabel: string;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
};

export type TeacherOverviewStats = {
  totalAttempts: number;
  averageScore: number;
  topScore: number;
  topStudent: { nickname: string; score: number } | null;
};

const SORT_COMPARATORS: Record<SortOption, (a: StudentAggregate, b: StudentAggregate) => number> = {
  newest: (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  score: (a, b) => b.totalScore - a.totalScore,
  az: (a, b) => a.nickname.toLowerCase().localeCompare(b.nickname.toLowerCase()),
  za: (a, b) => b.nickname.toLowerCase().localeCompare(a.nickname.toLowerCase()),
};

export const TeacherStats = {
  overview(): TeacherOverviewStats {
    const results = Results.list();
    if (results.length === 0) {
      return { totalAttempts: 0, averageScore: 0, topScore: 0, topStudent: null };
    }
    const totalAttempts = results.length;
    const scores = results.map((r) => r.total_score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const averageScore = Math.round(sum / totalAttempts);
    const topResult = results.reduce((max, r) => (r.total_score > max.total_score ? r : max), results[0]);
    return {
      totalAttempts,
      averageScore,
      topScore: topResult.total_score,
      topStudent: { nickname: topResult.nickname, score: topResult.total_score },
    };
  },

  aggregate(): StudentAggregate[] {
    const results = Results.list();
    const answers = StudentAnswers.list();
    return results.map((r) => {
      const playerAnswers = answers.filter((a) => a.playerId === r.player_id);
      const uniqueTopics = new Set(playerAnswers.map((a) => a.topicId));
      const correctCount = playerAnswers.filter((a) => a.isCorrect).length;
      const answerCount = playerAnswers.length;
      return {
        playerId: r.player_id,
        nickname: r.nickname,
        missionScore: r.mission_score,
        quizScore: r.quiz_score,
        totalScore: r.total_score,
        title: r.title,
        badge: r.badge,
        completedAt: r.completed_at,
        answerCount,
        correctCount,
        accuracy: answerCount > 0 ? Math.round((correctCount / answerCount) * 100) : 0,
        topicsAttempted: uniqueTopics.size,
      };
    });
  },

  topicChart(): TopicStats[] {
    const answers = StudentAnswers.list();
    const topicMap = new Map<string, StudentAnswer[]>();
    for (const a of answers) {
      const existing = topicMap.get(a.topicId) ?? [];
      existing.push(a);
      topicMap.set(a.topicId, existing);
    }
    return TOPIC_VALUES.map((topicId) => {
      const topicAnswers = topicMap.get(topicId) ?? [];
      const totalAnswers = topicAnswers.length;
      const correctAnswers = topicAnswers.filter((a) => a.isCorrect).length;
      return {
        topicId,
        topicLabel: topicLabels[topicId] ?? topicId,
        totalAnswers,
        correctAnswers,
        accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
      };
    });
  },

  sortAndFilter(
    rows: StudentAggregate[],
    opts: { query: string; sort: SortOption; page: number; pageSize: number }
  ): { items: StudentAggregate[]; total: number } {
    const { query, sort, page, pageSize } = opts;
    const q = query.trim().toLowerCase();
    const filtered = q ? rows.filter((r) => r.nickname.toLowerCase().includes(q)) : rows;
    const sorted = [...filtered].sort(SORT_COMPARATORS[sort]);
    const start = page * pageSize;
    return { items: sorted.slice(start, start + pageSize), total: sorted.length };
  },

  exportCSV(rows: StudentAggregate[]): Blob {
    const headers = ["nickname", "nhiệm vụ", "quiz", "tổng", "danh hiệu", "ngày"];
    const lines = rows.map((r) =>
      [
        `"${r.nickname}"`,
        r.missionScore,
        r.quizScore,
        r.totalScore,
        `"${r.title}"`,
        new Date(r.completedAt).toLocaleDateString("vi-VN"),
      ].join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  },
};
