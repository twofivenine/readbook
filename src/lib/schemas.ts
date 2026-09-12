import { z } from "zod";

export const groupCreateSchema = z.object({
  name: z.string().trim().min(1, "모임 이름을 입력해 주세요.").max(30, "모임 이름은 30자까지예요."),
  cycleNote: z.string().trim().max(100, "주기 설명은 100자까지예요.").optional().nullable(),
  nickname: z.string().min(1, "닉네임을 입력해 주세요."),
});

export const nicknameSchema = z.object({ nickname: z.string().min(1, "닉네임을 입력해 주세요.") });

export const meetingSchema = z.object({
  meetingAt: z.string().datetime({ offset: true, message: "날짜·시간 형식이 올바르지 않아요." }).nullable(),
});

export const labelSchema = z.object({
  label: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "표시 월은 YYYY-MM 형식이에요.").nullable(),
});

export const attendanceSchema = z.object({ status: z.enum(["yes", "no", "undecided"]) });

export const pollKindSchema = z.enum(["book", "place"]);

export const bookCandidateSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(100, "제목은 100자까지예요."),
  author: z.string().trim().min(1, "지은이를 입력해 주세요.").max(50, "지은이는 50자까지예요."),
  totalPages: z.coerce.number().int("쪽수는 정수여야 해요.").min(1, "총 쪽수는 1 이상이어야 해요.").max(9999, "총 쪽수는 9999까지예요."),
  coverKey: z.string().max(200).optional().nullable(),
});

export const placeCandidateSchema = z.object({
  name: z.string().trim().min(1, "장소명을 입력해 주세요.").max(50, "장소명은 50자까지예요."),
  address: z.string().trim().min(1, "주소를 입력해 주세요.").max(200, "주소는 200자까지예요."),
  memo: z.string().trim().max(100, "메모는 100자까지예요.").optional().nullable(),
});

export const votesSchema = z.object({ candidateIds: z.array(z.string().uuid()).max(10) });

export const progressSchema = z.union([
  z.object({ completed: z.literal(true) }),
  z.object({ currentPage: z.coerce.number().int("쪽수는 정수여야 해요.").min(0) }),
]);

export const ratingSchema = z.object({ score: z.coerce.number().int().min(1, "별점은 1~5점이에요.").max(5, "별점은 1~5점이에요.") });

export const reviewSchema = z.object({
  body: z.string().trim().min(1, "내용을 입력해 주세요.").max(100, "한줄평은 100자까지예요."),
  spoiler: z.boolean().default(false),
});
export const reviewPatchSchema = reviewSchema.partial();

export const commentSchema = z.object({
  body: z.string().trim().min(1, "내용을 입력해 주세요.").max(200, "댓글은 200자까지예요."),
  spoiler: z.boolean().default(false),
});
export const commentPatchSchema = commentSchema.partial();
