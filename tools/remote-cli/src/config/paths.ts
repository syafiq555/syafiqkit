import { homedir } from "os";
import { join } from "path";

export const CONFIG_DIR =
  process.env.REMOTE_CLI_CONFIG_DIR || join(homedir(), ".config", "remote-cli");
export const CONFIG_PATH = join(CONFIG_DIR, "servers.json");
export const SECRETS_PATH = join(CONFIG_DIR, "secrets.json");
