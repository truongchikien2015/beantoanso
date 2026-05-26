import { Questions } from "./store";
import { AdminQuestion } from "./store";

const KEY = "bats:daily:v1";

type DailyState = {
  lastDate: string;
  streak: number;
  todayDone: boolean;
  todayCorrect?: boolean;
  todayQuestionId?: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function read(): DailyState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { lastDate: "", streak: 0, todayDone: false };
}

function write(s: DailyState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function getDailyState(): DailyState {
  const s = read();
  if (s.lastDate !== todayStr()) {
    return { ...s, todayDone: false, todayQuestionId: undefined };
  }
  return s;
}

function pickDeterministic(qs: AdminQuestion[]): AdminQuestion {
  const seed = todayStr();
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return qs[h % qs.length];
}

export function getDailyQuestion(): AdminQuestion | null {
  const active = Questions.active();
  if (active.length === 0) return null;
  return pickDeterministic(active);
}

export function recordDailyAnswer(correct: boolean) {
  const today = todayStr();
  const s = read();
  if (s.lastDate === today) {
    write({ ...s, todayDone: true, todayCorrect: correct });
    return;
  }
  // new day
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const nextStreak = s.lastDate === yesterday && correct ? s.streak + 1 : correct ? 1 : 0;
  write({
    lastDate: today,
    streak: nextStreak,
    todayDone: true,
    todayCorrect: correct,
  });
}
