"use client";
/** D-3 체크 버튼: 누르면 +1, 다시 누르면 취소. 브라우저당 후보별 1회 */
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import type { PollKind } from "@/lib/types";
import { clsx } from "@/lib/clsx";

export function CheckButton({ kind, candidateId, checked, disabled, size = "sm" }: { kind: PollKind; candidateId: string; checked: boolean; disabled?: boolean; size?: "sm" | "lg" }) {
  const toggle = useWrite(() => api(`/polls/${kind}/candidates/${candidateId}/check`, { method: checked ? "DELETE" : "POST" }));
  return (
    <button type="button" aria-pressed={checked} aria-label={checked ? "체크 취소" : "체크"} disabled={disabled || toggle.isPending} onClick={() => toggle.mutate(undefined)}
      className={clsx("shrink-0 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-default",
        size === "sm" ? "w-5 h-5" : "w-6 h-6",
        checked ? "border-[5px] border-accent bg-white" : "border border-line bg-white hover:border-accent")}
    />
  );
}
