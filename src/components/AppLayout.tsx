"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname() || "";

  // Danh sách các route loại trừ không hiển thị Header chung của học sinh
  const noHeaderRoutes = ["/admin", "/teacher", "/parent", "/share"];
  const showHeader = !noHeaderRoutes.some((route) => pathname.startsWith(route));

  return (
    <>
      {showHeader && <Header />}
      {children}
    </>
  );
}
