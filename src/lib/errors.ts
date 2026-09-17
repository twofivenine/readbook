import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/** API 오류 (TRD v1.1 §5: 400 / 403 / 404 / 409 / 422 / 429) */
export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

export const errors = {
  badRequest: (message: string) => new ApiError(400, "BAD_REQUEST", message),
  forbidden: () => new ApiError(403, "FORBIDDEN", "이 브라우저에서 쓴 글만 수정·삭제할 수 있어요."),
  notFound: (what = "요청한 대상") => new ApiError(404, "NOT_FOUND", `${what}을(를) 찾을 수 없습니다.`),
  conflict: (code: string, message: string) => new ApiError(409, code, message),
  invalid: (message: string) => new ApiError(422, "INVALID", message),
  tooMany: () => new ApiError(429, "RATE_LIMITED", "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."),
};

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;

export function route<Ctx>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status });
      }
      if (e instanceof ZodError) {
        return NextResponse.json({ error: { code: "INVALID", message: e.issues.map((i) => i.message).join(" ") } }, { status: 422 });
      }
      console.error(e);
      if (e instanceof Prisma.PrismaClientInitializationError) {
        // 원인 파악용: Prisma 오류 코드(P1000 인증 실패, P1001 서버 도달 불가, P1012 URL 비어 있음 등)와 첫 줄
        const lines = e.message.split("\n").map((l) => l.trim()).filter(Boolean);
        const detail = lines.find((l) => /P\d{4}|reach|Authentication|denied|empty|timed out|refused/i.test(l)) ?? lines[lines.length - 1] ?? "";
        return NextResponse.json(
          { error: { code: "DB_UNAVAILABLE", message: `데이터베이스에 연결할 수 없습니다. DATABASE_URL 설정을 확인해 주세요. (${detail})` } },
          { status: 503 },
        );
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2021" || e.code === "P2022")) {
        return NextResponse.json(
          { error: { code: "DB_NOT_MIGRATED", message: "데이터베이스 스키마가 적용되지 않았습니다. `npm run db:migrate`를 실행해 주세요." } },
          { status: 503 },
        );
      }
      const message = process.env.NODE_ENV === "production" ? "일시적인 오류가 발생했습니다." : (e as Error).message;
      return NextResponse.json({ error: { code: "INTERNAL", message } }, { status: 500 });
    }
  };
}

export const json = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);
export const noContent = () => new Response(null, { status: 204 });
