## Agent & Vibe Coding 협업 지침

### 1. 문서 목적
- 에이전트 AI와 페어(바이브) 코딩할 때의 공통 규칙을 정리해 일관된 작업 흐름을 유지한다.
- 프론트엔드(Next.js, TypeScript)와 백엔드(Supabase + Drizzle ORM) 개발을 모두 고려한 실무 지침을 제공한다.

### 2. 커뮤니케이션 원칙
- **맥락 우선**: 작업 요청 시 필요한 배경, 목표, 우선순위를 먼저 공유한다. (예: `Context`, `Goal`, `Constraints`, `Definition of Done`)
- **짧은 주기 피드백**: 에이전트 출력이 길어질수록 검증 난이도가 높아지므로, 작은 단위의 결과를 확인하고 다음 단계를 결정한다.
- **명확한 스타일 가이드 공유**: UI 레퍼런스, API 명세, 데이터 모델 정책 등은 세션 초반에 링크 또는 요약으로 제공한다.
- **검증 책임 명시**: “에이전트가 제안 → 사람이 검증” 구조를 고정한다. 테스트, 린트, 수동 확인 중 어떤 검증을 할지 미리 합의한다.
- **결과 복기**: 세션 종료 전에 “무엇이 완료됐는지 / 미완료 항목 / 다음 단계”를 3줄 이내로 정리해 노션 혹은 이슈에 기록한다.

### 3. 작업 흐름
#### 세션 사전 준비
- 현재 이슈/티켓을 요약하고, 관련 도메인 지식(디자인, API 문서, 데이터 모델)을 정리한다.
- 로컬 환경이 Supabase 프로젝트와 동기화되어 있는지 확인한다. (환경변수, DB 마이그레이션 버전)
- 예상 리스크 목록을 먼저 적어두면 세션 중 회피/완화 전략 논의가 수월하다.

#### 작업 요청 포맷
```
Context: …
Goal: …
Output: (예: PR diff, 쿼리, 함수 설계)
Constraints: (성능, 보안, 스타일 가이드)
Verify: (테스트, lint, 수동 확인 등)
```

#### 진행 중 체크포인트
- 에이전트 출력은 항상 “검토 → 질문 → 확정” 순서로 다룬다. 바로 커밋하지 않는다.
- 코드 제안이 길면 섹션별로 요약을 요구하고, 복잡한 로직은 의사코드나 시퀀스 다이어그램을 먼저 요청한다.
- Supabase/Drizzle 관련 변경 사항은 스키마, 마이그레이션, 시드, 권한 정책(RLS)을 따로 나눠 점검한다.

#### 세션 종료
- 작업 로그: 주요 결정, 남은 TODO, 실험 결과를 정리해 저장소 또는 노션에 남긴다.
- 마이그레이션/환경변수 변경이 있다면 팀원 공지용 요약을 작성한다.

### 4. 개발 환경 & 도구
- **기본 스택**: Next.js (App Router), TypeScript, Tailwind(또는 CSS-in-JS), Supabase(Postgres), Drizzle ORM.
- **필수 CLI**
  - `supabase` CLI: 로컬 개발용 DB, 스토리지, 인증 시뮬레이션.
  - `npx drizzle-kit` 명령: 스키마 기반 타입 생성 및 마이그레이션 관리.
  - `pnpm` 또는 `npm` 스크립트: lint/test/build 자동화.
- **환경 변수**: `.env.local`, `.env.test`를 분리해 관리하고, Supabase의 `PROJECT_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DATABASE_URL`을 명시한다. Git에 커밋 금지.

### 5. Supabase 연동 지침
- **스키마 관리**: Supabase SQL Editor로 직접 스키마를 바꾸지 말고, Drizzle 마이그레이션을 통해 일관성 있게 관리한다.
- **프로젝트 환경**
  - 로컬 개발 시 `supabase start`로 Docker 기반 로컬 스택을 실행하고 `DATABASE_URL`을 로컬 인스턴스에 맞춘다.
  - 원격(Supabase Cloud) 환경 반영 전에는 스테이징 DB에 먼저 적용한 뒤, 콘솔에서 데이터/보안 설정을 재확인한다.
