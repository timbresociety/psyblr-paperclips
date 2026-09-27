#!/usr/bin/env node
/**
 * SoloUnicorn asset pipeline — share-link puller.
 *
 * Renders a public ChatGPT conversation-share page in local headless Chrome
 * (no auth required for public shares), finds the full-resolution generated
 * image, and downloads it.
 *
 * Usage: node scripts/asset_pipeline/pull.mjs <shareUrl> <outPath> [--index N]
 *   --index N  pick the Nth large image on the page (default 0 = largest),
 *              for shares whose conversation holds multiple generations.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { spawn, execSync } from 'node:child_process'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9224

const args = process.argv.slice(2)
const shareUrl = args[0]
const outPath = args[1]
const idxFlag = args.indexOf('--index')
const imageIndex = idxFlag >= 0 ? parseInt(args[idxFlag + 1], 10) : 0
const allMode = args.includes('--all') // outPath becomes a directory
const atFlag = args.indexOf('--at')
const atFraction = atFlag >= 0 ? parseFloat(args[atFlag + 1]) : null // hold one scroll position (virtualized pages)

if (!shareUrl || !outPath || !/^https:\/\/chatgpt\.com\/share\//.test(shareUrl)) {
  console.error('usage: pull.mjs <https://chatgpt.com/share/...> <outPath> [--index N]')
  process.exit(2)
}

// Launch a throwaway headless Chrome with CDP.
const profileDir = `/tmp/solounicorn-pull-${process.pid}`
const chrome = spawn(
  CHROME,
  [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--window-size=1400,900', `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`, 'about:blank',
  ],
  { stdio: 'ignore' },
)
const cleanup = () => {
  try { chrome.kill('SIGKILL') } catch {}
  try { execSync(`rm -rf ${profileDir}`) } catch {}
}
process.on('exit', cleanup)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Wait for CDP to come up.
let base = `http://127.0.0.1:${PORT}`
let ready = false
for (let i = 0; i < 20 && !ready; i++) {
  await sleep(500)
  try { await fetch(`${base}/json/version`); ready = true } catch {}
}
if (!ready) { console.error('chrome CDP never came up'); process.exit(1) }

const tgt = await (await fetch(`${base}/json/new?${encodeURIComponent(shareUrl)}`, { method: 'PUT' })).json()
const ws = new WebSocket(tgt.webSocketDebuggerUrl)
let id = 0
const pend = new Map()
await new Promise((r) => (ws.onopen = r))
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) }
}
const send = (method, params = {}) =>
  new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const evaljs = async (expr) =>
  (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value

await send('Page.enable')

// Poll for large generated images (full-res files live on oaiusercontent).
let urls = null
let prevCount = -1
for (let i = 0; i < 30; i++) {
  await sleep(1500)
  // scroll so lazy images hydrate; with --at, hold one position (virtualized DOM windows)
  const frac = atFraction ?? (i % 6) / 5
  await evaljs(`(() => {
    const scrollers = [...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 200)
    const sc = scrollers.sort((a, b) => b.scrollHeight - a.scrollHeight)[0]
    if (sc) sc.scrollTop = (sc.scrollHeight - sc.clientHeight) * ${frac}
    else window.scrollTo(0, document.body.scrollHeight * ${frac})
  })()`)
  if (urls?.length && urls.length === prevCount && i > 10) break
  prevCount = urls?.length ?? -1
  urls = await evaljs(`(() => {
    // DOM order == chronological order in the conversation, so --index N is stable.
    const imgs = [...document.querySelectorAll('img')]
      .filter(i => i.naturalWidth >= 512 && /oaiusercontent|files\\./.test(i.src))
    return imgs.map(i => i.src)
  })()`)
}
ws.close()

if (!urls?.length) { console.error('no generated image found on share page'); process.exit(1) }
if (allMode) {
  mkdirSync(outPath, { recursive: true })
  let n = 0
  for (const u of urls) {
    const res = await fetch(u)
    if (!res.ok) continue
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(`${outPath}/cand_${n}.png`, buf)
    console.log(`pulled cand_${n}.png (${buf.length} bytes)`)
    n++
  }
  console.log(`pulled ${n}/${urls.length} candidates -> ${outPath}`)
} else {
  if (imageIndex >= urls.length) {
    console.error(`--index ${imageIndex} out of range: page has ${urls.length} large image(s)`)
    process.exit(1)
  }
  const res = await fetch(urls[imageIndex])
  if (!res.ok) { console.error(`download failed: HTTP ${res.status}`); process.exit(1) }
  const buf = Buffer.from(await res.arrayBuffer())
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, buf)
  console.log(`pulled ${buf.length} bytes -> ${outPath} (${urls.length} candidate image(s) on page)`)
}
cleanup()
process.exit(0)
