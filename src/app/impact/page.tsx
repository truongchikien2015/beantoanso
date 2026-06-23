"use client";

import { SocialImpactDashboard } from "../../components/SocialImpactDashboard";

export default function ImpactPage() {
  return (
    <div className="py-12 bg-gradient-to-b from-sky-50 via-emerald-50 to-indigo-50/10 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <SocialImpactDashboard />
      </div>
    </div>
  );
}
