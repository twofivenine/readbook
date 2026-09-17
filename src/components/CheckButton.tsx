"use client";
/** D-3 체크 버튼: 누르면 +1, 다시 누르면 취소. 브라우저당 후보별 1회 */
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import type { PollKind } from "@/lib/types";
import { clsx } from "@/lib/clsx";

export function CheckButton({ kind, candidateId, checked, disabled, size = "sm" }: { kind: PollKind; candidateId: string; checked: boolean; disabled?: boolean; size?: "sm" | "lg" }) {
  const toggle = useWrite(() => api(`/polls/${kind}/candidates/${candidateId}/check`, { method: checked ? "DELETE" : "POST" }));
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={checked ? "체크 취소" : "체크"}
      disabled={disabled || toggle.isPending}
      onClick={() => toggle.mutate(undefined)}
      className={clsx(
        "shrink-0 rounded-full border-2 flex items-center justify-center font-bold transition-colors disabled:opacity-50 disabled:cursor-default",
        size === "sm" ? "w-7 h-7 text-[15px]" : "w-10 h-10 text-[20px]",
        checked ? "border-accent bg-accent text-white" : "border-line bg-white text-line hover:border-ink hover:text-ink",
      )}
    >
      ✓
    </button>
  );
}
