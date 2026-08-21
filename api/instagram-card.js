import { renderInstagramCard } from "../lib/instagram-renderer.js";

function decodePayload(value) {
  const json = Buffer.from(String(value || ""), "base64url").toString("utf8");
  return JSON.parse(json);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");
  try {
    const data = decodePayload(req.query.d);
    const buffer = await renderInstagramCard(data);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(400).json({ ok: false, error: String(error?.message || error) });
  }
}
