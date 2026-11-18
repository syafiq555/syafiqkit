#!/usr/bin/env node
// Screenshot a PostHog shared replay at chosen offsets, then pack the frames into contact sheets.
//
//   node capture.mjs --url <shared-replay-url> --t 272,280,842 [--out DIR] [--wait 6000]
//        [--width 1100] [--height 1000] [--clip x,y,w,h] [--per-sheet 6] [--playwright <path>]
//
// --t takes seconds from the recording's start (event time minus `start_time` from
// session-recording-get). The player starts playing from t, so the shot lands a few seconds
// after it. --playwright points at a project's node_modules/playwright when the script runs
// outside one. Sheets need ImageMagick's `montage`; without it the single frames are kept.

import {mkdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {join, resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}

const url = opt('url')
const offsets = (opt('t') ?? '').split(',').map((s) => s.trim()).filter(Boolean).map(Number)
if (!url || offsets.length === 0 || offsets.some((n) => !Number.isFinite(n) || n < 0)) {
  console.error('usage: node capture.mjs --url <shared-replay-url> --t 272,280,842 [--out DIR]')
  process.exit(2)
}

const out = resolve(opt('out', '/tmp/replay-frames'))
const wait = Number(opt('wait', '2000'))
const width = Number(opt('width', '1100'))
const height = Number(opt('height', '1000'))
const clipArg = opt('clip')
const perSheet = Number(opt('per-sheet', '6'))
const playwrightPath = opt('playwright')

const loadPlaywright = async () => {
  if (playwrightPath) return import(pathToFileURL(join(resolve(playwrightPath), 'index.mjs')).href)
  try {
    return await import('playwright')
  } catch {
    console.error('playwright not found: run inside a project that has it, or pass --playwright <node_modules/playwright>')
    process.exit(2)
  }
}

const withT = (base, t) => {
  const u = new URL(base)
  u.searchParams.set('t', String(Math.round(t)))
  return u.toString()
}

mkdirSync(out, {recursive: true})
const {chromium} = await loadPlaywright()
const browser = await chromium.launch()
const page = await browser.newPage({viewport: {width, height}})
const clip = clipArg
  ? (([x, y, w, h]) => ({x, y, width: w, height: h}))(clipArg.split(',').map(Number))
  : undefined

const frames = []
for (const t of offsets) {
  // networkidle never fires on the player, which keeps fetching while it plays.
  await page.goto(withT(url, t), {waitUntil: 'load', timeout: 60000})
  await page.waitForTimeout(1500)
  await page
    .getByText('Buffering', {exact: false})
    .waitFor({state: 'hidden', timeout: 45000})
    .catch(() => console.log(`frame ${t}s: still buffering after 45 s, shot taken anyway`))
  await page.waitForTimeout(wait)
  const file = join(out, `t${String(Math.round(t)).padStart(5, '0')}.png`)
  await page.screenshot({path: file, ...(clip ? {clip} : {})})
  frames.push(file)
  console.log(`frame ${t}s -> ${file}`)
}
await browser.close()

try {
  for (let i = 0; i < frames.length; i += perSheet) {
    const group = frames.slice(i, i + perSheet)
    const sheet = join(out, `sheet-${String(i / perSheet + 1).padStart(2, '0')}.png`)
    execFileSync('montage', [...group, '-tile', `${group.length}x1`, '-geometry', '+8+0', sheet], {
      stdio: 'ignore',
    })
    console.log(`sheet -> ${sheet}`)
  }
} catch {
  console.log('montage not available: open the single frames instead')
}
