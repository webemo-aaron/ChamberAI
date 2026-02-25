import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../apps/secretary-console");
const preferredPort = Number(process.env.CONSOLE_PORT ?? process.env.PORT ?? 5173);
const host = process.env.CONSOLE_HOST ?? "127.0.0.1";
const strictPort = process.env.CONSOLE_STRICT_PORT === "true";

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json"
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, root }));
    return;
  }

  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath = path.join(root, pathname);

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] ?? "application/octet-stream" });
    res.end(data);
  });
});

findAvailablePort(preferredPort, host, strictPort)
  .then((port) => {
    server.listen(port, host, () => {
      console.log(
        JSON.stringify({
          event: "console_server_started",
          host,
          port,
          root,
          pid: process.pid
        })
      );
    });
  })
  .catch((err) => {
    console.error(`Failed to start console server: ${err.message}`);
    process.exit(1);
  });

function findAvailablePort(startPort, bindHost, strict) {
  return new Promise((resolve, reject) => {
    const tryPort = (candidate) => {
      const tester = net.createServer();
      tester.unref();
      tester.on("error", (err) => {
        if (err.code === "EADDRINUSE" && !strict) {
          tryPort(candidate + 1);
          return;
        }
        if (err.code === "EADDRINUSE" && strict) {
          reject(new Error(`Port ${candidate} is already in use and CONSOLE_STRICT_PORT=true`));
          return;
        }
        reject(err);
      });
      tester.listen(candidate, bindHost, () => {
        const { port } = tester.address();
        tester.close(() => resolve(port));
      });
    };
    tryPort(startPort);
  });
}
