const GRAPH = "https://graph.threads.net/v1.0";

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

async function parseMetaResponse(res, label) {
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { raw }; }
  if (!res.ok) {
    throw new Error(`${label} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

export async function publishThread(text) {
  const userId = required("THREADS_USER_ID");
  const token = required("THREADS_ACCESS_TOKEN");

  const createBody = new URLSearchParams({
    media_type: "TEXT",
    text,
    access_token: token
  });

  const createRes = await fetch(`${GRAPH}/${encodeURIComponent(userId)}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: createBody
  });
  const created = await parseMetaResponse(createRes, "Threads container creation");
  if (!created.id) throw new Error("Threads container id was not returned");

  // Small wait makes container publishing more reliable.
  await new Promise(r => setTimeout(r, 1800));

  const publishBody = new URLSearchParams({
    creation_id: created.id,
    access_token: token
  });

  const publishRes = await fetch(`${GRAPH}/${encodeURIComponent(userId)}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publishBody
  });
  const published = await parseMetaResponse(publishRes, "Threads publish");
  return { creation_id: created.id, post_id: published.id || null };
}
