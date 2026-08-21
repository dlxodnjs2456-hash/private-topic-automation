PRIVATE TOPIC Threads 자동화 1차본

필수 Vercel 환경변수
1) THREADS_ACCESS_TOKEN = Meta에서 발급한 Threads 사용자 Access Token
2) THREADS_USER_ID = Meta에서 확인한 Threads User ID
3) OPENAI_API_KEY = OpenAI API Key
4) OPENAI_MODEL = gpt-5-mini (선택)
5) CRON_SECRET = 본인이 만든 긴 임의 문자열
6) AUTOMATION_ADMIN_KEY = 본인이 만든 긴 임의 문자열

스케줄
- vercel.json: 30 9,23 * * * (UTC)
- 한국시간 기준 매일 08:30 / 18:30
  * 23:30 UTC = 다음날 08:30 KST
  * 09:30 UTC = 18:30 KST

테스트 순서
1. 프로젝트를 Vercel에 배포
2. Vercel Project Settings > Environment Variables에 위 6개 저장
3. Production Redeploy
4. 사이트 홈을 열어 AUTOMATION_ADMIN_KEY 입력
5. 테스트 본문 확인 후 'Threads에 테스트 게시' 클릭
6. 실제 Threads 계정에 글이 올라오는지 확인

보안
- THREADS_ACCESS_TOKEN, OPENAI_API_KEY는 절대 HTML/소스코드에 직접 넣지 마세요.
- 토큰은 채팅에도 붙여넣지 마세요.
