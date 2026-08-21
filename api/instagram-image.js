import sharp from "sharp";

function esc(v = "") {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(text, max = 14) {
  const words = String(text || "").trim().split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

export default async function handler(req, res) {
  try {
    const title = String(req.query?.title || "오늘 꼭 볼 경제·산업 소식").trim();
    const kicker = String(req.query?.kicker || "PRIVATE TOPIC").trim();
    const lines = wrap(title, 15);

    const tspans = lines.map((line, i) =>
      `<tspan x="110" dy="${i === 0 ? 0 : 92}">${esc(line)}</tspan>`
    ).join("");

    const svg = `
      <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#0B1020"/>
            <stop offset="1" stop-color="#17213A"/>
          </linearGradient>
        </defs>
        <rect width="1080" height="1080" rx="0" fill="url(#bg)"/>
        <rect x="76" y="76" width="928" height="928" rx="48" fill="#121A2F" stroke="#2A3A63" stroke-width="3"/>
        <rect x="110" y="126" width="270" height="10" rx="5" fill="#7D8CFF"/>
        <text x="110" y="205" font-family="sans-serif" font-size="34" font-weight="700" fill="#9FAACC">${esc(kicker)}</text>
        <text x="110" y="355" font-family="sans-serif" font-size="72" font-weight="800" fill="#F6F8FF">${tspans}</text>
        <text x="110" y="860" font-family="sans-serif" font-size="34" fill="#B8C2E0">기업 · 산업 · 경제 · 글로벌 이슈</text>
        <text x="110" y="935" font-family="sans-serif" font-size="38" font-weight="700" fill="#7D8CFF">프베톡.com</text>
      </svg>`;

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).send(png);
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
