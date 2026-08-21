import { publishInstagramImage } from "../lib/instagram.js";

function authorized(req) {
  const secret = process.env.AUTOMATION_ADMIN_KEY;
  if (!secret) return false;
  return req.headers["x-admin-key"] === secret;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!authorized(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const imageUrl = String(req.body?.image_url || "").trim();
    const caption = String(req.body?.caption || "").trim();

    if (!imageUrl) {
      return res.status(400).json({
        ok: false,
        error: "image_url is required. Instagram must be able to access the image through a public HTTPS URL."
      });
    }

    const result = await publishInstagramImage({ imageUrl, caption });
    console.log(JSON.stringify({ event: "instagram_manual_publish", imageUrl, result }));

    return res.status(200).json({ ok: true, image_url: imageUrl, result });
  } catch (error) {
    console.error("instagram_manual_publish_error", error);
    return res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
