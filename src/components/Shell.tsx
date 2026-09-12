"use client";
/** 모임 화면 공통 셸: 상단 헤더(데스크톱 네비) + 하단 탭바(모바일) + 진입 모달 (D-4, §7.1) */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { IdentityProvider, useIdentity } from "@/lib/identity";
import { useHome } from "@/lib/hooks";
import { clsx } from "@/lib/clsx";
import { JoinGate } from "./JoinGate";

const TABS = [
  { key: "home", label: "홈", path: "" },
  { key: "library", label: "서재", path: "/library" },
  { key: "members", label: "멤버", path: "/members" },
];

export function GroupShell({ token, children }: { token: string; children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5_000 } } }));
  return (
    <QueryClientProvider client={qc}>
      <IdentityProvider>
        <Frame token={token}>{children}</Frame>
      </IdentityProvider>
    </QueryClientProvider>
  );
}

function Frame({ token, children }: { token: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const home = useHome(token);
  const { identity, ready } = useIdentity();
  const base = `/g/${token}`;
  const active = TABS.find((t) => (t.path ? pathname.startsWith(base + t.path) : pathname === base))?.key ?? "home";
  const { setIdentity } = useIdentity();
  const g = home.data?.group;

  // 다른 모임의 identity 가 저장돼 있으면 이 모임에서는 비식별로 취급 (§2.3)
  useEffect(() => {
    if (g && identity && identity.groupId !== g.id) setIdentity(null);
  }, [g, identity, setIdentity]);

  if (home.isError) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm flex flex-col gap-3">
          <div className="text-[22px] font-bold">링크가 만료되었습니다</div>
          <div className="text-[15px] text-muted">초대 링크가 재발급되었거나 잘못된 주소예요. 멤버에게 새 링크를 받아 주세요.</div>
          <Link href="/" className="text-accent text-[15px]">새 모임 만들기</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b-[1.5px] border-line">
        <div className="mx-auto max-w-[1040px] px-4 h-14 flex items-center justify-between gap-3">
          <Link href={base} className="flex items-baseline gap-2 min-w-0">
            <span className="text-[17px] font-bold truncate">{g?.name ?? "책읽는 밤"}</span>
            {g && (
              <span className="label-mono hidden sm:inline">
                멤버 {g.memberCount}/8{home.data?.currentRound?.label ? ` · ${home.data.currentRound.label}` : ""}
              </span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="주 메뉴">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={base + t.path}
                className={clsx("px-3 py-1.5 rounded-full text-[15px]", active === t.key ? "bg-ink text-white" : "text-ink-2 hover:bg-black/5")}
                aria-current={active === t.key ? "page" : undefined}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="label-mono truncate max-w-[120px]">{ready && identity ? identity.nickname : "열람 중"}</div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1040px] px-4 pt-4 pb-24 md:pb-10">
        {ready && home.data ? children : <div className="text-muted text-[14px] py-6">불러오는 중…</div>}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t-[1.5px] border-line" aria-label="하단 탭">
        <div className="grid grid-cols-3">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={base + t.path}
              className={clsx("py-3 text-center text-[14px]", active === t.key ? "font-bold text-ink border-t-2 border-ink -mt-[1.5px]" : "text-muted")}
              aria-current={active === t.key ? "page" : undefined}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      <JoinGate token={token} home={home.data} />
    </>
  );
}
