#!/usr/bin/env node

// Vue LSP Wrapper for Claude Code
// Wraps typescript-language-server and injects @vue/typescript-plugin
// so that .vue files get full TypeScript + Vue intelligence.

import { spawn } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Find @vue/language-server location for the plugin
let vuePluginPath;
try {
  const resolved = import.meta.resolve("@vue/language-server");
  vuePluginPath = dirname(fileURLToPath(resolved));
} catch {
  // Fallback: try require.resolve style
  import("@vue/language-server")
    .then(m => {})
    .catch(() => {});
  vuePluginPath = "/Users/syafiqshamsuddin/Library/Application Support/Herd/config/nvm/versions/node/v22.22.0/lib/node_modules/@vue/language-server";
}

const child = spawn("typescript-language-server", ["--stdio"], {
  stdio: ["pipe", "pipe", "pipe"],
});

child.stderr.pipe(process.stderr);
child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGTERM", () => child.kill());
process.on("SIGINT", () => child.kill());

// Parse LSP messages from a stream
function createParser(onMessage) {
  let buf = "";
  return (chunk) => {
    buf += chunk.toString();
    while (true) {
      const headerEnd = buf.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;
      const header = buf.slice(0, headerEnd);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) { buf = buf.slice(headerEnd + 4); continue; }
      const len = parseInt(match[1], 10);
      const start = headerEnd + 4;
      if (buf.length < start + len) break;
      const body = buf.slice(start, start + len);
      buf = buf.slice(start + len);
      try { onMessage(JSON.parse(body)); } catch {}
    }
  };
}

function sendToServer(msg) {
  const s = JSON.stringify(msg);
  child.stdin.write(`Content-Length: ${Buffer.byteLength(s)}\r\n\r\n${s}`);
}

function sendToClient(msg) {
  const s = JSON.stringify(msg);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(s)}\r\n\r\n${s}`);
}

// Intercept client → server: inject Vue plugin into initialize
process.stdin.on("data", createParser((msg) => {
  if (msg.method === "initialize" && msg.params) {
    if (!msg.params.initializationOptions) {
      msg.params.initializationOptions = {};
    }
    if (!msg.params.initializationOptions.plugins) {
      msg.params.initializationOptions.plugins = [];
    }
    // Inject @vue/typescript-plugin
    const hasVuePlugin = msg.params.initializationOptions.plugins.some(
      (p) => p.name === "@vue/typescript-plugin"
    );
    if (!hasVuePlugin) {
      msg.params.initializationOptions.plugins.push({
        name: "@vue/typescript-plugin",
        location: vuePluginPath,
        languages: ["vue"],
      });
    }
  }
  sendToServer(msg);
}));

// Pass server → client through unchanged
child.stdout.on("data", createParser((msg) => {
  sendToClient(msg);
}));
