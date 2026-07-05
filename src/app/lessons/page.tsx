"use client";

import { useRouter } from "next/navigation";
import { LessonsScreen } from "../../components/LessonsScreen";
import { useAppStore } from "../../lib/globalStore";

export default function LessonsPage() {
  const router = useRouter();
  const nickname = useAppStore((state) => state.nickname);

  return <LessonsScreen onBack={() => router.push(nickname ? "/map" : "/")} />;
}
