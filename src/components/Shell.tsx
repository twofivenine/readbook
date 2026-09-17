"use client";
/** 공통 셸 — 시안: 상단 헤더(제목 + 부제 + 네비 + 아바타), 모바일 하단 탭 (홈/서재) */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { useClientStore } from "@/lib/clientStore";

export const GROUP_NAME = "독서모임";
const TABS = [
  { key: "home", label: "홈", path: "/" },
  { key: "library", label: "서재", path: "/library" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5_000 } } }));
  return (
    <QueryClientProvider client={qc}>
      <Frame>{children}</Frame>
    </QueryClientProvider>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const store = useClientStore();
  const active = pathname.startsWith("/library") ? "library" : "home";
  const initial = store?.lastName ? Array.from(store.lastName)[0] : null;
  return (
    <>
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-[1180px] px-5 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-baseline gap-3 min-w-0">
            <span className="display text-[17px] md:text-[19px] font-bold truncate">{GROUP_NAME}</span>
            <span className="text-[13px] text-mono hidden sm:inline">책읽는 밤</span>
          </Link>
          <div className="flex items-center gap-5 md:gap-6">
            <nav className="hidden md:flex items-center gap-6 text-[14px] text-muted" aria-label="주 메뉴">
              {TABS.map((t) => (
                <Link key={t.key} href={t.path} className={clsx("transition-colors hover:text-ink", active === t.key && "text-ink font-medium")} aria-current={active === t.key ? "page" : undefined}>
                  {t.label}
                </Link>
              ))}
            </nav>
            <div className="w-[30px] h-[30px] rounded-full bg-[#e6e2d9] border border-[#ded9cf] flex items-center justify-center text-[12px] text-ink-2" title={store?.lastName ?? "이름 없음"} aria-label={store?.lastName ? `이름: ${store.lastName}` : "이름 없음"}>
              {initial}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-[1180px] px-5 md:px-8 pt-5 md:pt-8 pb-24 md:pb-14">
        {store ? children : <div className="text-muted text-[14px] py-6">불러오는 중…</div>}
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card-soft border-t border-line" aria-label="하단 탭">
        <div className="grid grid-cols-2">
          {TABS.map((t) => (
            <Link key={t.key} href={t.path} className={clsx("py-3.5 text-center text-[14px]", active === t.key ? "font-medium text-ink" : "text-muted")} aria-current={active === t.key ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
