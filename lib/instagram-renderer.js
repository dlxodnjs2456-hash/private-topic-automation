import satori from "satori";
import sharp from "sharp";

const REGULAR_FONT_URL = "https://cdn.jsdelivr.net/npm/@openfonts/noto-sans-kr_korean@1.44.1/files/noto-sans-kr-korean-400.woff";
const BOLD_FONT_URL = "https://cdn.jsdelivr.net/npm/@openfonts/noto-sans-kr_korean@1.44.1/files/noto-sans-kr-korean-700.woff";

let fontCache;

async function getFonts() {
  if (!fontCache) {
    fontCache = Promise.all([
      fetch(REGULAR_FONT_URL).then(async r => {
        if (!r.ok) throw new Error(`Regular Korean font download failed: ${r.status}`);
        return r.arrayBuffer();
      }),
      fetch(BOLD_FONT_URL).then(async r => {
        if (!r.ok) throw new Error(`Bold Korean font download failed: ${r.status}`);
        return r.arrayBuffer();
      })
    ]).then(([regular, bold]) => [
      { name: "NotoSansKR", data: regular, weight: 400, style: "normal" },
      { name: "NotoSansKR", data: bold, weight: 700, style: "normal" }
    ]);
  }
  return fontCache;
}

function normalize(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function wrapText(text, maxCharsPerLine, maxLines, ellipsis = true) {
  const src = normalize(text);
  if (!src) return [];

  const words = src.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;

    if (lines.length >= maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);

  if (ellipsis && lines.length === maxLines && lines.join(" ").length < src.length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[,. ]+$/g, "") + "…";
  }

  return lines.slice(0, maxLines);
}

function oneLine(text, maxChars) {
  const src = normalize(text);
  if (src.length <= maxChars) return src;
  return src.slice(0, Math.max(1, maxChars - 1)).replace(/[,. ]+$/g, "") + "…";
}

function interpretationWrap(text) {
  const src = normalize(text || "오늘 흐름의 방향성과 다음 확인 포인트를 함께 보세요.");
  const fontSize = src.length > 115 ? 18 : src.length > 95 ? 19 : 20;
  const maxCharsPerLine = src.length > 115 ? 48 : 44;
  const lines = wrapText(src, maxCharsPerLine, 3, false);
  return { lines, fontSize };
}

export async function renderInstagramCard({ category, title, summary, bullets = [], interpretation }) {
  const fonts = await getFonts();

  const titleLines = wrapText(title, 17, 3);
  const summaryLines = wrapText(summary, 31, 4);
  const bulletItems = (Array.isArray(bullets) ? bullets : [])
    .slice(0, 3)
    .map(item => oneLine(item, 24));
  const interpretationData = interpretationWrap(interpretation);

  const tree = {
    type: "div",
    props: {
      style: {
        width: "1080px",
        height: "1080px",
        display: "flex",
        flexDirection: "column",
        padding: "58px 72px 54px",
        background: "linear-gradient(145deg,#081127 0%,#101d42 58%,#172756 100%)",
        color: "#ffffff",
        fontFamily: "NotoSansKR",
        overflow: "hidden"
      },
      children: [
        { type: "div", props: { style: { width: "150px", height: "10px", borderRadius: "999px", background: "#8193ff", marginBottom: "22px", flexShrink: 0 } } },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              padding: "9px 18px",
              borderRadius: "999px",
              border: "1px solid #40558e",
              background: "#162752",
              color: "#dce4ff",
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "28px",
              flexShrink: 0
            },
            children: oneLine(category || "시장 브리핑", 10)
          }
        },
        {
          type: "div",
          props: {
            style: {
              height: "190px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginBottom: "18px",
              overflow: "hidden",
              flexShrink: 0
            },
            children: titleLines.map((line, index) => ({
              type: "div",
              props: {
                key: `t${index}`,
                style: { fontSize: "52px", lineHeight: 1.14, fontWeight: 700, letterSpacing: "-1.4px", flexShrink: 0 },
                children: line
              }
            }))
          }
        },
        {
          type: "div",
          props: {
            style: {
              height: "166px",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              color: "#cbd5f3",
              fontSize: "25px",
              lineHeight: 1.42,
              marginBottom: "20px",
              overflow: "hidden",
              flexShrink: 0
            },
            children: summaryLines.map((line, index) => ({
              type: "div",
              props: { key: `s${index}`, style: { flexShrink: 0 }, children: line }
            }))
          }
        },
        {
          type: "div",
          props: {
            style: {
              height: "178px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "18px 22px",
              borderRadius: "22px",
              background: "rgba(12,27,60,0.72)",
              border: "1px solid #314776",
              marginBottom: "14px",
              overflow: "hidden",
              flexShrink: 0
            },
            children: [
              { type: "div", props: { style: { color: "#93a5ff", fontSize: "21px", fontWeight: 700, marginBottom: "1px", flexShrink: 0 }, children: "핵심 포인트" } },
              ...bulletItems.map((item, index) => ({
                type: "div",
                props: {
                  key: `b${index}`,
                  style: { display: "flex", gap: "11px", alignItems: "center", color: "#eef2ff", fontSize: "23px", lineHeight: 1.25, minHeight: "27px", flexShrink: 0, overflow: "hidden" },
                  children: [
                    { type: "div", props: { style: { width: "7px", height: "7px", borderRadius: "999px", background: "#8193ff", flexShrink: 0 } } },
                    { type: "div", props: { style: { whiteSpace: "nowrap", overflow: "hidden" }, children: item } }
                  ]
                }
              }))
            ]
          }
        },
        {
          type: "div",
          props: {
            style: {
              height: "126px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "13px 20px",
              borderRadius: "18px",
              background: "rgba(129,147,255,0.10)",
              border: "1px solid rgba(129,147,255,0.28)",
              color: "#d9e1ff",
              fontSize: `${interpretationData.fontSize}px`,
              lineHeight: 1.38,
              marginBottom: "14px",
              overflow: "hidden",
              flexShrink: 0
            },
            children: interpretationData.lines.map((line, index) => ({
              type: "div",
              props: { key: `i${index}`, style: { flexShrink: 0 }, children: line }
            }))
          }
        },
        { type: "div", props: { style: { flex: 1, minHeight: "6px" } } },
        {
          type: "div",
          props: {
            style: {
              height: "62px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: "1px solid #32446f",
              paddingTop: "17px",
              flexShrink: 0,
              overflow: "hidden"
            },
            children: [
              { type: "div", props: { style: { color: "#b6c1e5", fontSize: "22px", whiteSpace: "nowrap" }, children: "필요한 소식만 간편하게" } },
              { type: "div", props: { style: { color: "#91a2ff", fontSize: "30px", fontWeight: 700, whiteSpace: "nowrap" }, children: "프베톡.com" } }
            ]
          }
        }
      ]
    }
  };

  const svg = await satori(tree, { width: 1080, height: 1080, fonts });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
