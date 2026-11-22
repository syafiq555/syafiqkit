#!/usr/bin/env node
// Signs in through a login page and saves the session as a Playwright storage-state file, the
// shape check-render's --storage-state reads.
//   node save-login.mjs --url http://app.test/login --email someone@app.test --out admin.json
//        [--password <pw> | LOGIN_PASSWORD=<pw>] [--email-field css] [--password-field css] [--submit css]
// Save it right before each check-render batch: a server can drop a session within minutes.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Browser, sleep } from '../app-kit/scripts/lib/cdp.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback = '') => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const url = flag('url');
const email = flag('email');
const password = flag('password', process.env.LOGIN_PASSWORD || '');
const out = flag('out');
const emailField = flag('email-field', 'input[type=email], input[name=email], input[name=username]');
const passwordField = flag('password-field', 'input[type=password]');
const submit = flag('submit', 'button[type=submit], input[type=submit]');

if (!url || !email || !password || !out) {
  console.error('usage: node save-login.mjs --url <login page> --email <login> --out <file.json> [--password <pw> | LOGIN_PASSWORD=<pw>] [--email-field css] [--password-field css] [--submit css]');
  process.exit(2);
}

const browser = await Browser.launch({ extraArgs: ['--ignore-certificate-errors'] });
try {
  const page = await browser.newPage({ width: 1280, height: 800 });
  await page.goto(url, { settleMs: 800 });

  const filled = await page.eval(({ emailField, passwordField, email, password }) => {
    const set = (el, value) => {
      const proto = Object.getPrototypeOf(el);
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const e = document.querySelector(emailField);
    const p = document.querySelector(passwordField);
    if (!e || !p) return false;
    set(e, email);
    set(p, password);
    return true;
  }, { emailField, passwordField, email, password });
  if (!filled) throw new Error('No login fields found on ' + url + ' (pass --email-field / --password-field).');

  await page.eval((submit) => document.querySelector(submit)?.click(), submit);

  const loginPath = new URL(url).pathname;
  let landed = '';
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    landed = await page.eval('location.href').catch(() => '');
    if (landed && new URL(landed).pathname !== loginPath) break;
  }
  if (!landed || new URL(landed).pathname === loginPath) throw new Error('Still on the login page after submitting: wrong credentials, a second step, or a different submit button (--submit).');

  const { cookies } = await browser.send('Storage.getCookies');
  const origin = new URL(landed).origin;
  const localStorage = await page.eval(() => Object.entries(window.localStorage).map(([name, value]) => ({ name, value })));
  const state = {
    cookies: cookies.map((c) => ({ name: c.name, value: c.value, domain: c.domain, path: c.path, expires: c.expires ?? -1, httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite || 'Lax' })),
    origins: localStorage.length ? [{ origin, localStorage }] : [],
  };
  writeFileSync(resolve(out), JSON.stringify(state, null, 2));
  console.log(`saved ${state.cookies.length} cookies${localStorage.length ? ` and ${localStorage.length} localStorage items` : ''} to ${out} (signed in at ${landed})`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
