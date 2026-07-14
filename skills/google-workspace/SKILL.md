---
name: google-workspace
description: "Access Google Workspace APIs (Drive, Docs, Calendar, Gmail, Sheets, Slides, Chat, People) via local helper scripts without MCP. Handles OAuth login and direct API calls."
---

# Google Workspace

Use this skill for Google Workspace tasks (Gmail, Drive, Calendar, Docs, Sheets, etc.).

## Files

- `scripts/auth.js` — OAuth login/status/clear + account enumeration
- `scripts/workspace.js` — JavaScript execution based API runner

## Account model (multi-account)

This skill is **profile-based by email address**.

- There is **no default account**.
- Every API call must specify `--email <account@example.com>`.
- Tokens are stored per-email under `~/.pi/google-workspace/tokens/`.

Before running API calls, discover available signed-in accounts:

```bash
node scripts/auth.js accounts
```

## Usage

Always use `exec` and always provide `--email`.

```bash
node scripts/workspace.js exec --email user@example.com <<'JS'
const me = await workspace.whoAmI();
const files = await workspace.call('drive', 'files.list', {
  pageSize: 5,
  fields: 'files(id,name,mimeType)',
});
return { me, files: files.files };
JS
```

Available inside exec scripts:

- `auth` (authorized OAuth client)
- `google` (`googleapis` root)
- `workspace.accountEmail` (selected profile email)
- `workspace.call(service, methodPath, params, {version})`
- `workspace.service(service, {version})`
- `workspace.whoAmI()`
- Browser-compatible `btoa()` and `atob()` for Base64 encoding and decoding

Optional flags:

- `--timeout <ms>` (default 30000, max 300000)
- `--scopes s1,s2`
- `--script 'return 42'`

## Agent guidance

1. Prefer one `exec` script per user request.
2. Keep payloads small (`fields`, `maxResults`, minimal props).
3. Use `Promise.all` for independent requests.
4. Never print token contents.
5. If the user did not specify an account, run `node scripts/auth.js accounts` and choose/confirm an explicit email.
6. If auth fails, first run `node scripts/auth.js accounts` to see known profiles.
7. If account mismatch is possible, run `workspace.whoAmI()` in the selected profile.
8. On 401/403/unauthorized errors, switch account (`--email ...`) or re-login that specific profile.

## Unauthorized/account-switch playbook

If a request fails with unauthorized/forbidden/insufficient permissions:

1. Enumerate profiles:

```bash
node scripts/auth.js accounts
```

2. Retry with the intended account:

```bash
node scripts/workspace.js exec --email correct-user@example.com <<'JS'
return await workspace.whoAmI();
JS
```

3. If token is stale or missing scopes, re-login that account:

```bash
node scripts/auth.js login --email correct-user@example.com
```

4. Retry the original request with the same `--email`.

## Short Gmail counting example

```bash
node scripts/workspace.js exec --email user@example.com <<'JS'
const gmail = google.gmail({ version: 'v1', auth });

let trash = 0;
let pageToken;
do {
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:trash',
    maxResults: 500,
    pageToken,
    fields: 'messages/id,nextPageToken',
  });
  trash += (res.data.messages || []).length;
  pageToken = res.data.nextPageToken;
} while (pageToken);

return { currentlyInTrash: trash };
JS
```

## Gmail drafts with Unicode

Use UTF-8 Base64 for the Gmail API `raw` value. For non-ASCII subject lines (including emoji), use an RFC 2047 encoded-word header; `btoa()` only handles Latin-1 strings.

```js
const subject = 'Hello world 👋';
const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
const rawMessage = [
  'To: recipient@example.com',
  `Subject: ${encodedSubject}`,
  'MIME-Version: 1.0',
  'Content-Type: text/html; charset="UTF-8"',
  '',
  '<p>Hello, world! 👋</p>',
].join('\r\n');

const gmail = google.gmail({ version: 'v1', auth });
const draft = await gmail.users.drafts.create({
  userId: 'me',
  requestBody: {
    message: { raw: Buffer.from(rawMessage, 'utf8').toString('base64url') },
  },
});
return { draftId: draft.data.id };
```

## Setup + auth

```bash
node scripts/auth.js login --email user@example.com
```

Notes:

- Dependencies auto-install on first run.
- Default auth mode is **cloud** (no local `credentials.json` needed).
- Optional local mode: `GOOGLE_WORKSPACE_AUTH_MODE=local` and credentials at `~/.pi/google-workspace/credentials.json`.
- Useful diagnostics:

```bash
node scripts/auth.js accounts
node scripts/auth.js status --email user@example.com
node scripts/auth.js clear --email user@example.com
```
