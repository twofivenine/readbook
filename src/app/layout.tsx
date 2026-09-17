import type { Metadata, Viewport } from "next";
import { Gothic_A1, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

const body = IBM_Plex_Sans_KR({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Gothic_A1({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: { default: "독서모임", template: "%s · 독서모임" },
  description: "카톡방에 흩어진 독서모임 운영을 한 곳에 모으는 도구",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`h-full ${body.variable} ${display.variable}`}>
      <body className="min-h-full flex flex-col">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
