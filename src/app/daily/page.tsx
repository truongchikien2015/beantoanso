"use client";

import { useRouter } from "next/navigation";
import { DailyChallenge } from "../../components/DailyChallenge";
import { useAppStore } from "../../lib/globalStore";

export default function DailyChallengePage() {
  const router = useRouter();
  const nickname = useAppStore((state) => state.nickname);

  return <DailyChallenge onBack={() => router.push(nickname ? "/map" : "/")} />;
}
