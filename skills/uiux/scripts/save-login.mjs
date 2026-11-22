#!/usr/bin/env node
// Signs in through a login page and saves the session as a Playwright storage-state file, the
// shape check-render's --storage-state reads.
//   node save-login.mjs --url http://app.test/login --email someone@app.test --out admin.json
//        [--password <pw> | LOGIN_PASSWORD=<pw>] [--email-field css] [--password-field css] [--submit css]
// Save it right before each check-render batch: a server can drop a session within minutes.
// Handles email-first logins too: when no password field is visible, it submits the email,
// waits for the password step to appear, then submits again.
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

  const fill = ({ emailField, passwordField, email, password }) => {
    const set = (el, value) => {
      const proto = Object.getPrototypeOf(el);
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const visible = (el) => el && el.getClientRects().length > 0;
    const e = document.querySelector(emailField);
    const p = document.querySelector(passwordField);
    if (visible(e) && e.value !== email) set(e, email);
    if (visible(p)) set(p, password);
    return { email: visible(e), password: visible(p) };
  };
  const loginPath = new URL(url).pathname;
  const leftLogin = async (ticks) => {
    for (let i = 0; i < ticks; i++) {
      await sleep(250);
      const href = await page.eval('location.href').catch(() => '');
      if (href && new URL(href).pathname !== loginPath) return href;
    }
    return '';
  };

  const first = await page.eval(fill, { emailField, passwordField, email, password });
  if (!first.email && !first.password) throw new Error('No login fields found on ' + url + ' (pass --email-field / --password-field).');
  await page.eval((submit) => document.querySelector(submit)?.click(), submit);
  let landed = await leftLogin(first.password ? 40 : 12);

  if (!landed) {
    let second = { password: false };
    for (let i = 0; i < 20 && !second.password; i++) {
      await sleep(250);
      second = await page.eval(fill, { emailField, passwordField, email, password });
    }
    if (second.password) {
      await page.eval((submit) => document.querySelector(submit)?.click(), submit);
      landed = await leftLogin(40);
    }
  }
  if (!landed) throw new Error('Still on the login page after submitting: wrong credentials, a code or captcha step, or a different submit button (--submit).');

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
