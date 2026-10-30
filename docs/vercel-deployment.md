# Vercel Hobby + Supabase Free 배포

## 1. Supabase

대상 프로젝트: `https://zqpneogsfzoutgwyunow.supabase.co`

1. 조직의 요금제가 **Free**인지 확인합니다. Pro 전환이나 유료 추가 기능은 선택하지 않습니다.
2. 새 프로젝트의 SQL Editor에서 `supabase/setup.sql`, `supabase/free-limits.sql`, `supabase/realtime-budget.sql` 순서로 한 번 실행합니다. 기존 테이블이 있으면 먼저 상태를 확인하세요. 초기화 SQL은 기존 데이터를 삭제하지 않습니다.
3. 프로젝트 URL과 Publishable key를 확인합니다. 서비스 역할 키는 앱에 필요하지 않습니다.
4. Connect → Transaction pooler의 PostgreSQL 연결 문자열을 준비합니다. 비밀번호의 특수문자는 URL 인코딩합니다.
5. `garden` 스키마는 Supabase Data API에 공개하지 않습니다. 서버의 데이터베이스 연결만 접근하며 클라이언트는 인증키로 테이블을 읽거나 수정할 수 없습니다.

## 2. Vercel

1. 개인·비상업용 **Hobby** 계정에서 `imsmile2000/memory-garden`을 가져옵니다.
2. Framework Preset: Next.js / Root Directory: `./` / Build: `npm run build` / Output: 기본값 / Node.js: 22.x.
3. 환경 변수를 설정합니다. 실제 비밀값은 GitHub, 문서 또는 채팅에 기록하지 않습니다.

| 이름 | 값 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `DATABASE_URL` | Transaction pooler PostgreSQL 연결 문자열 — 비밀값 |

4. Deploy 후 생성된 `.vercel.app` 주소를 확인합니다. GitHub main의 새 커밋은 자동 배포될 수 있습니다.

## 3. 방문자 구분

로그인은 사용하지 않습니다. 서버가 서명한 HttpOnly 쿠키로 방문자와 글 소유권을 구분합니다. Supabase Auth, 이메일·SMTP 및 인증 리디렉션 설정은 필요하지 않습니다. `GARDEN_SESSION_SECRET`을 설정하면 방문자 서명키로 사용하며, 없으면 서버 전용 `DATABASE_URL`을 사용합니다. 서명키 변경 시 기존 방문자 쿠키는 무효가 됩니다.

## 4. 배포 후 확인

- 비로그인 상태에서 산책과 반려동물 선택
- 로그인 없이 저장·댓글·대화 사용, 새로고침 후 내 글 관리 유지
- 사진이 포함된 추모글 저장·조회, 댓글·꽃·촛불
- 다른 계정이 타인의 글이나 댓글을 삭제할 수 없는지 확인
- 사용자 대화, 다른 방문자 표시
- Supabase Usage의 데이터베이스·Egress·Auth 사용량 확인

소스 검증과 공개 서비스 검증은 별개입니다. 프로젝트 연결 전에는 로그인과 저장 완료를 주장하지 않습니다.

## 비용

Free에서는 사용량 초과에 따른 과금 대신 서비스가 제한될 수 있습니다. 앱의 작은 저장 한도와 느린 갱신 주기는 위험을 줄이지만 프로젝트 전체의 사용량을 보장하지 않습니다. README의 제한을 적용한 뒤에도 대시보드 사용량 확인이 필요합니다.

- https://supabase.com/docs/guides/platform/cost-control
- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://vercel.com/docs/plans/hobby

실시간 연결은 기존 Supabase Publishable key와 Realtime 서비스를 사용합니다. 두 브라우저에서 함께 접속해 `실시간 연결됨` 상태, 즉시 입장·퇴장, 이동 애니메이션을 확인하세요.
