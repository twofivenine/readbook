"use client";
/** 공통 셸: 상단 헤더(데스크톱 네비) + 하단 탭바(모바일). 2탭 홈/서재 (D-4) */
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
  return (
    <>
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b-[1.5px] border-line">
        <div className="mx-auto max-w-[1040px] px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-baseline gap-2 min-w-0">
            <span className="text-[17px] font-bold truncate">{GROUP_NAME}</span>
            <span className="label-mono hidden sm:inline">책읽는 밤</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="주 메뉴">
            {TABS.map((t) => (
              <Link key={t.key} href={t.path} className={clsx("px-3 py-1.5 rounded-full text-[15px]", active === t.key ? "bg-ink text-white" : "text-ink-2 hover:bg-black/5")} aria-current={active === t.key ? "page" : undefined}>
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="label-mono truncate max-w-[140px]">{store?.lastName ?? "로그인 없음"}</div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-[1040px] px-4 pt-4 pb-24 md:pb-10">
        {store ? children : <div className="text-muted text-[14px] py-6">불러오는 중…</div>}
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t-[1.5px] border-line" aria-label="하단 탭">
        <div className="grid grid-cols-2">
          {TABS.map((t) => (
            <Link key={t.key} href={t.path} className={clsx("py-3 text-center text-[14px]", active === t.key ? "font-bold text-ink border-t-2 border-ink -mt-[1.5px]" : "text-muted")} aria-current={active === t.key ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
