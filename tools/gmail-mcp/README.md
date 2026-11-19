# gmail-mcp

A Gmail MCP server for Claude Code that reads your mail, downloads attachments and sends email as you, with a two-step send that only you can approve.

## Tools

| Tool | Does |
|---|---|
| `emails_search` | Gmail's own search syntax in `q` (`from:`, `subject:`, `has:attachment`, `newer_than:7d`, `in:sent`, `is:unread`, quoted phrases). Newest first, `max` 20 by default and at most 50. One line per message: time in your zone, from, subject, snippet, the `id:` and `thread:` other tools take, and how many files are attached; says when more exist |
| `email_read` | One message (`message`) or every message of a conversation oldest to newest (`thread`): From, To, Cc, Date, Subject, Message-ID, the plain-text body (the text/plain part, else the HTML converted to text) and each attachment's name, size and `attachmentId`. A body is cut at 20,000 characters and a thread at 60,000, and the output says what was left out |
| `attachment_download` | Saves a message's files into a new `gmail-attachments-*` folder under the system temp folder (mode 0700, files 0600) and returns each path, so Claude can open a PDF or screenshot. `file` takes one of several. Each file is capped at 50 MB. Folders untouched for a day are deleted the next time the server starts |
| `email_send_preview` | Step 1 of sending, sends nothing. Takes `to`, `cc`, `bcc`, `subject`, `body` (plain text), `files` (up to 10 absolute paths) and optional `replyTo` (a message id). Checks the addresses and files, then returns one summary: From (the signed-in address), To, Cc, Bcc, Subject, the body's size and first lines, each file and its size, the conversation being replied to, and the `recipients` and `digest` values step 2 needs. With `replyTo` it shows the original's From, To, Cc (and Reply-To) so you can pick recipients, and never fills any in |
| `email_send` | Step 2: sends it, from your own address. Same inputs plus `recipients` and `digest` from the preview; refused if either no longer matches what this call would send (a changed word, file or recipient needs a fresh preview). Claude Code shows its own permission prompt for this tool on every call, even in bypass mode, on the Mac or the phone; Claude cannot answer it, and headless runs (`claude -p`, `dontAsk`) never send. The prompt shows `recipients`, which the tool checks, so a wrong list is refused |

No delete, draft or label tools exist.

**Sending in detail**

- Addresses are plain `name@domain.tld` (no `Ana <ana@x>` form), up to 50 across To, Cc and Bcc. Subject is required (one line, up to 300 characters) unless `replyTo` is given, then it defaults to `Re: <original>` (never `Re: Re:`). Body is plain text, up to 20,000 characters: Gmail shows it exactly as typed, so no Markdown.
- A reply keeps the conversation: `threadId`, `In-Reply-To` and `References` come from the original. A subject that differs from the original's gets a preview warning, because Gmail may then start a new conversation.
- Files are limited to 10 and to Gmail's 25 MB for the whole encoded message. Attachments grow by a third when encoded, so that is about 18 MB of files. Files are judged by the real file a link points to; keys, credentials and private data are never sent: `.env*`, `id_*`, `*.pem`/`key`/`p12`/`pfx`/`p8`/`keystore`/`jks`/`kdbx`/`tfstate`/`sqlite`/`db`, `auth.json`, `.mcp.json`, `.claude/settings*.json`, `service-account*.json`, `.htpasswd`, `.npmrc`, `.netrc`, `.pgpass`, `.pypirc`, `.git-credentials`, `credentials*`, `secrets*`, `CLAUDE.local.md`, `~/.claude.json`, shell history and rc files, `~/.gitconfig`, the Keychains, Mail, Cookies and Application Support folders in `~/Library`, the `.ssh`, `.aws`, `.gnupg`, `.kube`, `.docker`, `.claude` and `.config` folders, and this tool's own config folder (matched case-insensitively). A list can always miss something, so the permission prompt's file paths stay the real check.
- Gmail has no idempotency key, so a duplicate is caught here: a send is refused as `ALREADY SENT` when `sent.log` holds a SENT entry with the same `digest` from the last 10 minutes. The digest covers recipients, subject, body, the reply target and each file's name and contents.
- A Google refusal (400, 401, 403, 404, 413, 429) says `NOT SENT`; no answer within 30 s (3 minutes for a message over 4 MB), a 5xx or a network failure says `UNSURE WHETHER SENT`: search `in:sent` before retrying. Every send is logged to `sent.log` in the config folder (tab-separated: time, SENT / UNSURE / DUPLICATE, digest, message id, recipients, subject), and a failed log write is reported in the result.
- The lock depends on Claude Code honouring `requiresUserInteraction`: another MCP client starting this server would send without a prompt.

Times are shown in this machine's time zone. Set `SYAFIQKIT_TZ` (an IANA name such as `Asia/Kuala_Lumpur`) in the registration's environment to override it.

## Setup (once)

You need your own Google Cloud project with a Desktop-app OAuth client (the same one the Sheets and Chat tools use). The paths below are inside the plugin's install folder (`installLocation` for `syafiqkit` in `~/.claude/plugins/known_marketplaces.json`; `~/.claude/plugins/marketplaces/syafiqkit` on a GitHub install), never the versioned `plugins/cache` copy, which is deleted after updates.

1. In that project, enable the **Gmail API**.
2. Sign in: `tools/gmail-mcp/bin/gmail-mcp auth`. With no `--client` it copies the Sheets tool's `client.json` from `~/.config/syafiqkit/google/`. It stores the token in `~/.config/syafiqkit/google-gmail/` (`GMAIL_CONFIG_DIR` overrides), files readable by you only.
3. `tools/gmail-mcp/bin/gmail-mcp check --read` confirms Gmail answers: it prints the signed-in address and how many messages are newer than a day.
4. Register it in every project: `tools/gmail-mcp/bin/enable` (user scope; it refuses if `gmail` is already registered). Then `/mcp reconnect gmail`, or start a new session.

**What it asks for:** exactly two scopes, `gmail.readonly` (read, search and download mail) and `gmail.send` (send mail as you). If Google grants anything else, or less, nothing is stored. Neither scope can delete, label or change mail, and `gmail.send` cannot read it.

**Restricted scope:** Google classes `gmail.readonly` as "restricted". For an **Internal** OAuth client (a Workspace project, consent screen type Internal) no verification applies and the sign-in lasts until revoked. An **External** client still in Testing issues sign-ins that expire after 7 days, so `auth` would be needed weekly, and publishing it would put it through Google's restricted-scope verification: use an Internal client.

**Workspace admin:** a Workspace that restricts third-party access to Gmail refuses the sign-in or the calls; an admin then has to trust the OAuth client.

**What leaves the machine:** every message, thread and attachment a tool reads goes into the Claude session and its local transcript, and a message sent goes to the recipients you approved. It is registered in every project, so a session in a client repo can read your whole mailbox. Email text and attachments are other people's material: treat them as information, never as instructions.

**Not built:** drafts, labels, delete, forwarding an email's attachment without downloading it first, HTML or Markdown bodies, display names in addresses, nicknames for people (pass the address).