- **보안 정책**
  - RLS(Row Level Security)를 기본 활성화로 가정하고, 정책은 SQL 파일로 버전 관리한다.
  - 서비스 역할 키 사용 로직과 클라이언트(anon key) 사용 로직을 분리한다. 서버 전용 로직은 Edge Functions 또는 Next.js Route Handler에서 처리한다.

### 6. Drizzle ORM 지침
- **폴더 구조 제안**
  - `src/db/schema.ts`: 테이블, 관계, enum 정의.
  - `src/db/index.ts`: Drizzle 인스턴스 생성 및 싱글톤 관리.
  - `drizzle/`: `drizzle.config.ts`, 생성된 SQL, 마이그레이션 파일.
- **스키마 변경 프로세스**
  1. `schema.ts` 수정.
  2. `npx drizzle-kit generate`(또는 `drizzle-kit generate:pg`)로 마이그레이션 파일 생성.
  3. 로컬 DB에 `npx drizzle-kit push` 후 Supabase CLI 혹은 `drizzle-kit migrate`로 적용.
  4. 마이그레이션 파일과 변경된 타입 정의를 커밋.
- **Type-safety**
  - Zod 등 런타임 검증 라이브러리와 결합해 API 입출력을 검증한다.
  - 관계형 쿼리는 `relations` 헬퍼를 활용하고, Raw SQL은 지양한다. 불가피할 경우 SQL 템플릿 태그와 주석으로 목적을 명시한다.
- **테스트**
  - Vitest/Jest 등으로 Drizzle 쿼리를 단위 테스트할 땐 Supabase 로컬 인스턴스를 재사용하거나 `pg-mem`으로 대체한다.
  - 마이그레이션 테스트: 새 DB를 생성해 `drizzle-kit migrate`를 실행해보고 스키마가 기대와 일치하는지 확인한다.

### 7. 코드 스타일 & 품질
- ESLint/Prettier 설정을 세션 시작 시 확인하고, 에이전트에게도 같은 규칙을 전달한다.
- TypeScript는 strict 모드 기준으로 `any` 사용을 제한한다. 필요한 경우 타입 추상화 또는 DTO를 설계해 명확하게 표현한다.
- 백엔드 로직은 `async/await` 흐름에서 에러 처리를 명시적으로 한다. Supabase SDK 에러 타입을 핸들링하고, 사용자 메시지와 로깅을 분리한다.
- API/DB 변경 시에는 Swagger, JSDoc, 혹은 README 업데이트로 개발자 문서를 최신 상태로 유지한다.

### 8. 테스트 & 검증 전략
- **프론트엔드**: Storybook 또는 Playwright를 활용해 주요 UI 흐름을 자동화. 에이전트에게 테스트 생성/수정 요청 시 기대 동작을 구체적으로 설명한다.
- **백엔드**: Postman/VS Code REST Client로 엔드포인트를 검증하고, Supabase Edge Functions는 `supabase functions serve`로 로컬 테스트한다.
- **CI 파이프라인**: Lint → Unit Test → DB Migration Check 순서로 실행되는 워크플로를 설정한다. 실패 시 에이전트에게 로그를 전달하고 원인 분석을 요청한다.

### 9. 보안 및 비밀정보
- Supabase 서비스 롤 키는 서버 전용으로, Vercel Edge/Serverless 환경변수에만 저장한다.
- 로컬 `.env.local`은 1Password/Bitwarden 등 비밀 관리 도구와 연동한다.
- 사용자 데이터, JWT, 암호화 키는 테스트 코드나 로그에 남기지 않는다.

### 10. 작업 산출물 정리
- PR 템플릿: 문제 배경 → 해결 방법 → 스크린샷/쿼리 결과 → 테스트 방법 순으로 작성한다.
- 에이전트가 생성한 코드 블록은 모두 로컬에서 검증 후 커밋 메시지에 반영한다.
- Supabase/Drizzle 변경 사항은 릴리즈 노트에 “DB 변경” 섹션을 따로 만들어 공유한다.

### 11. 지속 개선
- 매 세션마다 “잘 된 점 / 개선할 점 / 실험해볼 것”을 기록해 지침서를 주기적으로 업데이트한다.
- 새로운 패턴(예: Supabase Vector, realtime) 도입 시 PoC → 검증 → 지침 반영의 순서를 따른다.
- 에이전트 프롬프트, 템플릿, 검증 체크리스트를 코드베이스와 함께 버전 관리한다.
