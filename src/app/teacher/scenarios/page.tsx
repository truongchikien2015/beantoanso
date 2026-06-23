"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Teacher } from "@/lib/store";
import TeacherDashboard from "@/components/admin/TeacherDashboard";

export default function TeacherScenariosPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Check local bypass first
    const isBypass = typeof window !== "undefined" && localStorage.getItem("bats:teacher_bypass") === "true";
    if (isBypass) {
      setLoggedIn(true);
      setReady(true);
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
    if (!token) {
      router.push("/teacher");
      return;
    }

    // Verify token validity by calling a teacher endpoint
    fetch("/api/teacher/topics", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          setLoggedIn(true);
          setReady(true);
        } else {
          localStorage.removeItem("teacher_token");
          router.push("/teacher");
        }
      })
      .catch(() => {
        // Fallback for offline usage/local network issues
        setLoggedIn(true);
        setReady(true);
      });
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      localStorage.removeItem("bats:teacher_bypass");
      localStorage.removeItem("teacher_token");
    } catch (err) {
      // ignore
    }
    // Fallback to localStorage clear
    Teacher.logout();
    router.push("/");
  }, [router]);

  if (!ready) return null;

  return <TeacherDashboard onLogout={handleLogout} initialTab="scenarios" />;
}
