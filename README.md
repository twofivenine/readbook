# 독서모임 — 책읽는 밤 (v1.1)

카톡방에 흩어진 독서모임 운영을 한 곳에 모으는 도구. PRD v1.1 / TRD v1.1 기준 구현.

- **모임 하나**: 이름은 "독서모임" 고정. 배포 1개 = 모임 1개
- **로그인·회원 없음**: 링크를 아는 사람 누구나 열람·쓰기. 브라우저 최초 방문 시 무작위 식별값(clientId)을 `localStorage["bookclub"]`에 만들고, 이걸로 "이미 체크했는지 / 내 글인지"만 판별
- **이름 칸**: 참석·별점·한줄평에만 이름을 직접 적음(비우면 "익명"). 마지막 이름은 기억해 미리 채움
- **체크 투표**: 후보마다 체크 버튼, 브라우저당 후보별 1회(취소 가능), 여러 후보 체크 가능. 누가 눌렀는지는 기록하지 않음. 동점은 무작위, 누구나 마감·재투표
- **2탭**: 홈(지금 할 일 / 다음 모임 / 이달의 책 / 한줄평 / 다음 책 투표) · 서재(지난 책 + 상세)
- 제외: 진도·완독, 댓글, 통계, 멤버 탭, 초대 링크, 알림, 다크 모드, 외부 도서 API

## 기술 스택

Next.js (App Router) + TypeScript + TanStack Query · PostgreSQL + Prisma · Tailwind CSS · 표지는 sharp로 600×900 WebP 변환 후 S3 호환 스토리지 또는 로컬 파일(개발용).

## 시작하기

```bash
cp .env.example .env        # DATABASE_URL 설정
npm install
npm run db:migrate          # 스키마 적용
npm run dev                 # http://localhost:3000
```

첫 실행은 빈 상태입니다. 홈에서 일정을 등록하고, "다음 책 투표"에서 후보를 올려 마감하면 이달의 책이 정해집니다.

## 구조

```
prisma/schema.prisma      TRD v1.1 §4 (rounds · books · places · polls · poll_candidates · vote_checks · attendances · ratings · reviews)
src/app/api/**            TRD v1.1 §5 API — 쓰기는 X-Client-Id 헤더 필수(UUID 형식만 검사)
src/server/**             회차(§3), 체크 투표·마감·재투표(§6.1~6.2), 지금 할 일(§6.3), 별점·한줄평, 서재
src/lib/**                Prisma, 오류·레이트 리밋, clientId 저장소(clientStore), 시간(KST), 표지 저장소, zod 스키마
src/components/**         UI, 체크 버튼, 스포일러, 홈 섹션(다음 모임 · 이달의 책 · 한줄평 · 투표 요약)
src/app/                  / 홈 · /polls/{book|place} 투표 상세 · /polls/book/new 책 후보 등록 · /library 서재 · /library/{roundId} 지난 책
```

### 회차(Round)

- **현재 회차** = 책이 확정된 가장 최근 회차. 다음 모임·이달의 책·한줄평·장소 투표·참석이 여기 붙음
- **다음 회차** = 책 후보 투표가 진행되는 회차. 마감·확정되면 현재가 되고 이전 회차는 서재로 내려감
- 책이 아직 없는 초기 상태에서는 1회차가 일정·장소의 그릇

## Vercel 배포

1. Environment Variables에 `DATABASE_URL`(Supabase / Neon 등 Postgres)을 넣습니다. 표지 저장은 `COVER_STORAGE_DRIVER=s3` + `S3_*` 값을 함께 넣습니다(서버리스에서는 `local` 드라이버가 재배포 시 파일을 잃습니다).
2. 빌드는 `prisma generate && next build`. Vercel이 `node_modules`를 캐시하므로 이 단계가 없으면 API가 500으로 실패합니다.
3. 테이블은 한 번만 만들면 됩니다. 두 가지 방법 중 하나를 고르세요.
   - **Supabase SQL Editor**(로컬 환경 불필요): `prisma/supabase_setup.sql` 내용을 붙여 넣고 Run. 마이그레이션 이력까지 기록하므로 이후 `npm run db:migrate`와도 호환됩니다.
   - **로컬에서**: `.env`의 `DATABASE_URL`을 Supabase **직접 연결 URL(포트 5432)** 로 두고 `npm run db:migrate`.

   v1.0 스키마가 이미 적용된 DB라면 기존 테이블을 모두 정리하고 새로 만듭니다(보존할 데이터 없음 전제).
4. DB에 못 닿으면 API가 503 `DB_UNAVAILABLE`, 스키마 미적용이면 503 `DB_NOT_MIGRATED`를 돌려줍니다.

## 환경 변수

`.env.example` 참고. `RATE_LIMIT_DISABLED=1`은 개발·테스트에서만(기본 쓰기 60회/분, 표지 10회/시간).

## 검증

- `npm run lint`, `npx tsc --noEmit`, `npm run build`
- 로컬 Postgres에서 API 시나리오(일정 → 후보 10개 상한 → 체크·중복 409·취소 → 동점 무작위 마감 → 재투표 → 장소 확정 → 이름 참석·삭제 → 별점 수정·삭제 → 한줄평 본인만 수정 → 서재·상세 → 표지 업로드·삭제) 통과
