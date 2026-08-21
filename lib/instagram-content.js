import OpenAI from "openai";

function stripFence(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function normalizeBullets(value) {
  const arr = Array.isArray(value) ? value : [];
  return arr.map(v => String(v || "").trim()).filter(Boolean).slice(0, 3);
}

function validate(data) {
  if (!data || typeof data !== "object") throw new Error("AI JSON parse failed");
  const required = ["category", "title", "summary", "interpretation", "caption"];
  for (const key of required) {
    if (!String(data[key] || "").trim()) throw new Error(`Missing field: ${key}`);
  }
  const bullets = normalizeBullets(data.bullets);
  if (bullets.length !== 3) throw new Error("Exactly 3 bullets are required");

  return {
    category: String(data.category).trim().slice(0, 12),
    title: String(data.title).trim().slice(0, 70),
    summary: String(data.summary).trim().slice(0, 220),
    bullets,
    interpretation: String(data.interpretation).trim().slice(0, 90),
    caption: String(data.caption).trim().slice(0, 650)
  };
}

export async function createInstagramContent() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const prompt = `
당신은 프베톡(PRIVATE TOPIC)의 인스타그램 시황 브리핑 에디터입니다.
오늘 기준 최신 공개 정보를 웹에서 확인한 뒤, 하루 2회 업로드하는 경제·기업·산업 시황 브리핑 카드 1개를 작성하세요.

핵심 목표:
- 이미지 한 장만 봐도 오늘 중요한 흐름을 이해할 수 있어야 합니다.
- 단순 후킹 포스터가 아니라 정보가 들어간 브리핑 카드여야 합니다.
- 한국의 30대 후반~60대 후반 독자가 쉽게 이해할 수 있는 존댓말을 사용하세요.
- 특정 종목 매수/매도 추천, 수익 보장, 급등 암시, 과장, 공포 조장 금지.
- 기사 원문 URL, 출처 링크, utm 링크를 출력하지 마세요.
- 단일 기사 한 건보다 오늘 흐름을 설명할 수 있는 소재를 우선하세요.
- 불확실한 사실은 사용하지 마세요.

반드시 아래 JSON만 출력하세요. 설명이나 마크다운은 금지합니다.
{
  "category": "경제 시황 또는 산업 시황 또는 시장 브리핑처럼 짧은 카테고리",
  "title": "확 보이는 2줄 제목. 각 줄 16~18자 안팎. 줄바꿈은 \\n",
  "summary": "오늘 핵심 상황을 3~4줄로 요약. 사실과 맥락을 함께 설명. 줄바꿈은 \\n",
  "bullets": [
    "핵심 포인트 1",
    "핵심 포인트 2",
    "핵심 포인트 3"
  ],
  "interpretation": "왜 중요한지 또는 무엇을 지켜봐야 하는지 1줄 해석",
  "caption": "3~4문장의 자연스러운 설명형 캡션. 마지막에 해시태그 3~5개"
}

작성 규칙:
- title은 2줄 중심, 최대 3줄.
- summary는 반드시 3~4줄. 너무 짧게 쓰지 마세요.
- bullets는 정확히 3개. 각각 8~18자 정도.
- interpretation은 1문장. 확정 전망 대신 의미와 관찰 포인트를 설명하세요.
- caption에는 링크를 절대 넣지 마세요.
- 이미지에 표시될 내용 자체가 충분히 정보성 있어야 합니다.
- '프베톡' CTA는 caption 마지막 부분에 자연스럽게 1회만 넣으세요.
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
  } catch {
    throw new Error(`Instagram AI JSON parse failed: ${text}`);
  }
  return validate(parsed);
}
