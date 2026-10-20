import { Client } from "ssh2";
import type { ConnectionInfo } from "../types.ts";
import { colors, validatePath } from "../utils/index.ts";
import { dial } from "./dial.ts";

/**
 * Execute a command on a remote server via SSH
 *
 * Features:
 * - Streams stdout/stderr in real-time
 * - Proper resource cleanup on all error paths
 * - 30-second handshake timeout; keepalive bounds a dropped link at ~75s
 *
 * @returns Exit code from the remote command (0 = success)
 */
export function executeCommand(
  connInfo: ConnectionInfo,
  command: string,
  serverName: string
): Promise<number> {
  return new Promise((resolve) => {
    // Validate appPath to prevent command injection
    const safePath = validatePath(connInfo.appPath, "appPath");

    const fullCommand = command.startsWith("cd ")
      ? command
      : `cd ${safePath} && ${command}`;

    // Decoration goes to stderr: stdout is the remote command's data channel
    // (see the stream.on("data") forward below), so anything we add there ends
    // up inside `$(remote ...)` and breaks binary round-trips.
    console.error(
      `\n${colors.cyan}[${serverName}]${colors.reset} ${connInfo.displayHost} → ${colors.bold}${command}${colors.reset}`
    );
    console.error(`${colors.dim}${"─".repeat(60)}${colors.reset}`);

    const conn = new Client();

    /**
     * Cleanup function to prevent resource leaks
     * Removes all listeners and closes connection
     */
    const cleanup = () => {
      // Detach stdin so a piped script doesn't keep the event loop alive
      // after the remote stream closes.
      if (!process.stdin.isTTY) {
        process.stdin.unpipe();
        process.stdin.pause();
      }
      conn.removeAllListeners();
      conn.end();
    };

    conn.on("ready", () => {
      conn.exec(fullCommand, (err, stream) => {
        if (err) {
          console.error(`${colors.red}Error:${colors.reset}`, err.message);
          cleanup();
          resolve(1);
          return;
        }

        stream.on("data", (data: Buffer) => process.stdout.write(data));
        stream.stderr.on("data", (data: Buffer) => process.stderr.write(data));

        // Forward local stdin to the remote command ONLY when input is piped
        // or redirected (not an interactive TTY). This lets you feed a script to
        // a remote interpreter mangle-free, e.g.  remote <srv> "php" < script.php
        // — the script bytes travel over stdin, so neither the local nor the
        // remote shell ever parses them ($, ??, {}, quotes stay intact).
        // When run from a terminal with no redirect (stdin is a TTY), we skip
        // piping so ordinary commands don't block waiting on stdin EOF.
        if (!process.stdin.isTTY) {
          // pipe() defaults to { end: true }, so it calls stream.end() on stdin
          // EOF automatically — no manual "end" listener needed (and adding one
          // would double-end the channel + leak across calls).
          process.stdin.pipe(stream);
        }

        stream.on("close", (code: number) => {
          cleanup();
          resolve(code || 0);
        });

        // Handle stream errors (was missing in original code)
        stream.on("error", (streamErr: Error) => {
          console.error(
            `${colors.red}Stream error:${colors.reset}`,
            streamErr.message
          );
          cleanup();
          resolve(1);
        });
      });
    });

    conn.on("error", (err) => {
      console.error(`${colors.red}SSH Error:${colors.reset}`, err.message);
      cleanup(); // Was missing in original code - caused resource leak
      resolve(1);
    });

    conn.on("timeout", () => {
      console.error(
        `${colors.red}SSH Timeout:${colors.reset} Connection timed out`
      );
      cleanup();
      resolve(1);
    });

    dial(conn, connInfo);
  });
}
