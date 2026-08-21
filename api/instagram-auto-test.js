import { createInstagramContent } from "../lib/instagram-content.js";
import { publishInstagramImage } from "../lib/instagram.js";

function authorized(req) {
  const secret = process.env.AUTOMATION_ADMIN_KEY;
  if (!secret) return false;
  return req.headers["x-admin-key"] === secret;
}

function publicBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${req.headers.host}`;
}

function makeImageUrl(baseUrl, content) {
  const d = Buffer.from(JSON.stringify({
    category: content.category,
    title: content.title,
    summary: content.summary
  }), "utf8").toString("base64url");
  return `${baseUrl}/api/instagram-card?d=${encodeURIComponent(d)}`;
}

async function run(req) {
  const content = await createInstagramContent();
  const image_url = makeImageUrl(publicBaseUrl(req), content);
  const result = await publishInstagramImage({ imageUrl: image_url, caption: content.caption });
  return { content, image_url, result };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!authorized(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });
  try {
    const out = await run(req);
    return res.status(200).json({ ok: true, ...out });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
