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

function lines(text) {
  return String(text || "").split(/\n+/).filter(Boolean).slice(0, 3);
}

export async function renderInstagramCard({ category, title, summary }) {
  const fonts = await getFonts();
  const titleLines = lines(title);
  const summaryLines = lines(summary).slice(0, 2);

  const tree = {
    type: "div",
    props: {
      style: {
        width: "1080px",
        height: "1080px",
        display: "flex",
        flexDirection: "column",
        padding: "78px",
        background: "linear-gradient(145deg,#081127 0%,#101d42 58%,#172756 100%)",
        color: "#ffffff",
        fontFamily: "NotoSansKR"
      },
      children: [
        {
          type: "div",
          props: {
            style: { width: "180px", height: "12px", borderRadius: "999px", background: "#8193ff", marginBottom: "40px" }
          }
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              padding: "12px 22px",
              borderRadius: "999px",
              border: "1px solid #40558e",
              background: "#162752",
              color: "#dce4ff",
              fontSize: "30px",
              fontWeight: 700,
              marginBottom: "72px"
            },
            children: String(category || "경제 브리핑")
          }
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "64px" },
            children: titleLines.map((line, index) => ({
              type: "div",
              props: {
                key: `t${index}`,
                style: { fontSize: "70px", lineHeight: 1.16, fontWeight: 700, letterSpacing: "-2px" },
                children: line
              }
            }))
          }
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: "8px", color: "#cbd5f3", fontSize: "34px", lineHeight: 1.5 },
            children: summaryLines.map((line, index) => ({
              type: "div",
              props: { key: `s${index}`, children: line }
            }))
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
              paddingTop: "34px"
            },
            children: [
              { type: "div", props: { style: { color: "#b6c1e5", fontSize: "28px" }, children: "필요한 소식만 간편하게" } },
              { type: "div", props: { style: { color: "#91a2ff", fontSize: "36px", fontWeight: 700 }, children: "프베톡.com" } }
            ]
          }
        }
      ]
    }
  };

  const svg = await satori(tree, { width: 1080, height: 1080, fonts });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
