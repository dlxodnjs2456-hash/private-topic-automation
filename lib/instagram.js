const GRAPH = process.env.INSTAGRAM_GRAPH_BASE || "https://graph.instagram.com/v24.0";

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return String(v).trim().replace(/^Bearer\s+/i, "").replace(/^['\"]|['\"]$/g, "");
}

async function parseMetaResponse(res, label) {
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { raw }; }
  if (!res.ok) {
    const msg = data?.error?.message || raw || `HTTP ${res.status}`;
    throw new Error(`${label} failed (${res.status}): ${msg}`);
  }
  return data;
}

async function sleep(ms) {
  await new Promise(r => setTimeout(r, ms));
}

export async function publishInstagramImage({ imageUrl, caption = "" }) {
  const userId = required("INSTAGRAM_USER_ID");
  const token = required("INSTAGRAM_ACCESS_TOKEN");
  if (!imageUrl) throw new Error("Public image URL is required");

  const createBody = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: token
  });

  const createRes = await fetch(`${GRAPH}/${encodeURIComponent(userId)}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: createBody
  });
  const created = await parseMetaResponse(createRes, "Instagram container creation");
  if (!created.id) throw new Error("Instagram creation_id was not returned");

  let status = null;
  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    const statusRes = await fetch(`${GRAPH}/${encodeURIComponent(created.id)}?fields=status_code,status&access_token=${encodeURIComponent(token)}`);
    const polled = await parseMetaResponse(statusRes, "Instagram status poll");
    status = polled?.status_code || polled?.status || null;
    if (status === "FINISHED") break;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Instagram media processing failed with status: ${status}`);
    }
  }
  if (status !== "FINISHED") {
    throw new Error(`Instagram media processing timed out. Last status: ${status || 'unknown'}`);
  }

  const publishBody = new URLSearchParams({
    creation_id: created.id,
    access_token: token
  });
  const publishRes = await fetch(`${GRAPH}/${encodeURIComponent(userId)}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publishBody
  });
  const published = await parseMetaResponse(publishRes, "Instagram publish");
  return { creation_id: created.id, post_id: published.id || null };
}
