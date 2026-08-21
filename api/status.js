export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const exists = (name) => Boolean(process.env[name]);

  return res.status(200).json({
    ok: true,
    services: {
      threads: {
        ready: exists("THREADS_ACCESS_TOKEN") && exists("THREADS_USER_ID") && exists("OPENAI_API_KEY"),
        access_token: exists("THREADS_ACCESS_TOKEN"),
        user_id: exists("THREADS_USER_ID"),
        openai: exists("OPENAI_API_KEY"),
        cron_secret: exists("CRON_SECRET"),
        admin_key: exists("AUTOMATION_ADMIN_KEY")
      },
      instagram: {
        ready: exists("INSTAGRAM_ACCESS_TOKEN") && exists("INSTAGRAM_USER_ID")
      },
      tiktok: {
        ready: exists("TIKTOK_ACCESS_TOKEN") && exists("TIKTOK_OPEN_ID")
      }
    }
  });
}
