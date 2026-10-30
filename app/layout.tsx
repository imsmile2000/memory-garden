import type { Metadata } from "next";
import "./globals.css";

const title = "기억의 정원 — 작은 발걸음, 오래 머무는 마음";
const description = "강아지, 고양이와 함께 산책하고 우리 아이를 자랑하는 3D 정원.";

export const metadata: Metadata = {
  metadataBase: new URL("https://memory-garden-iota.vercel.app"),
  title,
  description,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "기억의 정원",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "3D 정원을 함께 산책하는 기억의 정원 대표 이미지" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
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
