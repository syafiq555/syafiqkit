#!/usr/bin/env node
/**
 * Vue LSP wrapper for Claude Code
 *
 * Spawns typescript-language-server --stdio and intercepts the LSP
 * `initialize` request to inject @vue/typescript-plugin, enabling
 * Vue SFC support (.vue files) through the TypeScript server.
 */
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Find @vue/language-server location (for the TS plugin)
let vueServerPath;
try {
  const resolved = import.meta.resolve('@vue/language-server');
  vueServerPath = dirname(fileURLToPath(resolved));
} catch {
  // Fallback to global npm path
  const { execSync } = await import('node:child_process');
  const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
  vueServerPath = resolve(globalRoot, '@vue/language-server');
}

const child = spawn('typescript-language-server', ['--stdio'], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';

// Parse LSP messages from a data stream
function parseMessages(data, callback) {
  buffer += data;
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;
    const header = buffer.slice(0, headerEnd);
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) break;
    const len = parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + len) break;
    const body = buffer.slice(bodyStart, bodyStart + len);
    buffer = buffer.slice(bodyStart + len);
    callback(body);
  }
}

function sendToChild(json) {
  const str = JSON.stringify(json);
  const msg = `Content-Length: ${Buffer.byteLength(str)}\r\n\r\n${str}`;
  child.stdin.write(msg);
}

function sendToParent(json) {
  const str = JSON.stringify(json);
  const msg = `Content-Length: ${Buffer.byteLength(str)}\r\n\r\n${str}`;
  process.stdout.write(msg);
}

// Intercept stdin → inject plugin into initialize
process.stdin.on('data', (chunk) => {
  parseMessages(chunk.toString(), (body) => {
    let msg;
    try { msg = JSON.parse(body); } catch { return; }

    if (msg.method === 'initialize') {
      // Inject @vue/typescript-plugin
      if (!msg.params.initializationOptions) {
        msg.params.initializationOptions = {};
      }
      if (!msg.params.initializationOptions.plugins) {
        msg.params.initializationOptions.plugins = [];
      }
      msg.params.initializationOptions.plugins.push({
        name: '@vue/typescript-plugin',
        location: vueServerPath,
        languages: ['vue'],
      });
    }

    sendToChild(msg);
  });
});

// Forward child stdout → parent stdout (passthrough)
child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
});

child.on('exit', (code) => process.exit(code ?? 1));
process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));
