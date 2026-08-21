import { createInstagramContent } from "../lib/instagram-content.js";
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
    const { title, caption } = await createInstagramContent();
    const imageUrl = `${getBaseUrl(req)}/api/instagram-image?title=${encodeURIComponent(title)}&kicker=${encodeURIComponent("PRIVATE TOPIC")}`;
    const result = await publishInstagramImage({ imageUrl, caption });

    return res.status(200).json({
      ok: true,
      title,
      caption,
      image_url: imageUrl,
      result
    });
  } catch (error) {
    console.error("instagram_auto_test_error", error);
    return res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
