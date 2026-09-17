"use client";
import Link from "next/link";
import { clsx } from "@/lib/clsx";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "accent" | "ghost" | "danger" | "light"; size?: "sm" | "md"; full?: boolean };

const btnBase = "inline-flex items-center justify-center gap-1 rounded-full border whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const btnVariant = {
  primary: "bg-accent text-white border-accent hover:bg-accent-deep font-medium display",
  outline: "bg-white text-ink-2 border-line hover:border-ink",
  accent: "bg-white text-accent border-accent hover:bg-accent-soft",
  ghost: "border-transparent text-muted hover:text-ink hover:bg-black/5",
  danger: "bg-white text-danger border-line hover:border-danger",
  light: "bg-dark-text text-dark border-dark-text font-medium",
};

/** 시안의 알약형 버튼 (기본 녹색) */
export function Button({ variant = "outline", size = "md", full, className, ...rest }: BtnProps) {
  return <button {...rest} className={clsx(btnBase, size === "md" ? "px-5 py-2.5 text-[14px]" : "px-3.5 py-1.5 text-[13px]", btnVariant[variant], full && "w-full", className)} />;
}

export function LinkButton({ href, children, variant = "outline", className }: { href: string; children: React.ReactNode; variant?: "primary" | "outline" | "accent"; className?: string }) {
  return <Link href={href} className={clsx(btnBase, "px-5 py-2.5 text-[14px]", btnVariant[variant], className)}>{children}</Link>;
}

export function Card({ children, className, id, tone = "white" }: { children: React.ReactNode; className?: string; id?: string; tone?: "white" | "soft" | "accent" | "dark" }) {
  return (
    <section
      id={id}
      className={clsx(
        "rounded-xl p-5 md:p-6 flex flex-col gap-4 scroll-mt-20",
        tone === "white" && "bg-card border border-line",
        tone === "soft" && "bg-card-soft border border-line",
        tone === "accent" && "bg-accent-soft border border-accent",
        tone === "dark" && "bg-dark text-dark-text",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Label({ children, accent, dark, className }: { children: React.ReactNode; accent?: boolean; dark?: boolean; className?: string }) {
  return <div className={clsx("label-mono", accent && "text-accent!", dark && "text-dark-label!", className)}>{children}</div>;
}

/** 카드 제목 (Gothic A1) */
export function Title({ children, className, size = "md" }: { children: React.ReactNode; className?: string; size?: "sm" | "md" | "lg" }) {
  return <h2 className={clsx("display font-bold", size === "sm" ? "text-[15px]" : size === "md" ? "text-[18px]" : "text-[22px] md:text-[28px] leading-tight", className)}>{children}</h2>;
}

export function Divider({ className }: { className?: string }) {
  return <hr className={clsx("border-0 border-t border-line-soft", className)} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx("w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] placeholder:text-mono focus:border-accent", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx("w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] placeholder:text-mono focus:border-accent resize-y", props.className)} />;
}

/** 이름 입력 칸 (F-1.4, 1.5) */
export function NameInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="이름 (비우면 익명)" maxLength={12} aria-label="이름" className={className} />;
}

export function StarValue({ value }: { value: number | null }) {
  return <span className="text-ink-2">{value === null ? <span className="text-mono">–</span> : `★ ${value.toFixed(1)}`}</span>;
}

/** 별점 선택 (1~5) */
export function StarPicker({ value, onChange, disabled }: { value: number | null; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex" role="radiogroup" aria-label="별점">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" role="radio" aria-checked={value === s} aria-label={`${s}점`} disabled={disabled} onClick={() => onChange(s)}
          className={clsx("text-[26px] leading-none px-0.5 disabled:opacity-50 transition-colors", value !== null && s <= value ? "text-star" : "text-line hover:text-star/60")}>
          ★
        </button>
      ))}
    </div>
  );
}

/** 표지 (없으면 빗금 플레이스홀더, F-9.3) */
export function Cover({ url, title, className, dark }: { url: string | null; title: string; className?: string; dark?: boolean }) {
  return (
    <div className={clsx("shrink-0 rounded-md overflow-hidden flex items-end justify-center", !url && (dark ? "cover-placeholder-dark" : "cover-placeholder"), className)} style={{ aspectRatio: "3 / 4" }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${title} 표지`} className="w-full h-full object-cover" />
      ) : (
        <span className="label-mono text-[9px] pb-1.5 tracking-normal">표지</span>
      )}
    </div>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <div className="text-[13px] text-danger" role="alert">{children}</div>;
}

export function DdayPill({ dday, dark }: { dday: number | null; dark?: boolean }) {
  if (dday === null) return null;
  const text = dday === 0 ? "D-Day" : dday > 0 ? `D-${dday}` : `D+${-dday}`;
  return <span className={clsx("label-mono tracking-normal! whitespace-nowrap rounded-full px-3 py-1.5 border", dark ? "text-dark-label! border-dark-line" : "text-accent! border-accent-line bg-white")}>{text}</span>;
}

/** 진행 막대 (득표 비율 등) */
export function Bar({ ratio, strong }: { ratio: number; strong?: boolean }) {
  return (
    <div className="flex-1 h-1.5 rounded-full bg-line-soft overflow-hidden">
      <div className={clsx("h-full rounded-full", strong ? "bg-accent" : "bg-bar")} style={{ width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%` }} />
    </div>
  );
}
