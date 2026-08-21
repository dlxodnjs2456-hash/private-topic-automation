import OpenAI from "openai";

function cleanJson(text) {
  return String(text || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

export async function createInstagramContent() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing environment variable: OPENAI_API_KEY");

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const prompt = `
당신은 PRIVATE TOPIC(프베톡)의 Instagram 콘텐츠 에디터입니다.
오늘 기준 최신 공개 정보를 웹에서 확인한 뒤 한국의 30대 후반~60대 후반 독자가 이해하기 쉬운 기업·산업·경제·글로벌 이슈 1개를 선정하세요.

반드시 JSON 하나만 출력하세요.
형식:
{
  "title": "이미지에 들어갈 30자 이내 후킹 제목",
  "caption": "인스타그램 캡션"
}

작성 규칙:
- 존댓말 사용.
- 사실 중심. 과장, 공포 조장, 확정 전망 금지.
- 특정 금융상품 매수/매도 추천, 수익 보장, 급등 암시 금지.
- title은 광고 문구보다 일반 정보 게시물처럼 자연스럽게.
- caption은 3~5개 짧은 문단, 500자 이내.
- 마지막에는 자연스럽게 '관심 있는 소식을 한곳에서 보고 싶으시다면 프베톡.com에서 확인해보세요.'를 넣으세요.
- 해시태그는 3개 이하만 사용하고 #경제 #기업 #산업 중 내용에 맞게 선택하세요.
- 출처 URL은 넣지 마세요.
- 불확실한 내용은 소재로 선택하지 마세요.`;

  const response = await client.responses.create({
    model,
    tools: [{ type: "web_search" }],
    input: prompt
  });

  const raw = cleanJson(response.output_text);
  const parsed = JSON.parse(raw);
  const title = String(parsed.title || "").trim().slice(0, 40);
  const caption = String(parsed.caption || "").trim().slice(0, 900);

  if (!title || !caption) throw new Error("Instagram content generation returned incomplete JSON");
  return { title, caption };
}
