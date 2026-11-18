#!/usr/bin/env node
// Screenshot a PostHog shared replay at chosen offsets, then pack the frames into contact sheets.
//
//   node capture.mjs --url <shared-replay-url> --t 272,280,842 --playwright <node_modules/playwright>
//        [--out DIR] [--wait 2000] [--width 1100] [--height 1000] [--clip x,y,w,h] [--per-sheet 6]
//
// --t takes seconds from the recording's start (event time minus `start_time` from
// session-recording-get). Each shot lands about 3.5 s after t plus load and buffering time,
// because the player starts playing from t. --playwright points at a project's
// node_modules/playwright; without it the script looks for one under the current directory.
// Sheets need ImageMagick's `montage`; without it the single frames are kept.

import {existsSync, mkdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {join, resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const args = process.argv.slice(2)
const fail = (msg) => {
  console.error(msg)
  process.exit(2)
}
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return fallback
  const value = args[i + 1]
  if (value === undefined || value.startsWith('--')) fail(`--${name} needs a value`)
  return value
}
const num = (name, fallback) => {
  const n = Number(opt(name, fallback))
  if (!Number.isFinite(n) || n < 0) fail(`--${name} must be a number`)
  return n
}

const url = opt('url')
const offsets = (opt('t') ?? '').split(',').map((s) => s.trim()).filter(Boolean).map(Number)
if (!url || offsets.length === 0 || offsets.some((n) => !Number.isFinite(n) || n < 0)) {
  fail('usage: node capture.mjs --url <shared-replay-url> --t 272,280,842 --playwright <node_modules/playwright>')
}

const out = resolve(opt('out', '/tmp/replay-frames'))
const wait = num('wait', '2000')
const width = num('width', '1100')
const height = num('height', '1000')
const perSheet = Math.max(1, Math.floor(num('per-sheet', '6')))
const clipArg = opt('clip')
let clip
if (clipArg) {
  const parts = clipArg.split(',').map(Number)
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) fail('--clip takes x,y,width,height')
  const [x, y, w, h] = parts
  clip = {x, y, width: w, height: h}
}

const loadPlaywright = async () => {
  const given = opt('playwright')
  if (given) {
    const entry = join(resolve(given), 'index.mjs')
    if (!existsSync(entry)) fail(`no Playwright at ${given} (expected ${entry})`)
    return import(pathToFileURL(entry).href)
  }
  try {
    const found = createRequire(join(process.cwd(), 'noop.js')).resolve('playwright')
    return import(pathToFileURL(found).href)
  } catch {
    fail('Playwright not found under the current directory: pass --playwright <project>/node_modules/playwright')
  }
}

const withT = (base, t) => {
  const u = new URL(base)
  u.searchParams.set('t', String(Math.round(t)))
  return u.toString()
}

mkdirSync(out, {recursive: true})
const playwright = await loadPlaywright()
const chromium = playwright.chromium ?? playwright.default?.chromium
const browser = await chromium.launch()
const frames = []
try {
  const page = await browser.newPage({viewport: {width, height}})
  for (const t of offsets) {
    // networkidle never fires on the player, which keeps fetching while it plays.
    await page.goto(withT(url, t), {waitUntil: 'load', timeout: 60000})
    await page.waitForTimeout(1500)
    await page
      .getByText('Buffering', {exact: false})
      .waitFor({state: 'hidden', timeout: 45000})
      .catch(() => console.log(`frame ${t}s: still buffering after 45 s, shot taken anyway`))
    await page.waitForTimeout(wait)
    const file = join(out, `t${String(t).replace('.', '_').padStart(5, '0')}.png`)
    await page.screenshot({path: file, ...(clip ? {clip} : {})})
    frames.push(file)
    console.log(`frame ${t}s -> ${file}`)
  }
} finally {
  await browser.close()
}

let hasMontage = true
try {
  execFileSync('montage', ['-version'], {stdio: 'ignore'})
} catch {
  hasMontage = false
  console.log('montage not available: open the single frames instead')
}
if (hasMontage) {
  for (let i = 0; i < frames.length; i += perSheet) {
    const group = frames.slice(i, i + perSheet)
    const sheet = join(out, `sheet-${String(i / perSheet + 1).padStart(2, '0')}.png`)
    try {
      execFileSync('montage', [...group, '-tile', `${group.length}x1`, '-geometry', '+8+0', sheet], {
        stdio: ['ignore', 'ignore', 'pipe'],
      })
      console.log(`sheet -> ${sheet}`)
    } catch (error) {
      console.log(`sheet ${sheet} failed: ${String(error.stderr ?? error.message).trim().split('\n')[0]}`)
    }
  }
}
