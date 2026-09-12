import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** API 오류 코드 (TRD §5: 401 / 403 / 404 / 409 / 422 / 429) */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const errors = {
  unauthorized: () => new ApiError(401, "UNAUTHORIZED", "멤버 정보가 없거나 유효하지 않습니다."),
  forbidden: () => new ApiError(403, "FORBIDDEN", "작성자만 수정·삭제할 수 있습니다."),
  notFound: (what = "요청한 대상") => new ApiError(404, "NOT_FOUND", `${what}을(를) 찾을 수 없습니다.`),
  conflict: (code: string, message: string) => new ApiError(409, code, message),
  invalid: (message: string) => new ApiError(422, "INVALID", message),
  tooMany: () => new ApiError(429, "RATE_LIMITED", "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."),
};

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;

/** 라우트 핸들러 공통 래퍼: ApiError / ZodError → JSON 응답 */
export function route<Ctx>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status });
      }
      if (e instanceof ZodError) {
        const message = e.issues.map((i) => i.message).join(" ");
        return NextResponse.json({ error: { code: "INVALID", message } }, { status: 422 });
      }
      console.error(e);
      return NextResponse.json(
        { error: { code: "INTERNAL", message: "일시적인 오류가 발생했습니다." } },
        { status: 500 },
      );
    }
  };
}

export const json = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);
