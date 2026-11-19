# Google Cloud console steps for gsheets and gchat

After step 1, add `?project=<project id>` to every link so it opens in the right project. Console labels move; if a button is not where a step says, ask them what they see rather than guessing.

## 1. Create the project

https://console.cloud.google.com/projectcreate

- Name: anything they will recognise, e.g. "My Claude tools". Note the **project ID** shown under the name.
- A Workspace account may have to pick an organisation or folder. "You don't have permission to create a project": see "Their Workspace blocks it" below.

## 2. Enable the APIs

Open each link and press **Enable**:

| API | For | Link |
|---|---|---|
| Google Sheets API | gsheets | https://console.cloud.google.com/apis/library/sheets.googleapis.com |
| Google Drive API | gsheets | https://console.cloud.google.com/apis/library/drive.googleapis.com |
| Google Slides API | gsheets, optional (only `slides_thumbnails`) | https://console.cloud.google.com/apis/library/slides.googleapis.com |
| Google Chat API | gchat | https://console.cloud.google.com/apis/library/chat.googleapis.com |
| People API | gchat (turns user ids into names) | https://console.cloud.google.com/apis/library/people.googleapis.com |
| Gmail API | gmail | https://console.cloud.google.com/apis/library/gmail.googleapis.com |

Enable Sheets and Drive whenever Chat is wanted too: the Chat sign-in reuses the same OAuth client, and enabling costs nothing.

## 3. Branding and audience (the consent screen)

https://console.cloud.google.com/auth/branding

If it says "Google Auth Platform not configured yet", press **Get started**:
- App name: their own, e.g. "<Name>'s Claude tools". User support email and developer contact: their own email.
- Audience:
  - **Workspace account → Internal.** Done; skip to step 4.
  - **Personal Gmail → External** (Internal is not offered).

External only, then:
1. https://console.cloud.google.com/auth/audience: press **Publish app** and confirm, so the status reads **In production**. In Testing, every sign-in expires after 7 days.
2. Publishing may ask for an app homepage and privacy-policy link on the Branding page. Any page they control works for their own use (a GitHub profile, a personal site).
3. They do not need to submit for verification. At sign-in Google will show "Google hasn't verified this app": **Advanced → Go to <app name> (unsafe)** is expected for their own app.

The Data Access (scopes) page can stay empty; the tools ask for their scopes at sign-in.

## 4. Create the OAuth client

https://console.cloud.google.com/auth/clients

- **Create client** → Application type **Desktop app** → any name → **Create**.
- **Download JSON** in the dialog (or the download icon in the client list). The file is named `client_secret_<…>.json`, usually in `~/Downloads`.
- Ask them for its path. It is a credential: it stays on their machine, and the tools copy it into their own config folder with private permissions. Never paste its contents into the chat.

A "Web application" client fails at sign-in with a redirect error; it must be **Desktop app**.

## 5. Chat app configuration (gchat only)

https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat

Fill in:
- **App name**: their own name (it appears beside every message they send).
- **Avatar URL**: any public `https://` image, e.g. their profile picture link, or https://developers.google.com/chat/images/quickstart-app-avatar.png
- **Description**: e.g. "Posts and reads my own messages".
- **Interactive features**: switch **off**.
- Leave logging off. Press **Save**.

## Their Workspace blocks it

A Workspace admin can stop users creating Cloud projects; the admin then has to allow it or create the project for them. An admin can restrict third-party apps' access to Google data (Admin console → Security → API controls). The sign-in then ends with "Access blocked" or "admin_policy_enforced". Their admin has to mark the OAuth client (its client ID from step 4) as trusted. Name this as the ask; there is no workaround from their side.
