function exists(name) {
  return Boolean(process.env[name]);
}

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  return res.status(200).json({
    ok: true,
    services: {
      threads: {
        ready: exists("THREADS_ACCESS_TOKEN") && exists("THREADS_USER_ID") && exists("OPENAI_API_KEY")
      },
      instagram: {
        ready: exists("INSTAGRAM_ACCESS_TOKEN") && exists("INSTAGRAM_USER_ID") && exists("OPENAI_API_KEY")
      }
    }
  });
}
