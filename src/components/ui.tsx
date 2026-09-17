"use client";
import Link from "next/link";
import { clsx } from "@/lib/clsx";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "accent" | "ghost" | "danger"; size?: "sm" | "md"; full?: boolean };

/** 와이어프레임의 알약형 버튼 */
export function Button({ variant = "outline", size = "md", full, className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center justify-center gap-1 rounded-full border-[1.5px] whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        size === "md" ? "px-4 py-2.5 text-[15px]" : "px-3 py-1.5 text-[13px]",
        variant === "primary" && "bg-ink text-white border-ink hover:bg-black",
        variant === "outline" && "bg-white text-ink border-line hover:border-ink",
        variant === "accent" && "bg-white text-accent border-accent border-2 font-semibold",
        variant === "ghost" && "border-transparent text-muted hover:text-ink hover:bg-black/5",
        variant === "danger" && "bg-white text-danger border-line hover:border-danger",
        full && "w-full",
        className,
      )}
    />
  );
}

export function LinkButton({ href, children, variant = "outline", className }: { href: string; children: React.ReactNode; variant?: "primary" | "outline"; className?: string }) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center rounded-full border-[1.5px] px-4 py-2.5 text-[15px] whitespace-nowrap transition-colors",
        variant === "primary" ? "bg-ink text-white border-ink hover:bg-black" : "bg-white text-ink border-line hover:border-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={clsx("rounded-[10px] bg-card border-[1.5px] border-line p-4 flex flex-col gap-3 scroll-mt-16", className)}>{children}</section>;
}

export function Label({ children, accent, className }: { children: React.ReactNode; accent?: boolean; className?: string }) {
  return <div className={clsx("label-mono", accent && "text-accent!", className)}>{children}</div>;
}

export function Divider({ className }: { className?: string }) {
  return <hr className={clsx("border-0 border-t-[1.5px] border-dashed border-line", className)} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx("w-full rounded-md border-[1.5px] border-line bg-white px-3 py-2.5 text-[15px] placeholder:text-[#9a958b] focus:border-ink", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx("w-full rounded-md border-[1.5px] border-line bg-white px-3 py-2.5 text-[15px] placeholder:text-[#9a958b] focus:border-ink resize-y", props.className)} />;
}

/** 이름 입력 칸 (F-1.4, 1.5) */
export function NameInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="이름 (비우면 익명)" maxLength={12} aria-label="이름" className={className} />;
}

export function StarValue({ value }: { value: number | null }) {
  return <span className="text-star font-semibold">{value === null ? <span className="text-muted">–</span> : `★${value}`}</span>;
}

/** 별점 선택 (1~5) */
export function StarPicker({ value, onChange, disabled }: { value: number | null; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex" role="radiogroup" aria-label="별점">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`${s}점`}
          disabled={disabled}
          onClick={() => onChange(s)}
          className={clsx("text-[28px] leading-none px-0.5 disabled:opacity-50", value !== null && s <= value ? "text-star" : "text-line hover:text-star/60")}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/** 표지 (없으면 플레이스홀더, F-9.3) */
export function Cover({ url, title, className }: { url: string | null; title: string; className?: string }) {
  return (
    <div className={clsx("shrink-0 rounded-md border-[1.5px] border-line bg-bg overflow-hidden flex items-center justify-center", className)} style={{ aspectRatio: "2 / 3" }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${title} 표지`} className="w-full h-full object-cover" />
      ) : (
        <span className="label-mono">표지</span>
      )}
    </div>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <div className="text-[13px] text-danger" role="alert">{children}</div>;
}

export function DdayBadge({ dday, accent }: { dday: number | null; accent?: boolean }) {
  if (dday === null) return null;
  return <span className={clsx("label-mono whitespace-nowrap", accent && "text-accent!")}>{dday === 0 ? "D-Day" : dday > 0 ? `D-${dday}` : `D+${-dday}`}</span>;
}
