import { createThreadsPost } from "../lib/content.js";
import { publishThread } from "../lib/threads.js";

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.authorization === `Bearer ${secret}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok:false, error:"Method not allowed" });
  if (!authorized(req)) return res.status(401).json({ ok:false, error:"Unauthorized" });

  try {
    const text = await createThreadsPost();
    const result = await publishThread(text);
    console.log(JSON.stringify({ event:"threads_auto_publish", text, result }));
    return res.status(200).json({ ok:true, text, result });
  } catch (error) {
    console.error("threads_auto_publish_error", error);
    return res.status(500).json({ ok:false, error:String(error?.message || error) });
  }
}
