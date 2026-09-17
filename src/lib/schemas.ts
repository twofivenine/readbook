import { z } from "zod";

const name = z.string().max(40).optional().nullable();

export const meetingSchema = z.object({
  meetingAt: z.string().datetime({ offset: true, message: "날짜·시간 형식이 올바르지 않아요." }).nullable(),
});
export const labelSchema = z.object({ label: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "표시 월은 YYYY-MM 형식이에요.").nullable() });
export const attendanceSchema = z.object({ name, status: z.enum(["yes", "no", "undecided"]) });
export const pollKindSchema = z.enum(["book", "place"]);

export const bookInputSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(100, "제목은 100자까지예요."),
  author: z.string().trim().min(1, "지은이를 입력해 주세요.").max(50, "지은이는 50자까지예요."),
  totalPages: z.coerce.number().int("쪽수는 정수여야 해요.").min(1, "총 쪽수는 1 이상이어야 해요.").max(9999, "총 쪽수는 9999까지예요."),
  coverKey: z.string().max(200).optional().nullable(),
});
export const bookPatchSchema = bookInputSchema.partial();

export const placeInputSchema = z.object({
  name: z.string().trim().min(1, "장소명을 입력해 주세요.").max(50, "장소명은 50자까지예요."),
  address: z.string().trim().min(1, "주소를 입력해 주세요.").max(200, "주소는 200자까지예요."),
  memo: z.string().trim().max(100, "메모는 100자까지예요.").optional().nullable(),
});

export const ratingSchema = z.object({ name, score: z.coerce.number().int().min(1, "별점은 1~5점이에요.").max(5, "별점은 1~5점이에요.") });

export const reviewSchema = z.object({
  name,
  body: z.string().trim().min(1, "내용을 입력해 주세요.").max(100, "한줄평은 100자까지예요."),
  spoiler: z.boolean().default(false),
});
export const reviewPatchSchema = z.object({
  name,
  body: z.string().trim().min(1, "내용을 입력해 주세요.").max(100, "한줄평은 100자까지예요.").optional(),
  spoiler: z.boolean().optional(),
});
