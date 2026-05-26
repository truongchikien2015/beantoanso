"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLogin } from "../../components/admin/AdminLogin";
import { AdminDashboard } from "../../components/admin/AdminDashboard";
import { Admin } from "../../lib/store";

export default function AdminPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Admin.isLoggedIn());
    setHasCheckedAuth(true);
  }, []);

  if (!hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200" />
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminLogin
        onSuccess={() => setIsLoggedIn(true)}
        onBack={() => router.push("/")}
      />
    );
  }
  return <AdminDashboard onBack={() => router.push("/")} />;
}
