"use client";

import { useRouter } from "next/navigation";
import { EscapeRoomSimulation } from "../../../components/EscapeRoomSimulation";
import { useAppStore } from "../../../lib/globalStore";

export default function EscapeRoomPage() {
  const router = useRouter();
  const nickname = useAppStore((state) => state.nickname);
  const profileXp = useAppStore((state) => state.profileXp);
  const setProfileXp = useAppStore((state) => state.setProfileXp);

  const handleComplete = async (simScore: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("student_token") : null;
    if (token) {
      try {
        const res = await fetch("/api/student/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ xp: simScore, source: "simulation_escape_room" }),
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.stats) {
          setProfileXp(body.stats.total_xp);
          return;
        }
      } catch (err) {
        console.error("Failed to sync escape room progress:", err);
      }
    }
    // Fallback update local store
    setProfileXp(profileXp + simScore);
  };

  return (
    <div className="py-8 bg-gradient-to-b from-sky-50 via-pink-50 to-amber-50 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <EscapeRoomSimulation
          onBack={() => router.push(nickname ? "/student/dashboard?view=1" : "/")}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
