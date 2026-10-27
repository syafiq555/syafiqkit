# Read-only navigation over the DevTools protocol

For apps where REA's scenario clicks cannot reach a view (collapsed menus, handlers bound in script) and whose data endpoints take form posts. Node 22+ has `fetch` and `WebSocket` built in, so this needs no packages.

Save as `read.mjs` in a scratch folder outside the repo. Adjust `ALLOWED` to the target's own read functions, and `URL_PART` to match its page URL.

```js
const ALLOWED = /^list[A-Za-z]+\(\)$|^view[A-Za-z]+\((?:'[0-9A-Za-z_-]*'|"[0-9A-Za-z_-]*"|[0-9A-Za-z_-]*)\)$/;
const URL_PART = 'example.com/app';
const [,, call, waitMs = '5000', selector = 'body'] = process.argv;
if (!ALLOWED.test(call)) { console.error('only whitelisted read calls'); process.exit(2); }
const page = (await (await fetch('http://127.0.0.1:9222/json')).json())
  .find(t => t.type === 'page' && t.url.includes(URL_PART));
if (!page) { console.error(`no open tab matching ${URL_PART}; is the user logged in in the debug window?`); process.exit(3); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const waiting = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); waiting.get(m.id)?.(m); waiting.delete(m.id); };
const send = (method, params) => new Promise(r => { waiting.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await new Promise(r => ws.onopen = r);
await send('Runtime.evaluate', { expression: call });
await new Promise(r => setTimeout(r, +waitMs));
const res = await send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(selector)})?.innerText`, returnByValue: true });
console.log(res.result?.result?.value ?? '');
ws.close();
```

The whitelist is only as read-only as the app's naming: before adding a function to it, read its body in the saved scripts and confirm it only fetches and renders. `ECONNREFUSED` means the debug window isn't running.

Usage: `node read.mjs "listInvoices()" 6000 "#content"`, then pull row ids for detail views with a read-only DOM query, e.g. collecting the `onclick` attributes of rows. A list that renders empty may need a longer wait or a filter left over from the last view; a report that renders empty may need regenerating, which is a write, so skip it.

zsh notes: quote the call, and don't put `====` separators in commands (zsh expands a leading `=`).
