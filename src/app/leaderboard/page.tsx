"use client";

import { useRouter } from "next/navigation";
import { Leaderboard } from "../../components/Leaderboard";
import { useAppStore } from "../../lib/globalStore";

export default function LeaderboardPage() {
  const router = useRouter();
  const nickname = useAppStore((state) => state.nickname);
  const lastResultId = useAppStore((state) => state.lastResultId);

  return (
    <Leaderboard
      currentResultId={lastResultId}
      onHome={() => router.push(nickname ? "/map" : "/")}
      onReplay={() => {
        if (nickname) {
          useAppStore.getState().resetProgress();
          router.push("/path-select");
        } else {
          router.push("/");
        }
      }}
    />
  );
}
