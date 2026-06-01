import { Results } from "./store";

export type LevelInfo = {
  level: number;
  xp: number;
  xpInLevel: number;
  xpForNext: number;
  progress: number;
  title: string;
};

const TITLES = [
  "Tân binh",
  "Chiến sĩ",
  "Hiệp sĩ",
  "Vệ binh",
  "Bậc thầy",
  "Truyền kỳ",
];

export function totalXpForPlayer(playerId: string): number {
  return Results.list()
    .filter((r) => r.player_id === playerId)
    .reduce((sum, r) => sum + r.total_score, 0);
}

export function levelInfo(xp: number): LevelInfo {
  // every 100 XP = 1 level
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp - (level - 1) * 100;
  const xpForNext = 100;
  const progress = xpInLevel / xpForNext;
  const title = TITLES[Math.min(level - 1, TITLES.length - 1)];
  return { level, xp, xpInLevel, xpForNext, progress, title };
}

const AVATARS = [
  { id: "kid", emoji: "👦", name: "Bé Kiên", unlockLevel: 1 },
  { id: "boy", emoji: "👦", name: "Bé Bo", unlockLevel: 1 },
  { id: "robot", emoji: "🤖", name: "Robot", unlockLevel: 2 },
  { id: "ninja", emoji: "🥷", name: "Ninja", unlockLevel: 3 },
  { id: "wizard", emoji: "🧙", name: "Phù thủy", unlockLevel: 4 },
  { id: "hero", emoji: "🦸", name: "Siêu nhân", unlockLevel: 5 },
];

export function getAvatars() {
  return AVATARS;
}

const AVATAR_KEY = "bats:avatar";

export function getSelectedAvatar(): string {
  try {
    return localStorage.getItem(AVATAR_KEY) || "kid";
  } catch {
    return "kid";
  }
}

export function setSelectedAvatar(id: string) {
  try {
    localStorage.setItem(AVATAR_KEY, id);
  } catch {
    // ignore
  }
}
