"use client";
/**
 * TRD §2.1, §7.2, §7.3 — 신원 상태 + 쓰기 액션 게이트.
 * localStorage `bookclub:identity` = { groupId, memberId, nickname }
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ApiClientError, setApiMemberId } from "./api";

export const IDENTITY_KEY = "bookclub:identity";

export interface Identity {
  groupId: string;
  memberId: string;
  nickname: string;
}

let memoryFallback: Identity | null = null;

/* ---- 외부 스토어 (localStorage + 메모리) : useSyncExternalStore 로 구독 ---- */
const listeners = new Set<() => void>();
let snapshot: Identity | null | undefined; // undefined = 아직 안 읽음

function readSnapshot(): Identity | null {
  if (snapshot === undefined) {
    snapshot = loadIdentity();
    setApiMemberId(snapshot?.memberId ?? null);
  }
  return snapshot;
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function emit() {
  for (const l of listeners) l();
}
const serverSnapshot = () => null;
const clientReady = () => true;
const serverReady = () => false;

export function loadIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return memoryFallback;
    const v = JSON.parse(raw);
    if (v && typeof v.groupId === "string" && typeof v.memberId === "string" && typeof v.nickname === "string") return v;
    return memoryFallback;
  } catch {
    return memoryFallback;
  }
}

export function saveIdentity(id: Identity | null) {
  memoryFallback = id;
  snapshot = id;
  try {
    if (id) localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
    else localStorage.removeItem(IDENTITY_KEY);
  } catch {
    /* 사파리 프라이빗 등: 메모리로 대체 */
  }
  setApiMemberId(id?.memberId ?? null);
  emit();
}

interface IdentityCtx {
  identity: Identity | null;
  ready: boolean;
  setIdentity: (id: Identity | null) => void;
  /** 쓰기 액션 래퍼: identity 없으면 모달 → 성공 후 실행. 401이면 identity 폐기 후 모달 */
  withMember: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  gateOpen: boolean;
  closeGate: () => void;
  gateReason: string | null;
}

const Ctx = createContext<IdentityCtx | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const identity = useSyncExternalStore(subscribe, readSnapshot, serverSnapshot);
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState<string | null>(null);
  const pending = useRef<{ fn: () => Promise<unknown>; resolve: (v: unknown) => void } | null>(null);

  const setIdentity = useCallback((id: Identity | null) => {
    saveIdentity(id);
    if (id && pending.current) {
      const p = pending.current;
      pending.current = null;
      setGateOpen(false);
      p.fn().then(p.resolve, () => p.resolve(undefined));
    }
  }, []);

  const withMember = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (!identity) {
        setGateReason(null);
        setGateOpen(true);
        return new Promise<T | undefined>((resolve) => {
          pending.current = { fn, resolve: resolve as (v: unknown) => void };
        });
      }
      try {
        return await fn();
      } catch (e) {
        if (e instanceof ApiClientError && e.status === 401) {
          saveIdentity(null);
          setGateReason("저장된 멤버 정보가 더 이상 유효하지 않아요. 다시 참여하거나 이어받아 주세요.");
          setGateOpen(true);
          return new Promise<T | undefined>((resolve) => {
            pending.current = { fn, resolve: resolve as (v: unknown) => void };
          });
        }
        throw e;
      }
    },
    [identity],
  );

  const closeGate = useCallback(() => {
    setGateOpen(false);
    if (pending.current) {
      pending.current.resolve(undefined);
      pending.current = null;
    }
  }, []);

  const value = useMemo(
    () => ({ identity, ready, setIdentity, withMember, gateOpen, closeGate, gateReason }),
    [identity, ready, setIdentity, withMember, gateOpen, closeGate, gateReason],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useIdentity() {
  const v = useContext(Ctx);
  if (!v) throw new Error("IdentityProvider missing");
  return v;
}
