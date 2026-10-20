import { Client, type ConnectConfig } from "ssh2";
import type { ConnectionInfo, SSHEndpoint } from "../types.ts";
import { SSH_KEEPALIVE_INTERVAL_MS, SSH_KEEPALIVE_COUNT_MAX } from "../utils/index.ts";

const READY_TIMEOUT_MS = 30000;

function connectOptions(endpoint: SSHEndpoint): ConnectConfig {
  return {
    ...endpoint,
    readyTimeout: READY_TIMEOUT_MS,
    keepaliveInterval: SSH_KEEPALIVE_INTERVAL_MS,
    keepaliveCountMax: SSH_KEEPALIVE_COUNT_MAX,
  };
}

/**
 * Connect `conn` to the target, through the jump host when one is configured
 *
 * Hop errors, including a hop dropping mid-session, are re-emitted on `conn`,
 * so callers keep a single error handler.
 */
export function dial(conn: Client, connInfo: ConnectionInfo): void {
  const { jump, config: target } = connInfo;
  if (!jump) {
    conn.connect(connectOptions(target));
    return;
  }

  const hop = new Client();
  let stage = "connecting to the jump host";
  let settled = false;
  let closing = false;

  const report = (message: string) => {
    if (conn.listenerCount("error") > 0) conn.emit("error", new Error(message));
  };

  const fail = (message: string) => {
    clearTimeout(deadline);
    const alreadySettled = settled;
    settled = true;
    closing = true;
    hop.end();
    if (!alreadySettled) report(message);
  };

  const deadline = setTimeout(
    () => fail(`Jump host ${jump.config.host} timed out after ${READY_TIMEOUT_MS / 1000}s while ${stage} (firewall or IP whitelist?)`),
    READY_TIMEOUT_MS
  );

  hop.on("ready", () => {
    stage = `opening a channel to ${target.host}:${target.port}`;
    hop.forwardOut("127.0.0.1", 0, target.host, target.port, (err, stream) => {
      if (settled) {
        stream?.end();
        return;
      }
      if (err) {
        fail(`Jump host ${jump.config.host} could not reach ${target.host}:${target.port}: ${err.message}`);
        return;
      }
      clearTimeout(deadline);
      settled = true;
      stream.on("close", () => {
        closing = true;
        hop.end();
      });
      try {
        conn.connect({ ...connectOptions(target), sock: stream });
      } catch (connectErr) {
        closing = true;
        hop.end();
        report((connectErr as Error).message);
      }
    });
  });

  hop.on("error", (err) => {
    const message = `Jump host ${jump.config.host}: ${err.message}`;
    if (!settled) fail(message);
    else if (!closing) report(message);
  });

  try {
    hop.connect(connectOptions(jump.config));
  } catch (connectErr) {
    clearTimeout(deadline);
    settled = true;
    throw connectErr;
  }
}
