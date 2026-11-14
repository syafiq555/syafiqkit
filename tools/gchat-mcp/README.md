# gchat-mcp

A Google Chat MCP server for Claude Code that reads, sends and edits as you: your spaces, group chats and DMs.

## Tools

| Tool | Does |
|---|---|
| `spaces_list` | Your spaces, group chats and DMs, most recently active first; DMs are labelled with the other person's name |
| `messages_list` | The newest messages of one space or DM, shown oldest to newest in Malaysia time, each line with its thread name; filter by `since`, `until`, `thread`, `from` |
| `messages_search` | Every message containing all the given words (quote a phrase) across spaces active since a date, optionally from one sender; with only `from`, everything that person said. Shows at most 150 hits and says what it left out or couldn't read |
| `attachment_download` | Saves the files attached to one message (screenshots, PDFs) into a new `gchat-attachments-*` folder under the system temp folder, readable by you only, and returns each path, so Claude can open a screenshot someone posted. Every message line from `messages_list` or `messages_search` shows `message: spaces/…/messages/…`; pass that name, and `file` to take one of several. Files linked from Google Drive are not downloaded (that needs a Drive scope this tool doesn't have); their Drive link comes back instead. Each file is capped at 50 MB. Download folders untouched for a day are deleted the next time the server starts |
| `message_send_preview` | Step 1 of sending, sends nothing: checks any files and returns one line naming the recipient, whether it is a DM or a space and how many people are in it, whether it goes as a reply in a thread or a new top-level message, the text's size, each file's name and size and the last message there, plus the `recipient` and `afterMessage` values step 2 needs |
| `message_send` | Step 2: posts as you, optionally with files (`files`: up to 10 absolute paths, 50 MB each; text may then be empty). Text is capped at 1000 characters so the phone permission prompt stays readable; Claude splits a longer message into several, each previewed and sent in order. Claude asks you first with a question you can answer on the phone, then Claude Code shows its own permission prompt for this tool on every call, even in bypass mode, on the Mac or on the phone through Remote Control; Claude cannot answer it. The prompt shows `recipient`, a name the tool checks against the space, so a wrong name is refused. A DM or thread reply is not sent if a message arrived after the preview; a new top-level post in a space is not held back by other threads. Files are judged by the real file a link points to, and keys, credentials and private data are never sent: `.env*`, `id_*`, `*.pem`/`key`/`p12`/`pfx`/`p8`/`keystore`/`jks`/`kdbx`/`tfstate`/`sqlite`/`db`, `auth.json`, `.mcp.json`, `.claude/settings*.json`, `service-account*.json`, `.htpasswd`, `.npmrc`, `.netrc`, `.pgpass`, `.pypirc`, `.git-credentials`, `credentials*`, `secrets*`, `CLAUDE.local.md`, `~/.claude.json`, shell history and rc files, `~/.gitconfig`, the Keychains, Mail, Cookies and Application Support folders in `~/Library`, and the `.ssh`, `.aws`, `.gnupg`, `.kube`, `.docker`, `.claude` and `.config` folders (matched case-insensitively). A list can always miss something, so the permission prompt's file paths stay the real check. A Google refusal says NOT SENT; no answer within 30 s (3 minutes for an upload) or a 5xx says it may have posted and to re-read before retrying. Each send carries a message id worked out from the space, the preview's `afterMessage`, the text and the files, so a retry with the same values is refused by Google as ALREADY POSTED instead of posting twice. Headless runs (`claude -p`, `dontAsk`) never send. Every send is logged to `sent.log` in the config folder, marked SENT, UNSURE or DUPLICATE, and a failed log write is reported in the result. The lock depends on Claude Code honouring `requiresUserInteraction`: another MCP client starting this server would send without a prompt |
| `message_edit_preview` | Step 1 of editing one of your own messages, changes nothing: names the chat, says when it is a thread reply or has files, when the message was sent (and last edited), shows its current text and both sizes (and warns when the current text is over the 1000-character cap), plus the `recipient`, `version` and `was` values step 2 needs. Take the message name from the `message:` part of a `messages_list` line. Refuses someone else's message, a deleted one, or when it can't tell which user is you |
| `message_edit` | Step 2: replaces the message's text (attached files stay), behind the same per-call permission prompt as `message_send`. The prompt shows `was`, the replaced message's first 60 characters, so you can see which message changes. Refused if `recipient` doesn't match the chat, `was` doesn't match the message, or the message changed since the preview (`version` is its last-edit time). Everyone sees the new text with an "Edited" label and nobody is notified again. Text is capped at 1000 characters. Logged to `sent.log` as EDITED or UNSURE-EDIT. There is no delete tool |

**Formatting:** text sent or edited through the API is read as Markdown: `**bold**`, `*italic*`, `~strike~`, `` `code` `` and a line starting `- ` per list item. A single `*text*` is italic here, unlike typing in the Chat app, and a typed `•` is plain text whose lines run together (measured 14/11/2026).

A `space` argument takes a space name (`spaces/AAAA…`), a display name or a unique part of one, a person's name for a DM, or a colleague's email for your DM with them. Dates take `7d`, `12h`, `2w`, `13/11/2026`, `2026-11-13` (both Malaysia midnight) or an ISO timestamp.

## Setup (once)

In the Google Cloud project that owns the OAuth client (the Sheets one: `careful-yew-506703-e8`):

1. Enable the **Google Chat API** and the **People API**.
2. Open the Chat API's **Configuration** tab and fill in an app name, an avatar URL and a description. Pick the name with care: Google shows it beside your name on every message the tool sends (ours is `Syafiq`). Leave every interactive feature off. Google refuses every Chat API call, user sign-ins included, until this page is saved ("Google Chat app not found").
3. Sign in: `tools/gchat-mcp/bin/gchat-mcp auth`. With no `--client` it copies the Sheets tool's `client.json` from `~/.config/syafiqkit/google/`. It stores the token in `~/.config/syafiqkit/google-chat/` (`GCHAT_CONFIG_DIR` overrides).
4. Register it in every project: `tools/gchat-mcp/bin/enable` (user scope). Then `/mcp reconnect gchat`, or start a new session.

**What it asks for:** exactly four scopes: `chat.spaces.readonly`, `chat.memberships.readonly`, `chat.messages` and `directory.readonly` (to turn user ids into names). `chat.messages` lets the sign-in read, send, edit and delete your messages; the tool builds no delete. It cannot create spaces or start a new DM. If Google grants anything else, nothing is stored.

**Workspace admin:** a Workspace that restricts third-party access to Chat or the directory refuses the sign-in or the calls; an admin then has to trust the OAuth client.

**Consent screen type:** an Internal client (Workspace) keeps the sign-in until revoked. An External client still in Testing issues sign-ins that expire after 7 days, so `auth` would be needed weekly; publish it (Audience, In production) first.

**What leaves the machine:** every message a tool reads goes into the Claude session and its local transcript. It is registered in every project, so a session in a client repo can read company chats too.

**Not built yet:** unread state and @-mentions of you (both need scopes not granted), nicknames for people (pass the email instead), a list of spaces it must never read, starting a new DM.
