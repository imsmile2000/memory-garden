# 기억의 숲 · Memory Garden

반려동물을 추모하고, 강아지·고양이와 함께 산책하는 3D 정원입니다.

- 품종·이름·털 색 선택과 산책, 벤치에 앉기, 반려동물 상호작용
- 사진·편지·꽃·촛불·댓글로 남기는 기억
- 로그인 없이 사용자 대화와 정원 방문자 표시

## 실행

Node.js 22.13 이상을 사용합니다. Next.js, React, Three.js, PostgreSQL/Drizzle, 브라우저 방문자 쿠키로 구성됩니다.

```sh
npm ci
cp .env.example .env.local
# .env.local에 본인 프로젝트 연결 정보를 설정한 뒤 실행
npm run dev
```

## 배포

[Vercel·Supabase 설정 안내](docs/vercel-deployment.md)를 따라 무료 프로젝트와 환경 변수를 연결하세요. 데이터베이스에는 `supabase/setup.sql`, `supabase/free-limits.sql`을 차례로 적용합니다. Vercel에서 이 저장소를 Next.js 프로젝트로 가져오고 Hobby 요금제를 유지하세요.

공개 주소: https://memory-garden-iota.vercel.app. Supabase 테이블과 저장 제한이 적용되어 있습니다. 로컬 미리보기의 테스트 기록은 업로드하지 않습니다. 비밀번호·환경 변수·로컬 데이터는 Git에서 제외합니다.

## 무료 운영 제한

| 항목 | 앱 제한 |
| --- | --- |
| 사진 | 긴 변 640px, JPEG 약 75KB 이하 / 저장 문자열 100KB 이하 |
| 추모글 | 정원 전체 100개, 사용자당 10개 |
| 댓글 | 전체 2,000개, 추모글당 100개 |
| 꽃·촛불 기록 | 전체 10,000개 |
| 저장된 반려동물 | 500명 |
| 방문자 위치 | 최대 100명, 오래된 위치 정리 |
| 대화 | 최근 500개, 새 대화 저장 시 7일 이전 대화 정리 |
| 자동 갱신 | 30초 간격, 숨긴 탭에서는 중지 |
| 데이터베이스 | 전체 크기 400MiB 초과 시 앱의 추가 저장·수정 중지 |

추모글과 댓글은 자동 삭제하지 않습니다. SQL 제한은 동시 요청에도 적용되며, 적용 전에는 운영 제한이 활성화되지 않습니다. 사진은 별도 Storage 버킷 대신 작은 JPEG 문자열로 데이터베이스에 저장됩니다. 100개 사진의 최대 저장 문자열 합은 약 10MB입니다.

이 제한은 Supabase 전체 사용량에 대한 보장이 아닙니다. 인증 데이터, 로그, 다른 앱, 데이터베이스 여유 공간 및 트래픽은 별도로 증가할 수 있습니다. Supabase Usage를 확인하고 Free를 유지하세요. 방문자가 많아지면 한도 내에서도 서비스가 제한될 수 있습니다.

## 검증

```sh
npm test
npx tsc --noEmit
npm run build
npm start -- --port 5174
# 별도 터미널에서 인증 우회 차단 확인
node tests/vercel-http.mjs
```

`tests/api-integration.mjs`, `tests/history-integration.py`, `drizzle/`, `docs/sites-runtime.md`는 이전 Sites/D1 환경의 기록입니다. 새 Supabase 환경에 실행하지 마세요. 현재 PostgreSQL 설정은 `db/`, `drizzle-postgres/`, `supabase/`를 사용합니다.

로그인 기능은 없습니다. 서명된 방문자 쿠키로 이 브라우저에서 남긴 글을 구분합니다. 쿠키를 지우거나 다른 브라우저를 사용하면 이전 글의 소유자로 인식되지 않습니다.
