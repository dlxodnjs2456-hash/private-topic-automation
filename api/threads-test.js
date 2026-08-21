import { publishThread } from "../lib/threads.js";

function authorized(req) {
  const secret = process.env.AUTOMATION_ADMIN_KEY;
  if (!secret) return false;
  return req.headers["x-admin-key"] === secret;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });
  if (!authorized(req)) return res.status(401).json({ ok:false, error:"Unauthorized" });

  try {
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ ok:false, error:"text is required" });
    if (text.length > 480) return res.status(400).json({ ok:false, error:"text is too long" });
    const result = await publishThread(text);
    console.log(JSON.stringify({ event:"threads_manual_test", result }));
    return res.status(200).json({ ok:true, result });
  } catch (error) {
    console.error("threads_manual_test_error", error);
    return res.status(500).json({ ok:false, error:String(error?.message || error) });
  }
}
