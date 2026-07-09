const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const ARCHIVE_DIR = process.env.ARCHIVE_DIR
  ? path.resolve(process.env.ARCHIVE_DIR)
  : path.join(ROOT, "achievement-archive");
const EVENTS_DIR = path.join(ARCHIVE_DIR, "events");
const ASSETS_DIR = path.join(ARCHIVE_DIR, "assets");
const SEED_FILE = path.join(PUBLIC_DIR, "seed-achievements.json");
const SEED_DONE_FILE = path.join(ARCHIVE_DIR, "seed-default-achievements-v1.done");
const SEED_EXPANSION_DONE_FILE = path.join(ARCHIVE_DIR, "seed-default-achievements-v2.done");
const PORT = Number(process.env.PORT || 3417);

const EXPANDED_DEFAULT_SEED_IDS = new Set([
  "seed-wealth-freedom",
  "seed-wind-urges-rain",
  "seed-renovation-quest",
  "seed-global-foodie",
  "seed-apple-life",
  "seed-air-incident",
  "seed-own-car",
  "seed-midnight-protocol",
  "seed-small-clique",
  "seed-pure-love-warrior",
  "seed-world-channel-speech",
  "seed-became-boss"
]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8"
};

async function ensureArchive() {
  await fs.mkdir(EVENTS_DIR, { recursive: true });
  await fs.mkdir(ASSETS_DIR, { recursive: true });
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(payload);
}

function sendJson(res, status, body) {
  send(res, status, body);
}

