import OpenAI from "openai";

function stripFence(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function validate(data) {
  if (!data || typeof data !== "object") throw new Error("AI JSON parse failed");
  const required = ["category", "title", "summary", "caption"];
  for (const key of required) {
    if (!String(data[key] || "").trim()) throw new Error(`Missing field: ${key}`);
  }
  return {
    category: String(data.category).trim().slice(0, 12),
    title: String(data.title).trim().slice(0, 70),
    summary: String(data.summary).trim().slice(0, 70),
    caption: String(data.caption).trim().slice(0, 500)
  };
}

export async function createInstagramContent() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const prompt = `
당신은 프베톡(PRIVATE TOPIC)의 인스타그램 콘텐츠 에디터입니다.
오늘 기준 최신 공개 정보를 웹에서 확인한 뒤, 한국의 30대 후반~60대 후반 독자가 보기 쉬운 경제·기업·산업 관련 인스타그램 게시물 1개를 작성하세요.

중요 규칙:
- 존댓말 사용.
- 투자 추천, 수익 보장, 급등 암시, 과장 표현 금지.
- 광고처럼 보이지 않게 일반 경제/산업 브리핑 톤으로 작성.
- 기사 링크 원문 URL은 쓰지 마세요.
- 출처는 내부 참고만 하고 출력하지 마세요.
- 이미지용 텍스트는 짧고 읽기 쉽게 만드세요.

다음 JSON만 출력하세요. 다른 설명은 금지합니다.
{
  "category": "8자 안팎의 카테고리",
  "title": "2~3줄 제목. 각 줄은 짧게. 줄바꿈은 \\n 사용",
  "summary": "2줄 요약. 줄바꿈은 \\n 사용",
  "caption": "3~4문장의 짧은 캡션 + 마지막에 해시태그 3~5개"
}

작성 가이드:
- category 예시: 경제 브리핑 / 산업 이슈 / 시장 체크
- title은 2~3줄, 각 줄 18자 내외
- summary는 2줄, 각 줄 22자 내외
- caption 마지막엔 자연스럽게 '프베톡.com' 또는 '프베톡'을 넣어도 좋습니다.
`;

  const response = await client.responses.create({
    model,
    tools: [{ type: "web_search" }],
    input: prompt
  });

  const text = stripFence(response.output_text || "");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(`Instagram AI JSON parse failed: ${text}`);
  }
  return validate(parsed);
}
