# 책읽는 밤 — 독서모임 앱

카톡방에 흩어진 독서모임 운영을 한 곳에 모으는 도구. PRD v1.0 / TRD v1.0 / 와이어프레임 v2를 기준으로 구현했습니다.

- 로그인 없음: 닉네임 + 브라우저 저장(`localStorage`의 `bookclub:identity`)이 곧 신원
- 모임장 없음: 후보 등록·삭제, 마감·재투표, 일정 등록을 멤버 누구나
- 투표: 복수 선택(상한 = 현재 후보 수), 집계·투표자 항상 공개, 동점은 무작위 선정
- 3탭: 홈(지금 할 일 / 다음 모임 / 이달의 책 / 한줄평 / 다음 책 투표) · 서재(지난 책 + 통계) · 멤버
- 알림·참석률 집계·다크 모드·외부 도서 API 없음

## 기술 스택

| 계층 | 선택 |
|---|---|
| 프론트/API | Next.js (App Router) + TypeScript + TanStack Query |
| DB | PostgreSQL + Prisma |
| 스타일 | Tailwind CSS (라이트 테마 단일, 모바일 우선, `md` 1개 브레이크포인트) |
| 표지 저장소 | S3 호환 스토리지(Supabase Storage / R2) 또는 로컬 파일(개발용), sharp로 600×900 WebP 변환 |

## 시작하기

```bash
cp .env.example .env        # DATABASE_URL 등 설정
npm install
npx prisma migrate dev      # 스키마 적용 (닉네임 대소문자 무시 UNIQUE, 별점 CHECK 포함)
npm run dev
```

`/`에서 모임을 만들면 `/g/{초대토큰}`으로 이동합니다. 링크만 공유하면 누구나 참여합니다.

## 구조

```
prisma/schema.prisma        TRD §4 스키마 (groups · members · rounds · books · places · polls · poll_candidates · votes · attendances · progresses · ratings · reviews · comments)
src/app/api/**              TRD §5 API (초대 토큰으로 모임 식별, 쓰기는 X-Member-Id 헤더 필수)
src/server/**               핵심 로직 — 회차(§3), 투표 엔진(§6.1~6.2), 진도(§6.3), 지금 할 일(§6.4), 통계(§6.5)
src/lib/**                  Prisma 클라이언트, 인증·레이트 리밋, 표지 저장소, 시간(KST), 클라이언트 API·신원·훅
src/components/**           UI (와이어프레임 v2 토큰), 진입 모달(쓰기 액션 게이트), 홈 섹션
src/app/g/[token]/**        홈 · 서재 · 지난 책 상세 · 멤버 · 투표 상세 · 책 후보 등록 화면
```

### 회차(Round) 개념 (TRD §3)

- **현재 회차** = 책이 확정된 회차 중 가장 최근. 홈의 "다음 모임 / 이달의 책 / 한줄평"이 여기에 붙습니다.
- **다음 회차** = 그 다음 순번. "다음 책 투표"가 여기에 붙고, 마감·확정되는 순간 현재 회차가 됩니다(별도 "월 넘기기" 없음).
- 아직 책이 한 번도 확정되지 않은 신규 모임에서는 1회차가 일정·장소의 그릇이 됩니다.

## Vercel 배포

1. Vercel 프로젝트 **Environment Variables**에 `DATABASE_URL`(Supabase / Neon 등 Postgres 연결 문자열)을 넣습니다. 표지를 S3 호환 스토리지에 두려면 `COVER_STORAGE_DRIVER=s3`와 `S3_*` 값도 함께 넣습니다(서버리스에서는 `local` 드라이버가 재배포 시 파일을 잃습니다).
2. 빌드 스크립트가 `prisma generate && prisma migrate deploy && next build`이므로, 배포마다 Prisma Client 재생성과 마이그레이션 적용이 자동으로 됩니다. Vercel은 `node_modules`를 캐시하기 때문에 `prisma generate`가 빌드에 없으면 API가 500으로 실패합니다.
3. `DATABASE_URL`이 없으면 빌드 단계에서 `prisma migrate deploy`가 실패하며 원인이 로그에 바로 드러납니다. 런타임에 DB에 닿지 못하면 API는 503 `DB_UNAVAILABLE`, 마이그레이션이 없으면 503 `DB_NOT_MIGRATED`를 돌려줍니다.

## 환경 변수

`.env.example` 참고. 표지 저장소는 `COVER_STORAGE_DRIVER=local`(기본, `./data/covers`에 저장 후 `/api/covers/…`로 서빙) 또는 `s3`.
`RATE_LIMIT_DISABLED=1`은 개발·테스트에서만 사용합니다(기본 쓰기 60회/분, 표지 10회/시간, 모임 생성 5회/시간).

## 검증

- `npm run lint`, `npx tsc --noEmit`, `npm run build`
- 로컬 Postgres 위에서 API 시나리오(모임 생성 → 8명 참여·정원 초과 → 후보 10개 상한 → 복수 투표·동점 무작위 마감 → 재투표 → 장소 확정 → 참석 → 진도·완독·별점 → 한줄평·댓글 본인 권한 → 서재·통계 → 표지 업로드·삭제 → 링크 재발급) 통과
