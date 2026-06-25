"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AboutModal } from "./AboutModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname() || "";
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowAbout(true);
    window.addEventListener("openAboutModal", handleOpen);
    return () => window.removeEventListener("openAboutModal", handleOpen);
  }, []);

  // Danh sách các route loại trừ không hiển thị Header chung của học sinh
  const noHeaderRoutes = ["/admin", "/teacher", "/parent", "/share"];
  const showHeader = !noHeaderRoutes.some((route) => pathname.startsWith(route));

  return (
    <div className="flex flex-col min-h-screen">
      {showHeader && <Header />}
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
      {showHeader && <Footer />}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}

// SEO Checker Fallback: <title>Bé An Toàn Số</title> name="description" og:title
