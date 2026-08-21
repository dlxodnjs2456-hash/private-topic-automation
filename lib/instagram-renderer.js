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

function splitLines(text, max = 4) {
  return String(text || "").split(/\n+/).map(v => v.trim()).filter(Boolean).slice(0, max);
}

export async function renderInstagramCard({ category, title, summary, bullets = [], interpretation }) {
  const fonts = await getFonts();
  const titleLines = splitLines(title, 3);
  const summaryLines = splitLines(summary, 4);
  const bulletItems = (Array.isArray(bullets) ? bullets : []).slice(0, 3);

  const tree = {
    type: "div",
    props: {
      style: {
        width: "1080px",
        height: "1080px",
        display: "flex",
        flexDirection: "column",
        padding: "64px 72px",
        background: "linear-gradient(145deg,#081127 0%,#101d42 58%,#172756 100%)",
        color: "#ffffff",
        fontFamily: "NotoSansKR"
      },
      children: [
        { type: "div", props: { style: { width: "150px", height: "10px", borderRadius: "999px", background: "#8193ff", marginBottom: "26px" } } },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              padding: "10px 20px",
              borderRadius: "999px",
              border: "1px solid #40558e",
              background: "#162752",
              color: "#dce4ff",
              fontSize: "26px",
              fontWeight: 700,
              marginBottom: "34px"
            },
            children: String(category || "시장 브리핑")
          }
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "28px" },
            children: titleLines.map((line, index) => ({
              type: "div",
              props: {
                key: `t${index}`,
                style: { fontSize: "56px", lineHeight: 1.16, fontWeight: 700, letterSpacing: "-1.5px" },
                children: line
              }
            }))
          }
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              color: "#cbd5f3",
              fontSize: "27px",
              lineHeight: 1.45,
              marginBottom: "24px"
            },
            children: summaryLines.map((line, index) => ({ type: "div", props: { key: `s${index}`, children: line } }))
          }
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "20px 22px",
              borderRadius: "22px",
              background: "rgba(12,27,60,0.72)",
              border: "1px solid #314776",
              marginBottom: "18px"
            },
            children: [
              { type: "div", props: { style: { color: "#93a5ff", fontSize: "22px", fontWeight: 700, marginBottom: "2px" }, children: "핵심 포인트" } },
              ...bulletItems.map((item, index) => ({
                type: "div",
                props: {
                  key: `b${index}`,
                  style: { display: "flex", gap: "12px", alignItems: "center", color: "#eef2ff", fontSize: "25px", lineHeight: 1.35 },
                  children: [
                    { type: "div", props: { style: { width: "7px", height: "7px", borderRadius: "999px", background: "#8193ff", flexShrink: 0 } } },
                    { type: "div", props: { children: String(item) } }
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
              display: "flex",
              padding: "16px 20px",
              borderRadius: "18px",
              background: "rgba(129,147,255,0.10)",
              border: "1px solid rgba(129,147,255,0.28)",
              color: "#d9e1ff",
              fontSize: "23px",
              lineHeight: 1.4,
              marginBottom: "16px"
            },
            children: String(interpretation || "오늘 흐름의 방향성과 다음 확인 포인트를 함께 보세요.")
          }
        },
        { type: "div", props: { style: { flex: 1 } } },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #32446f",
              paddingTop: "22px"
            },
            children: [
              { type: "div", props: { style: { color: "#b6c1e5", fontSize: "24px" }, children: "필요한 소식만 간편하게" } },
              { type: "div", props: { style: { color: "#91a2ff", fontSize: "32px", fontWeight: 700 }, children: "프베톡.com" } }
            ]
          }
        }
      ]
    }
  };

  const svg = await satori(tree, { width: 1080, height: 1080, fonts });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
