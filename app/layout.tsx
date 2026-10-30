import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "기억의 정원 — 작은 발걸음, 오래 머무는 마음",
  description: "강아지, 고양이와 함께 산책하고 우리 아이를 자랑하는 3D 정원.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
