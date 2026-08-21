import OpenAI from "openai";

function stripFence(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function stripUrls(text) {
  return String(text || "")
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/gi, "$1")
    .replace(/\([^)]*https?:\/\/[^)]*\)/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:www\.)?[a-z0-9.-]+\.(?:com|co\.kr|kr|net|org)\b\/?\S*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanMultiline(text, maxLength) {
  return String(text || "")
    .split(/\n+/)
    .map(line => stripUrls(line).trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, maxLength);
}

function normalizeBullets(value) {
  const arr = Array.isArray(value) ? value : [];
  return arr
    .map(v => stripUrls(v).replace(/^[-•·]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function normalizeSources(value) {
  const arr = Array.isArray(value) ? value : [];
  const result = [];
  for (const item of arr) {
    const source = stripUrls(item)
      .replace(/^(출처|source)\s*[:：-]?\s*/i, "")
      .replace(/[()\[\]]/g, "")
      .trim()
      .slice(0, 24);
    if (source && !result.includes(source)) result.push(source);
    if (result.length >= 3) break;
  }
  return result;
}

function buildCaption({ title, summary, bullets, interpretation, sources }) {
  const titleLine = title.replace(/\n+/g, " ").trim();
  const summaryText = summary.replace(/\n+/g, " ").trim();

  const parts = [
    `📌 ${titleLine}`,
    "",
    summaryText,
    "",
    "오늘 체크할 포인트"
  ];

  bullets.forEach(item => parts.push(`• ${item}`));

  if (interpretation) {
    parts.push("", `🔎 ${interpretation}`);
  }

  if (sources.length) {
    parts.push("", `출처: ${sources.join(" · ")}`);
  }

  parts.push(
    "",
    "필요한 경제·산업 흐름만 간편하게 확인하고 싶으시다면 프베톡에서 확인해보세요.",
    "",
    "#경제브리핑 #시장체크 #산업이슈 #프베톡"
  );

  return parts.join("\n").replace(/\n{3,}/g, "\n\n").slice(0, 1000);
}

function validate(data) {
  if (!data || typeof data !== "object") throw new Error("AI JSON parse failed");

  const category = stripUrls(data.category).trim().slice(0, 12);
  const title = cleanMultiline(data.title, 70);
  const summary = cleanMultiline(data.summary, 260);
  const bullets = normalizeBullets(data.bullets);
  const interpretation = cleanMultiline(data.interpretation, 110);
  const sources = normalizeSources(data.sources);

  if (!category) throw new Error("Missing field: category");
  if (!title) throw new Error("Missing field: title");
  if (!summary) throw new Error("Missing field: summary");
  if (!interpretation) throw new Error("Missing field: interpretation");
  if (bullets.length !== 3) throw new Error("Exactly 3 bullets are required");

  const caption = buildCaption({
    title,
    summary,
    bullets,
    interpretation,
    sources
  });

  return {
    category,
    title,
    summary,
    bullets,
    interpretation,
    sources,
    caption
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

목표:
- 이미지 한 장만 봐도 오늘 중요한 흐름을 이해할 수 있어야 합니다.
- 단순 후킹 포스터가 아니라 실제 정보가 들어간 브리핑 카드여야 합니다.
- 한국의 30대 후반~60대 후반 독자가 쉽게 읽을 수 있는 자연스러운 존댓말을 사용하세요.
- 특정 종목 매수/매도 추천, 수익 보장, 급등 암시, 과장, 공포 조장 금지.
- 한 기사만 옮겨 적지 말고 가능한 경우 2개 이상의 신뢰할 수 있는 공개 출처를 확인해 흐름을 정리하세요.

가장 중요한 출력 규칙:
- category, title, summary, bullets, interpretation 안에는 URL, 도메인, 기사 링크, 괄호형 링크를 절대 넣지 마세요.
- 이미지용 필드에는 언론사 이름도 굳이 넣지 마세요. 내용 자체만 깔끔하게 작성하세요.
- 출처는 sources 배열에 언론사명 또는 기관명만 넣으세요. URL은 sources에도 금지합니다.
- caption은 생성하지 마세요. 시스템이 이미지 내용과 sources를 이용해 보기 좋게 자동 구성합니다.

반드시 아래 JSON만 출력하세요. 설명이나 마크다운은 금지합니다.
{
  "category": "시장 브리핑",
  "title": "확 보이는 2줄 제목. 줄바꿈은 \\n 사용",
  "summary": "오늘 핵심 상황을 3~4줄로 요약. 수치나 배경이 있으면 자연스럽게 포함. 줄바꿈은 \\n 사용",
  "bullets": [
    "핵심 포인트 1",
    "핵심 포인트 2",
    "핵심 포인트 3"
  ],
  "interpretation": "왜 중요한지 또는 앞으로 무엇을 확인해야 하는지 1~2문장",
  "sources": ["언론사 또는 기관명 1", "언론사 또는 기관명 2"]
}

작성 품질 규칙:
- title은 시선을 끌되 과장하지 말고, 오늘의 핵심 흐름이 바로 보이게 작성하세요.
- summary는 3~4줄로 충분한 정보를 담되 기사 문장을 그대로 복사하지 마세요.
- bullets는 짧지만 구체적으로 작성하세요. 가능하면 수급, 정책, 실적, 환율, 금리, 업황 같은 실제 핵심 요인을 담으세요.
- interpretation은 확정적 전망이 아니라 현재 흐름의 의미와 다음 관찰 포인트를 설명하세요.
- sources는 2~3개 이내로 작성하세요.
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