function isInside(parent, target) {
  const relative = path.relative(path.resolve(parent), path.resolve(target));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 60 * 1024 * 1024) {
      throw Object.assign(new Error("Request body is too large."), { status: 413 });
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function listEventFiles() {
  await ensureArchive();
  const entries = await fs.readdir(EVENTS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function nextEventName(type) {
  const files = await listEventFiles();
  const last = files.at(-1);
  const lastSeq = last ? Number(last.slice(0, 8)) || 0 : 0;
  const seq = String(lastSeq + 1).padStart(8, "0");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${seq}_${stamp}_${type}.json`;
}

async function appendEvent(type, payload) {
  await ensureArchive();
  const event = {
    id: crypto.randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    payload
  };
  const fileName = await nextEventName(type);
  const filePath = path.join(EVENTS_DIR, fileName);
  await fs.writeFile(filePath, `${JSON.stringify(event, null, 2)}\n`, "utf8");
  return event;
}

function emptyAchievement(status = "locked") {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    status: status === "unlocked" ? "unlocked" : "locked",
    title: "",
    summary: "",
    condition: "",
    achievedAt: "",
    thumbImage: "",
    detailImage: "",
    tags: [],
    notes: "",
    points: null,
    future: {
      public: false,
      syncId: null,
      accountId: null,
      globalUnlocks: null,
      friendUnlocks: null,
      rarityPercent: null
    },
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copySeedImage(seed, achievementId) {
  const image = String(seed.image || "");
  if (!image.startsWith("/seed-assets/")) return "";

  const sourceName = decodeURIComponent(path.basename(image));
  const sourcePath = path.join(PUBLIC_DIR, "seed-assets", sourceName);
  const ext = path.extname(sourceName) || ".svg";
  const baseName = path.basename(sourceName, ext).replace(/[^a-z0-9_-]/gi, "-");
  const targetName = `seed_${String(seed.order || 0).padStart(2, "0")}_${baseName}${ext}`;
  const targetDir = path.join(ASSETS_DIR, achievementId);
  const targetPath = path.join(targetDir, targetName);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
  return `/archive/assets/${encodeURIComponent(achievementId)}/${encodeURIComponent(targetName)}`;
}

async function achievementFromSeed(seed, createdAt) {
  const achievement = emptyAchievement("locked");
  achievement.id = seed.id || achievement.id;
  const imagePath = await copySeedImage(seed, achievement.id);
  achievement.status = "locked";
  achievement.title = String(seed.title ?? "");
  achievement.summary = String(seed.summary ?? "");
  achievement.condition = String(seed.condition ?? "");
  achievement.achievedAt = "";
  achievement.thumbImage = imagePath;
  achievement.detailImage = imagePath;
  achievement.tags = Array.isArray(seed.tags) ? seed.tags : [];
  achievement.createdAt = createdAt;
  achievement.updatedAt = createdAt;
  return achievement;
}

async function writeSeedExpansionDone(payload) {
  await fs.writeFile(SEED_EXPANSION_DONE_FILE, `${JSON.stringify({
    version: 2,
    createdAt: new Date().toISOString(),
    ...payload
  }, null, 2)}\n`, "utf8");
}

async function ensureExpandedSeedAchievements(seeds) {
  if (await fileExists(SEED_EXPANSION_DONE_FILE)) return;

  const expansionSeeds = seeds.filter((seed) => EXPANDED_DEFAULT_SEED_IDS.has(seed.id));
  if (!expansionSeeds.length) {
    await writeSeedExpansionDone({ seeded: false, count: 0, reason: "no-expansion-seeds" });
    return;
  }

  const existingAchievements = await buildState({ includeDeleted: true });
  const existingIds = new Set(existingAchievements.map((achievement) => achievement.id));
  const missingSeeds = expansionSeeds.filter((seed) => !existingIds.has(seed.id));

  if (!missingSeeds.length) {
    await writeSeedExpansionDone({ seeded: false, count: 0, reason: "already-present" });
    return;
  }

  const times = existingAchievements
    .map((achievement) => Date.parse(achievement.createdAt || ""))
    .filter((time) => Number.isFinite(time));
  const baseTime = (times.length ? Math.min(...times) : Date.now()) - 1000;

  for (let index = 0; index < missingSeeds.length; index += 1) {
    const seed = missingSeeds[index];
    const createdAt = new Date(baseTime - index * 1000).toISOString();
    const achievement = await achievementFromSeed(seed, createdAt);
    await appendEvent("create", { achievement });
  }

  await writeSeedExpansionDone({ seeded: true, count: missingSeeds.length });
}

async function ensureSeedAchievements() {
  await ensureArchive();
  const seedConfig = JSON.parse(await fs.readFile(SEED_FILE, "utf8"));
  const seeds = Array.isArray(seedConfig.achievements) ? seedConfig.achievements : [];

  if (!(await fileExists(SEED_DONE_FILE))) {
    const existingEvents = await listEventFiles();
    if (existingEvents.length) {
      await fs.writeFile(SEED_DONE_FILE, `${JSON.stringify({
        version: 1,
        seeded: false,
        reason: "archive-not-empty",
        createdAt: new Date().toISOString()
      }, null, 2)}\n`, "utf8");
    } else {
      const baseTime = Date.now();

      for (let index = 0; index < seeds.length; index += 1) {
        const seed = seeds[index];
        const createdAt = new Date(baseTime + (seeds.length - index) * 1000).toISOString();
        const achievement = await achievementFromSeed(seed, createdAt);
        await appendEvent("create", { achievement });
      }

      await fs.writeFile(SEED_DONE_FILE, `${JSON.stringify({
        version: seedConfig.version || 1,
        seeded: true,
        count: seeds.length,
        createdAt: new Date().toISOString()
      }, null, 2)}\n`, "utf8");
    }
  }

  await ensureExpandedSeedAchievements(seeds);
}

async function readEvents() {
  const files = await listEventFiles();
  const events = [];
  for (const file of files) {
    try {
      const raw = await fs.readFile(path.join(EVENTS_DIR, file), "utf8");
      const event = JSON.parse(raw);
      events.push(event);
    } catch (error) {
      events.push({
        id: crypto.randomUUID(),
        type: "corrupt_event",
        createdAt: new Date().toISOString(),
        payload: { file, error: String(error.message || error) }
      });
    }
  }
  return events;
}

async function buildState({ includeDeleted = false } = {}) {
  const events = await readEvents();
  const achievements = new Map();

  for (const event of events) {
    if (event.type === "create") {
      const achievement = event.payload?.achievement;
      if (achievement?.id) achievements.set(achievement.id, achievement);
    }

    if (event.type === "update") {
      const id = event.payload?.id;
      const changes = event.payload?.changes || {};
      const current = achievements.get(id);
      if (current) {
        achievements.set(id, {
          ...current,
          ...changes,
          future: {
            ...(current.future || {}),
            ...(changes.future || {})
          },
          updatedAt: event.createdAt
        });
      }
    }

    if (event.type === "delete") {
      const ids = Array.isArray(event.payload?.ids) ? event.payload.ids : [];
      for (const id of ids) {
        const current = achievements.get(id);
        if (current) {
          achievements.set(id, {
            ...current,
            deletedAt: event.createdAt,
            updatedAt: event.createdAt
          });
        }
      }
    }
  }

  const all = Array.from(achievements.values());
  return all
    .filter((achievement) => includeDeleted || !achievement.deletedAt)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function extensionFromDataUrl(dataUrl, fallbackName = "") {
  const mimeMatch = /^data:([^;]+);base64,/.exec(dataUrl || "");
  const mime = mimeMatch?.[1]?.toLowerCase();
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  const ext = path.extname(fallbackName).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext) ? ext : ".png";
}

async function storeImage(achievementId, imagePayload, role) {
  if (!imagePayload?.dataUrl) return "";
  const match = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,(.+)$/i.exec(imagePayload.dataUrl);
  if (!match) return "";

  const dir = path.join(ASSETS_DIR, achievementId);
  await fs.mkdir(dir, { recursive: true });
  const ext = extensionFromDataUrl(imagePayload.dataUrl, imagePayload.name);
  const fileName = `${role}_${new Date().toISOString().replace(/[:.]/g, "-")}_${crypto.randomUUID()}${ext}`;
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, Buffer.from(match[1], "base64"));
  return `/archive/assets/${encodeURIComponent(achievementId)}/${encodeURIComponent(fileName)}`;
}

async function createAchievement(req, res) {
  const body = await readJsonBody(req);
  const achievement = emptyAchievement(body.status);
  await appendEvent("create", { achievement });
  sendJson(res, 201, { achievement });
}

async function updateAchievement(req, res, id) {
  const body = await readJsonBody(req);
  const changes = body.changes && typeof body.changes === "object" ? { ...body.changes } : {};

  if (body.thumbImageData) {
    changes.thumbImage = await storeImage(id, body.thumbImageData, "thumb");
  }

  if (body.detailImageData) {
    changes.detailImage = await storeImage(id, body.detailImageData, "detail");
  }

  await appendEvent("update", { id, changes });
  const achievements = await buildState();
  sendJson(res, 200, { achievement: achievements.find((item) => item.id === id) || null });
}

async function deleteAchievements(req, res) {
  const body = await readJsonBody(req);
  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  await appendEvent("delete", { ids });
  sendJson(res, 200, { ok: true, deletedIds: ids });
}

async function openArchiveFolder(res) {
  await ensureArchive();
  const opener = process.platform === "win32" ? "explorer.exe" : process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(opener, [ARCHIVE_DIR], {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
  sendJson(res, 200, { ok: true, path: ARCHIVE_DIR });
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;

  if (requested.startsWith("/archive/assets/")) {
    const parts = requested.split("/").map(decodeURIComponent);
    const achievementId = parts[3] || "";
    const fileName = parts[4] || "";
    const filePath = path.resolve(ASSETS_DIR, achievementId, fileName);
    if (!isInside(ASSETS_DIR, filePath)) {
      send(res, 403, "Forbidden");
      return;
    }
    await sendFile(res, filePath);
    return;
  }

  const filePath = path.resolve(PUBLIC_DIR, `.${requested}`);
  if (!isInside(PUBLIC_DIR, filePath)) {
    send(res, 403, "Forbidden");
    return;
  }
  await sendFile(res, filePath);
}

async function sendFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-store"
    });
    res.end(data);
  } catch (error) {
    send(res, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Not found" : "Server error");
  }
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/achievements") {
    const includeDeleted = url.searchParams.get("includeDeleted") === "1";
    sendJson(res, 200, { achievements: await buildState({ includeDeleted }) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/achievements") {
    await createAchievement(req, res);
    return;
  }

  const updateMatch = /^\/api\/achievements\/([^/]+)$/.exec(url.pathname);
  if (req.method === "PATCH" && updateMatch) {
    await updateAchievement(req, res, decodeURIComponent(updateMatch[1]));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/achievements/delete") {
    await deleteAchievements(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/archive/open") {
    await openArchiveFolder(res);
    return;
  }

  await serveStatic(req, res, url);
}

async function startServer({ port = PORT, host = "127.0.0.1", silent = false } = {}) {
  await ensureSeedAchievements();
  const server = http.createServer((req, res) => {
    route(req, res).catch((error) => {
      const status = error.status || 500;
      sendJson(res, status, { error: String(error.message || error) });
    });
  });

  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const actualPort = server.address().port;
      if (!silent) {
        console.log(`地球online成就殿堂 running at http://${host}:${actualPort}`);
        console.log(`Archive folder: ${ARCHIVE_DIR}`);
      }
      resolve({ server, port: actualPort, archiveDir: ARCHIVE_DIR });
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  startServer
};
