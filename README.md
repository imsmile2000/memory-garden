# 기억의 숲 · Memory Garden

반려동물을 추모하고, 강아지·고양이와 함께 산책하는 3D 정원입니다.

## 주요 기능

- 품종·이름·털 색을 선택하는 반려동물
- 정원 산책, 벤치에 앉기, 쓰다듬기·먹이 주기 등의 상호작용
- 사진과 편지를 담은 추모 공간, 꽃·촛불, 댓글
- 사용자 대화와 정원 내 방문자 표시

## 현재 실행 환경

Node.js 22.13 이상, React, Three.js, Vinext, Cloudflare D1, Drizzle을 사용합니다.

```sh
npm ci
npm run dev -- --port 5173 --hostname 127.0.0.1
```

데이터베이스 초기화와 현재 호스팅 런타임의 자세한 절차는 [런타임 문서](docs/sites-runtime.md)를 참고하세요. 로컬 데이터, 인증키, 환경 변수, 설치된 의존성 및 빌드 결과는 저장소에 포함하지 않습니다.

## 검증

```sh
npx tsc --noEmit
node --experimental-strip-types --test tests/*.test.ts
```

## Vercel 배포 상태

목표 배포 환경은 개인·비상업용 Vercel Hobby입니다. **현재 소스를 Vercel에 그대로 가져오는 것만으로는 정상 배포되지 않습니다.** Cloudflare D1 연결과 Sites 전용 로그인에 의존하므로 Vercel용 런타임, 데이터베이스 및 인증 전환이 필요합니다.

Sites의 사용자 인증 헤더는 Sites 게이트웨이를 통해서만 신뢰할 수 있습니다. 다른 호스팅에서는 해당 헤더를 로그인 인증으로 사용하면 안 됩니다. Vercel 배포 완료 및 외부 데이터베이스 연결은 아직 확인되지 않았습니다.
