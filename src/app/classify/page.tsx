"use client";

import { useRouter } from "next/navigation";
import { ClassifyGame } from "../../components/ClassifyGame";
import { useAppStore } from "../../lib/globalStore";

export default function ClassifyPage() {
  const router = useRouter();
  const nickname = useAppStore((state) => state.nickname);

  return <ClassifyGame onBack={() => router.push(nickname ? "/map" : "/")} />;
}
