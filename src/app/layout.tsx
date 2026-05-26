import type { Metadata } from "next";
import "../styles/fonts.css";
import "../styles/tailwind.css";
import "../styles/theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bé An Toàn Số 🛡️",
  description: "Cùng Bé Kiên và Robot An Toàn học cách sử dụng Internet an toàn nhé! Game học mà chơi dành cho học sinh tiểu học.",
  keywords: ["an toàn số", "internet an toàn", "học sinh tiểu học", "trò chơi giáo dục"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Preconnect for performance, then load Nunito */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-kid-page">
        {children}
      </body>
    </html>
  );
}
