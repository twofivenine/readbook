"use client";
/** F-6.3, F-6.6 스포일러: 블러 + 탭으로 펼침 (펼침 상태는 컴포넌트 로컬) */
import { useState } from "react";
import { clsx } from "@/lib/clsx";

export function Spoiler({ hidden, children, className }: { hidden: boolean; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  if (!hidden || open) return <span className={className}>{children}</span>;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={clsx("text-left inline-flex items-center gap-2 rounded-md bg-bg px-2 py-1 border-[1.5px] border-dashed border-line", className)}
      aria-label="스포일러 펼치기"
    >
      <span className="label-mono">스포일러</span>
      <span className="text-[13px] text-muted">탭하면 펼쳐집니다</span>
    </button>
  );
}
