import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SaveData = {
  nickname: string;
  gender: string;
  birthYear: number | undefined;
  playerId: string;
  profileXp: number;
  missionResults: Record<string, { score: number; correct: boolean }>;
  quiz: { correct: number; score: number; total: number } | null;
  lastResultId: string | undefined;
  activePath: any | null;
  topics: any[];
  activeTopic: any | null;
  activeQuestion: any | null;
};

type AppState = SaveData & {
  setNickname: (name: string) => void;
  setGender: (gender: string) => void;
  setBirthYear: (year: number) => void;
  setPlayerId: (id: string) => void;
  setProfileXp: (xp: number) => void;
  setMissionResult: (topicId: string, result: { score: number; correct: boolean }) => void;
  setQuiz: (quiz: { correct: number; score: number; total: number }) => void;
  setLastResultId: (id: string) => void;
  setActivePath: (path: any) => void;
  setTopics: (topics: any[]) => void;
  setActiveTopic: (topic: any) => void;
  setActiveQuestion: (question: any) => void;
  resetProgress: () => void;
  logout: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      nickname: "",
      gender: "",
      birthYear: undefined,
      playerId: "",
      profileXp: 0,
      missionResults: {},
      quiz: null,
      lastResultId: undefined,
      activePath: null,
      topics: [],
      activeTopic: null,
      activeQuestion: null,

      setNickname: (name) => set({ nickname: name }),
      setGender: (gender) => set({ gender }),
      setBirthYear: (year) => set({ birthYear: year }),
      setPlayerId: (id) => set({ playerId: id }),
      setProfileXp: (xp) => set({ profileXp: xp }),
      setMissionResult: (topicId, result) =>
        set((state) => ({
          missionResults: { ...state.missionResults, [topicId]: result },
        })),
      setQuiz: (quiz) => set({ quiz }),
      setLastResultId: (id) => set({ lastResultId: id }),
      
      setActivePath: (path) => set({ activePath: path }),
      setTopics: (topics) => set({ topics }),
      setActiveTopic: (topic) => set({ activeTopic: topic }),
      setActiveQuestion: (question) => set({ activeQuestion: question }),

      resetProgress: () =>
        set({
          missionResults: {},
          quiz: null,
          lastResultId: undefined,
          activePath: null,
          topics: [],
          activeTopic: null,
          activeQuestion: null,
        }),
      
      logout: () =>
        set({
          nickname: "",
          gender: "",
          birthYear: undefined,
          playerId: "",
          profileXp: 0,
          missionResults: {},
          quiz: null,
          lastResultId: undefined,
          activePath: null,
          topics: [],
          activeTopic: null,
          activeQuestion: null,
        }),
    }),
    {
      name: 'be-an-toan-so-storage',
    }
  )
);
