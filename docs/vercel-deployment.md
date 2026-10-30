# Vercel Hobby + Supabase Free 배포

## 1. Supabase

대상 프로젝트: `https://zqpneogsfzoutgwyunow.supabase.co`

1. 조직의 요금제가 **Free**인지 확인합니다. Pro 전환이나 유료 추가 기능은 선택하지 않습니다.
2. 새 프로젝트의 SQL Editor에서 `supabase/setup.sql`, `supabase/free-limits.sql` 순서로 한 번 실행합니다. 기존 테이블이 있으면 먼저 상태를 확인하세요. 초기화 SQL은 기존 데이터를 삭제하지 않습니다.
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

## 3. 인증과 메일

Supabase Authentication → URL Configuration에서 Site URL을 배포 주소로, Redirect URLs에 `https://실제주소.vercel.app/auth/confirm`을 추가합니다. 로컬 확인은 `http://127.0.0.1:5174/auth/confirm`도 별도로 허용합니다.

Email 가입과 이메일 확인을 활성화합니다. 기본 확인 메일의 ConfirmationURL을 사용합니다. PKCE 방식이므로 가입한 브라우저에서 인증 메일을 열어야 합니다.

Supabase 기본 메일 발송은 팀원 주소 등으로 제한되므로 일반 방문자 가입을 공개하려면 별도의 SMTP 발송 설정과 발송 한도를 확인해야 합니다. 이 설정이 없으면 일반 방문자의 가입 메일이 발송되지 않을 수 있습니다. 이메일 확인 기능을 끄는 방식으로 우회하지 않습니다.

## 4. 배포 후 확인

- 비로그인 상태에서 산책과 반려동물 선택
- 가입 메일 확인, 로그인·로그아웃·새로고침 후 로그인 유지
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
