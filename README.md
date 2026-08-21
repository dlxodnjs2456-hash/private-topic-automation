# 프베톡 자동화 센터 대시보드 v1

기존 Threads 게시/자동화 코드는 건드리지 않고 관리자 화면만 확장하기 위한 파일입니다.

## 적용 파일

1. `public/index.html`
   - 기존 메인 테스트 화면을 프베톡 자동화 센터 대시보드로 교체합니다.

2. `api/status.js`
   - 환경변수 존재 여부만 반환합니다.
   - 실제 토큰/키 값은 절대 반환하지 않습니다.

## 기존 파일 유지

아래 기존 파일은 삭제하거나 변경하지 마세요.

- `api/threads-cron.js`
- `api/threads-manual.js`
- `lib/content.js`
- `lib/threads.js`
- `vercel.json`
- `package.json`

## GitHub 적용

ZIP 압축을 푼 뒤:
- `public/index.html` → 기존 파일과 교체
- `api/status.js` → 새로 추가

Commit changes 후 Vercel이 Production으로 재배포되면 적용됩니다.

## 주의

수동 게시 버튼은 기존 `/api/threads-manual`이
- POST 요청
- `x-admin-key` 헤더
- JSON body `{ "text": "..." }`
형식을 받는다는 전제로 연결되어 있습니다.

기존 수동 게시 API가 다른 헤더/필드명을 사용한다면 해당 API 코드에 맞춰 프론트 호출 부분만 조정하면 됩니다.
