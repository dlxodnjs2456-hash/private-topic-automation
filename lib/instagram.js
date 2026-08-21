const API_VERSION = process.env.INSTAGRAM_API_VERSION || "v24.0";

async function parseJsonResponse(response) {
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }

  if (!response.ok) {
    const msg = data?.error?.message || raw || `HTTP ${response.status}`;
    throw new Error(`Instagram API failed (${response.status}): ${msg}`);
  }

  return data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForContainerReady(creationId, accessToken) {
  const maxAttempts = 12;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const statusUrl = new URL(
      `https://graph.instagram.com/${API_VERSION}/${encodeURIComponent(creationId)}`
    );
    statusUrl.searchParams.set("fields", "status_code");
    statusUrl.searchParams.set("access_token", accessToken);

    const response = await fetch(statusUrl, { method: "GET" });
    const statusData = await parseJsonResponse(response);
    const statusCode = String(statusData?.status_code || "").toUpperCase();

    if (statusCode === "FINISHED") {
      return statusData;
    }

    if (statusCode === "ERROR" || statusCode === "EXPIRED") {
      throw new Error(`Instagram media container processing failed: ${statusCode}`);
    }

    await sleep(2000);
  }

  throw new Error("Instagram media container was not ready in time");
}

export async function publishInstagramImage({ imageUrl, caption = "" }) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken) throw new Error("INSTAGRAM_ACCESS_TOKEN is missing");
  if (!userId) throw new Error("INSTAGRAM_USER_ID is missing");
  if (!imageUrl) throw new Error("imageUrl is required");

  const createUrl = new URL(
    `https://graph.instagram.com/${API_VERSION}/${encodeURIComponent(userId)}/media`
  );
  createUrl.searchParams.set("image_url", imageUrl);
  createUrl.searchParams.set("caption", caption);
  createUrl.searchParams.set("access_token", accessToken);

  const createResponse = await fetch(createUrl, { method: "POST" });
  const container = await parseJsonResponse(createResponse);
  const creationId = container?.id;

  if (!creationId) throw new Error("Instagram container ID was not returned");

  await waitForContainerReady(creationId, accessToken);

  const publishUrl = new URL(
    `https://graph.instagram.com/${API_VERSION}/${encodeURIComponent(userId)}/media_publish`
  );
  publishUrl.searchParams.set("creation_id", creationId);
  publishUrl.searchParams.set("access_token", accessToken);

  const publishResponse = await fetch(publishUrl, { method: "POST" });
  const published = await parseJsonResponse(publishResponse);

  return {
    creation_id: creationId,
    post_id: published?.id || null
  };
}
