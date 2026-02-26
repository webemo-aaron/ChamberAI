import http from "node:http";
import { URL, pathToFileURL } from "node:url";
import {
  createInMemoryDb,
  createMeeting,
  listMeetings,
  getMeeting,
  updateMeeting,
  registerAudioSource,
  listAudioSources,
  startProcessing,
  getProcessStatus,
  getDraftMinutes,
  updateDraftMinutes,
  updateActionItems,
  listActionItems,
  exportMinutes,
  approveMinutes,
  validateApproval,
  listAuditLog,
  runRetentionSweep,
  updateMotions,
  listMotions,
  getConfig,
  updateConfig,
  getPublicSummary,
  updatePublicSummary,
  generatePublicSummary,
  publishPublicSummary
} from "./index.js";

export function createRequestHandler(db) {
  return async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const path = url.pathname;
      const method = req.method ?? "GET";

      if (method === "OPTIONS") {
        return sendJson(res, 204, null);
      }

      if (method === "GET" && path === "/health") {
        return sendJson(res, 200, { ok: true });
      }

      if (method === "POST" && path === "/meetings") {
        const body = await readJsonBody(req);
        const meeting = createMeeting(db, body);
        return sendJson(res, 201, meeting);
      }

      if (method === "GET" && path === "/meetings") {
        return sendJson(res, 200, listMeetings(db));
      }

      const meetingMatch = path.match(/^\/meetings\/([^/]+)$/);
      if (meetingMatch) {
        const meetingId = meetingMatch[1];
        if (method === "GET") {
          const meeting = getMeeting(db, meetingId);
          if (!meeting) {
            return sendJson(res, 404, { error: "Meeting not found" });
          }
          return sendJson(res, 200, meeting);
        }
        if (method === "PUT") {
          const body = await readJsonBody(req);
          return sendJson(res, 200, updateMeeting(db, meetingId, body));
        }
      }

      const audioMatch = path.match(/^\/meetings\/([^/]+)\/audio-sources$/);
      if (audioMatch) {
        const meetingId = audioMatch[1];
        if (method === "POST") {
          const body = await readJsonBody(req);
          const audio = registerAudioSource(db, meetingId, body);
          return sendJson(res, 201, audio);
        }
        if (method === "GET") {
          return sendJson(res, 200, listAudioSources(db, meetingId));
        }
      }

      const processMatch = path.match(/^\/meetings\/([^/]+)\/process$/);
      if (processMatch && method === "POST") {
        const meetingId = processMatch[1];
        const status = startProcessing(db, meetingId);
        return sendJson(res, 200, status);
      }

      const processStatusMatch = path.match(/^\/meetings\/([^/]+)\/process-status$/);
      if (processStatusMatch && method === "GET") {
        const meetingId = processStatusMatch[1];
        const status = getProcessStatus(db, meetingId);
        return sendJson(res, 200, status);
      }

      const minutesMatch = path.match(/^\/meetings\/([^/]+)\/draft-minutes$/);
      if (minutesMatch) {
        const meetingId = minutesMatch[1];
        if (method === "GET") {
          return sendJson(res, 200, getDraftMinutes(db, meetingId));
        }
        if (method === "PUT") {
          const body = await readJsonBody(req);
          const updated = updateDraftMinutes(db, meetingId, body.content ?? "");
          return sendJson(res, 200, updated);
        }
      }

      const actionItemsMatch = path.match(/^\/meetings\/([^/]+)\/action-items$/);
      if (actionItemsMatch) {
        const meetingId = actionItemsMatch[1];
        if (method === "GET") {
          return sendJson(res, 200, listActionItems(db, meetingId));
        }
        if (method === "PUT") {
          const body = await readJsonBody(req);
          const updated = updateActionItems(db, meetingId, body.items ?? []);
          return sendJson(res, 200, updated);
        }
      }

      const actionItemsCsvMatch = path.match(/^\/meetings\/([^/]+)\/action-items\/export\/csv$/);
      if (actionItemsCsvMatch && method === "GET") {
        const meetingId = actionItemsCsvMatch[1];
        const items = listActionItems(db, meetingId);
        const header = ["description", "owner_name", "due_date", "status"];
        const lines = [header.join(",")];
        items.forEach((item) => {
          const row = [
            escapeCsv(item.description ?? ""),
            escapeCsv(item.owner_name ?? ""),
            escapeCsv(item.due_date ?? ""),
            escapeCsv(item.status ?? "")
          ];
          lines.push(row.join(","));
        });
        const csv = lines.join("\\n");
        res.writeHead(200, {
          "Content-Type": "text/csv",
          "Access-Control-Allow-Origin": "*"
        });
        return res.end(csv);
      }

      const motionsMatch = path.match(/^\/meetings\/([^/]+)\/motions$/);
      if (motionsMatch) {
        const meetingId = motionsMatch[1];
        if (method === "GET") {
          return sendJson(res, 200, listMotions(db, meetingId));
        }
        if (method === "PUT") {
          const body = await readJsonBody(req);
          const updated = updateMotions(db, meetingId, body.motions ?? []);
          return sendJson(res, 200, updated);
        }
      }

      const publicSummaryMatch = path.match(/^\/meetings\/([^/]+)\/public-summary$/);
      if (publicSummaryMatch) {
        const meetingId = publicSummaryMatch[1];
        if (method === "GET") {
          return sendJson(res, 200, getPublicSummary(db, meetingId));
        }
        if (method === "PUT") {
          const body = await readJsonBody(req);
          const updated = updatePublicSummary(db, meetingId, body ?? {});
          return sendJson(res, 200, updated);
        }
      }

      const publicSummaryGenerateMatch = path.match(/^\/meetings\/([^/]+)\/public-summary\/generate$/);
      if (publicSummaryGenerateMatch && method === "POST") {
        const meetingId = publicSummaryGenerateMatch[1];
        const summary = generatePublicSummary(db, meetingId);
        return sendJson(res, 200, summary);
      }

      const publicSummaryPublishMatch = path.match(/^\/meetings\/([^/]+)\/public-summary\/publish$/);
      if (publicSummaryPublishMatch && method === "POST") {
        const meetingId = publicSummaryPublishMatch[1];
        const actor = req.headers["x-demo-email"] ?? "user";
        const summary = publishPublicSummary(db, meetingId, actor);
        return sendJson(res, 200, summary);
      }

      const exportMatch = path.match(/^\/meetings\/([^/]+)\/export$/);
      if (exportMatch && method === "POST") {
        const meetingId = exportMatch[1];
        const body = await readJsonBody(req);
        const result = exportMinutes(db, meetingId, body.format ?? "pdf");
        return sendJson(res, 200, result);
      }

      const approveMatch = path.match(/^\/meetings\/([^/]+)\/approve$/);
      if (approveMatch && method === "POST") {
        const meetingId = approveMatch[1];
        const result = approveMinutes(db, meetingId);
        return sendJson(res, 200, result);
      }

      const approvalStatusMatch = path.match(/^\/meetings\/([^/]+)\/approval-status$/);
      if (approvalStatusMatch && method === "GET") {
        const meetingId = approvalStatusMatch[1];
        const result = validateApproval(db, meetingId);
        return sendJson(res, 200, result);
      }

      const auditMatch = path.match(/^\/meetings\/([^/]+)\/audit-log$/);
      if (auditMatch && method === "GET") {
        const meetingId = auditMatch[1];
        const result = listAuditLog(db, meetingId);
        return sendJson(res, 200, result);
      }

      if (method === "POST" && path === "/retention/sweep") {
        const result = runRetentionSweep(db);
        return sendJson(res, 200, result);
      }

      if (path === "/settings" && method === "GET") {
        return sendJson(res, 200, getConfig(db));
      }

      if (path === "/settings" && method === "PUT") {
        const body = await readJsonBody(req);
        const updated = updateConfig(db, body);
        return sendJson(res, 200, updated);
      }

      if (path === "/invites/authorized-senders" && method === "GET") {
        return sendJson(res, 200, { authorizedSenders: Array.from(db.inviteAuthorizedSenders.values()) });
      }

      if (path === "/invites/authorized-senders" && method === "POST") {
        const body = await readJsonBody(req);
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!email.includes("@")) {
          return sendJson(res, 400, { error: "Valid email is required." });
        }
        db.inviteAuthorizedSenders.add(email);
        return sendJson(res, 201, { authorizedSenders: Array.from(db.inviteAuthorizedSenders.values()) });
      }

      if (path === "/invites/send" && method === "POST") {
        const body = await readJsonBody(req);
        const to = String(body.to ?? "").trim().toLowerCase();
        if (!to.includes("@")) {
          return sendJson(res, 400, { error: "Valid recipient email is required." });
        }
        const template = String(db.motionConfig.defaultLinkTemplate ?? "").trim();
        const motionLink =
          String(body.motionLink ?? "").trim() ||
          (template
            ? template.replace(/\{\{\s*meeting_title\s*\}\}/g, encodeURIComponent(String(body.meetingTitle ?? "").trim()))
            : "");
        const invite = {
          id: `invite_${db.invites.length + 1}`,
          to,
          meeting_title: body.meetingTitle ?? null,
          motion_link: motionLink || null,
          invite_url: body.inviteUrl ?? null,
          status: "sent",
          created_at: db.now().toISOString()
        };
        db.invites.unshift(invite);
        db.memberships.set(to, {
          email: to,
          role: body.role ?? "viewer",
          status: "active",
          updated_at: db.now().toISOString()
        });
        return sendJson(res, 202, { ok: true, inviteId: invite.id, resendId: "mock-resend-id" });
      }

      if (path === "/integrations/motion/config" && method === "GET") {
        const cfg = db.motionConfig;
        return sendJson(res, 200, {
          enabled: Boolean(cfg.enabled),
          workspaceId: cfg.workspaceId ?? "",
          defaultProjectId: cfg.defaultProjectId ?? "",
          defaultLinkTemplate: cfg.defaultLinkTemplate ?? "",
          hasApiKey: Boolean(cfg.apiKey)
        });
      }

      if (path === "/integrations/motion/config" && method === "PUT") {
        const body = await readJsonBody(req);
        db.motionConfig = {
          ...db.motionConfig,
          enabled: Boolean(body.enabled),
          workspaceId: String(body.workspaceId ?? ""),
          defaultProjectId: String(body.defaultProjectId ?? ""),
          defaultLinkTemplate: String(body.defaultLinkTemplate ?? ""),
          apiKey: typeof body.apiKey === "string" ? body.apiKey.trim() : db.motionConfig.apiKey
        };
        const cfg = db.motionConfig;
        return sendJson(res, 200, {
          enabled: Boolean(cfg.enabled),
          workspaceId: cfg.workspaceId ?? "",
          defaultProjectId: cfg.defaultProjectId ?? "",
          defaultLinkTemplate: cfg.defaultLinkTemplate ?? "",
          hasApiKey: Boolean(cfg.apiKey)
        });
      }

      if (path === "/integrations/motion/test" && method === "POST") {
        if (!db.motionConfig.apiKey) {
          return sendJson(res, 400, { error: "Motion API key is not configured." });
        }
        return sendJson(res, 200, { ok: true, name: "Mock Motion User", email: "motion@mock.local" });
      }

      return sendJson(res, 404, { error: "Not found" });
    } catch (error) {
      const status = error.details ? 422 : 400;
      return sendJson(res, status, { error: error.message, details: error.details ?? null });
    }
  };
}

export function createServer({ db = createInMemoryDb() } = {}) {
  const handler = createRequestHandler(db);
  const server = http.createServer(handler);
  return { server, db, handler };
}

export function startServer({
  port = Number(process.env.PORT ?? 4000),
  host = process.env.HOST ?? "127.0.0.1"
} = {}) {
  const { server } = createServer();
  server.listen(port, host, () => {
    console.log(`Mock API listening on http://${host}:${port}`);
  });
  return server;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  if (status === 204) {
    return res.end();
  }
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === "GET") return resolve({});
    if (req.method === "OPTIONS") return resolve({});

    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function escapeCsv(value) {
  const text = String(value);
  if (text.includes("\"")) {
    return `"${text.replace(/\"/g, "\"\"")}"`;
  }
  if (text.includes(",") || text.includes("\n")) {
    return `"${text}"`;
  }
  return text;
}

const entryArg = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
const isEntrypoint = entryArg && import.meta.url === entryArg;
if (isEntrypoint) {
  startServer();
}
