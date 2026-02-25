#!/usr/bin/env bash
set -euo pipefail

start_port="${1:-5173}"
strict="${CONSOLE_STRICT_PORT:-false}"
host="${CONSOLE_HOST:-127.0.0.1}"

node -e '
  const net = require("node:net");
  const host = process.argv[1];
  const strict = process.argv[2] === "true";
  const start = Number(process.argv[3]);

  function tryPort(port) {
    const tester = net.createServer();
    tester.unref();
    tester.on("error", (err) => {
      if (err.code === "EADDRINUSE" && !strict) return tryPort(port + 1);
      if (err.code === "EADDRINUSE" && strict) {
        console.error(`Port ${port} is in use and strict mode is enabled`);
        process.exit(1);
      }
      console.error(err.message);
      process.exit(1);
    });
    tester.listen(port, host, () => {
      const address = tester.address();
      tester.close(() => {
        process.stdout.write(String(address.port));
      });
    });
  }

  tryPort(start);
' "$host" "$strict" "$start_port"
