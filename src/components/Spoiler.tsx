"use client";
/** F-6.3 스포일러: 가림 + 탭으로 펼침 */
import { useState } from "react";
import { clsx } from "@/lib/clsx";

export function Spoiler({ hidden, children, className }: { hidden: boolean; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  if (!hidden || open) return <span className={className}>{children}</span>;
  return (
    <button type="button" onClick={() => setOpen(true)} className={clsx("text-left inline-flex items-center gap-2 rounded-md bg-card-soft px-2.5 py-1 border border-dashed border-line", className)} aria-label="스포일러 펼치기">
      <span className="label-mono">스포일러</span>
      <span className="text-[13px] text-muted">탭하면 펼쳐집니다</span>
    </button>
  );
}
