import { publishInstagramImage } from "../lib/instagram.js";

function authorized(req) {
  const secret = process.env.AUTOMATION_ADMIN_KEY;
  if (!secret) return false;
  return req.headers["x-admin-key"] === secret;
}

function getBaseUrl(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!authorized(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const providedImageUrl = String(req.body?.image_url || "").trim();
    const imageUrl = providedImageUrl || `${getBaseUrl(req)}/api/instagram-test-image`;
    const caption = String(req.body?.caption || "").trim();

    const result = await publishInstagramImage({ imageUrl, caption });
    console.log(JSON.stringify({ event: "instagram_manual_publish", imageUrl, result }));

    return res.status(200).json({ ok: true, image_url: imageUrl, result });
  } catch (error) {
    console.error("instagram_manual_publish_error", error);
    return res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
