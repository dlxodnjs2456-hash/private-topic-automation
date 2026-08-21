import OpenAI from "openai";

const blockedPatterns = [
  /수익\s*보장/i,
  /원금\s*보장/i,
  /확정\s*수익/i,
  /급등주/i,
  /매수\s*(추천|신호)/i,
  /매도\s*(추천|신호)/i,
  /무조건\s*(오른|상승|수익)/i,
  /몇\s*배\s*(수익|상승)/i,
  /대박\s*종목/i
];

function validate(text) {
  const t = String(text || "").trim();
  if (!t) return "empty";
  if (t.length > 480) return "too_long";
  const hit = blockedPatterns.find(re => re.test(t));
  return hit ? `blocked:${hit}` : null;
}

export async function createThreadsPost() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing environment variable: OPENAI_API_KEY");
  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const basePrompt = `
당신은 PRIVATE TOPIC(프베톡)의 Threads 콘텐츠 에디터입니다.
오늘 기준 최신 공개 정보를 웹에서 확인한 뒤, 한국의 30대 후반~60대 후반 독자가 이해하기 쉬운 경제·기업·산업 관련 게시물 1개를 작성하세요.

목표:
- 광고처럼 시작하지 말고, 일반 Threads 게시물처럼 첫 문장에서 호기심을 끌 것.
- 존댓말 사용.
- 사실 중심이며 과장, 공포 조장, 확정적 전망을 하지 말 것.
- 특정 금융상품 매수/매도 추천, 수익 보장, 급등 암시, 투자 자문처럼 보이는 표현 금지.
- 단순 경제·기업·산업 정보와 맥락 설명에 집중.
- 2~4개의 짧은 문단, 전체 420자 이내.
- 마지막 한 줄은 자연스럽게 다음 CTA 중 하나를 사용:
  1) 필요한 소식만 편하게 확인하고 싶으시다면 검색창에 프베톡.com을 검색해보세요.
  2) 관심 있는 소식을 한곳에서 보고 싶으시다면 프베톡.com을 검색해보세요.
  3) 복잡한 소식을 조금 더 간편하게 보고 싶으시다면 프베톡.com을 확인해보세요.
- 해시태그는 사용하지 마세요.
- 출처 URL은 넣지 마세요. 중요한 사실이 불확실하면 그 소재를 선택하지 마세요.

게시물 본문만 출력하세요.`;

  let last = "";
  for (let i = 0; i < 3; i++) {
    const response = await client.responses.create({
      model,
      tools: [{ type: "web_search" }],
      input: i === 0 ? basePrompt : `${basePrompt}\n\n이전 결과가 자동 정책검사에서 실패했습니다. 더 중립적이고 안전한 표현으로 새 주제를 작성하세요.`
    });
    last = (response.output_text || "").trim();
    const err = validate(last);
    if (!err) return last;
  }
  throw new Error(`Generated content failed policy checks after retries. Last content: ${last}`);
}
