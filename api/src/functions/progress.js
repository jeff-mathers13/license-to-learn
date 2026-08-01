const { app } = require("@azure/functions");
const { BlobServiceClient } = require("@azure/storage-blob");

const CONTAINER_NAME = "progress";
const MAX_BODY_BYTES = 256 * 1024;

// SWA's edge injects this header (base64 JSON) on every request that reaches /api/*,
// once staticwebapp.config.json requires the "authenticated" role on that route.
function getUserId(request) {
  const header = request.headers.get("x-ms-client-principal");
  if (!header) return null;
  try {
    const principal = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    return principal?.userId || null;
  } catch {
    return null;
  }
}

let containerClientPromise = null;
function getContainerClient() {
  if (!containerClientPromise) {
    const connectionString = process.env.PROGRESS_STORAGE_CONNECTION_STRING;
    if (!connectionString) throw new Error("PROGRESS_STORAGE_CONNECTION_STRING is not configured");
    const container = BlobServiceClient.fromConnectionString(connectionString).getContainerClient(CONTAINER_NAME);
    containerClientPromise = container.createIfNotExists().then(
      () => container,
      (e) => {
        containerClientPromise = null; // don't let one transient failure poison every later request
        throw e;
      }
    );
  }
  return containerClientPromise;
}

async function streamToString(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

app.http("progress", {
  route: "progress",
  methods: ["GET", "PUT"],
  authLevel: "anonymous", // real gate is staticwebapp.config.json's allowedRoles + the principal check below
  handler: async (request, context) => {
    const userId = getUserId(request);
    if (!userId) {
      return { status: 401, jsonBody: { error: "Not authenticated" } };
    }

    let container;
    try {
      container = await getContainerClient();
    } catch (e) {
      context.error("Storage configuration error:", e);
      return { status: 500, jsonBody: { error: "Storage not configured" } };
    }

    const blobClient = container.getBlockBlobClient(`${userId}.json`);

    if (request.method === "GET") {
      const exists = await blobClient.exists();
      if (!exists) {
        return { status: 204 }; // expected first-run state, not an error
      }
      const downloadResponse = await blobClient.download();
      const body = await streamToString(downloadResponse.readableStreamBody);
      return { status: 200, headers: { "Content-Type": "application/json" }, body };
    }

    const bodyText = await request.text();
    if (!bodyText || Buffer.byteLength(bodyText, "utf8") > MAX_BODY_BYTES) {
      return { status: 413, jsonBody: { error: "Payload too large or empty" } };
    }
    try {
      JSON.parse(bodyText);
    } catch {
      return { status: 400, jsonBody: { error: "Body must be valid JSON" } };
    }
    await blobClient.upload(bodyText, Buffer.byteLength(bodyText, "utf8"), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });
    return { status: 200, jsonBody: { ok: true } };
  },
});
