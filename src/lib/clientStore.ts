"use client";
/**
 * TRD v1.1 §2 브라우저 저장: localStorage["bookclub"] = { clientId, lastName }
 * 최초 방문 시 clientId(UUID v4) 생성. 저장 불가 브라우저는 세션 메모리로 대체.
 */
import { useSyncExternalStore } from "react";
import { setApiClientId } from "./api";

const KEY = "bookclub";
interface Stored { clientId: string; lastName: string | null }

let snapshot: Stored | null | undefined; // undefined = 아직 안 읽음
let memory: Stored | null = null;
const listeners = new Set<() => void>();

function uuid(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw);
      if (v && typeof v.clientId === "string") return { clientId: v.clientId, lastName: typeof v.lastName === "string" ? v.lastName : null };
    }
  } catch { /* fall through */ }
  if (memory) return memory;
  const fresh = { clientId: uuid(), lastName: null };
  persist(fresh);
  return fresh;
}

function persist(v: Stored) {
  memory = v;
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch { /* 프라이빗 모드 등 */ }
}

function read(): Stored | null {
  if (snapshot === undefined) {
    snapshot = load();
    setApiClientId(snapshot.clientId);
  }
  return snapshot;
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const server = () => null;

/** 현재 저장값. 서버 렌더·첫 하이드레이션에서는 null */
export function useClientStore(): Stored | null {
  return useSyncExternalStore(subscribe, read, server);
}

/** F-1.5 마지막 입력 이름 기억 */
export function rememberName(name: string) {
  const cur = read();
  if (!cur) return;
  snapshot = { ...cur, lastName: name.trim() || null };
  persist(snapshot);
  for (const l of listeners) l();
}
