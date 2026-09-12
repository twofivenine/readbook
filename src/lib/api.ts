/** 클라이언트 fetch 래퍼: X-Member-Id 부착, 오류 정규화 (TRD §2.1, §7.3) */
export class ApiClientError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

let currentMemberId: string | null = null;
export function setApiMemberId(id: string | null) {
  currentMemberId = id;
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (currentMemberId) headers.set("X-Member-Id", currentMemberId);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`/api${path}`, { ...init, headers, body, cache: "no-store" });
  if (!res.ok) {
    let code = "ERROR";
    let message = `요청에 실패했어요 (${res.status})`;
    try {
      const data = await res.json();
      code = data?.error?.code ?? code;
      message = data?.error?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiClientError(res.status, code, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
