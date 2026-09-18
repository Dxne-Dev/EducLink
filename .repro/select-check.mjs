// Diagnostic: inspect + screenshot the role <select> on /signup before/after picking a role.
import { writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const DEBUG_PORT = 9223
const OUT = new URL('.', import.meta.url).pathname

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--user-data-dir=C:\\Dev\\LCS-LIBRARY\\edulink\\.repro\\chrome-profile',
  'about:blank',
], { stdio: 'ignore' })

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

// Discover the debugger WS endpoint
let list
for (let i = 0; i < 40; i++) {
  try { list = await getJson(`http://127.0.0.1:${DEBUG_PORT}/json/list`); if (list.length) break } catch { /* retry */ }
  await sleep(250)
}
const page = list.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

let msgId = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
}
function send(method, params = {}) {
  const id = ++msgId
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function evaluate(expression) {
  const { result } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error('Eval error: ' + JSON.stringify(result.exceptionDetails))
  return result.result?.value
}

async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${OUT}${name}.png`, Buffer.from(data, 'base64'))
  console.log(`saved ${name}.png`)
}

try {
  await send('Page.enable')
  await send('Runtime.enable')
  console.log('navigating to /signup ...')
  await send('Page.navigate', { url: 'http://localhost:3100/signup' })
  await sleep(6000)

  const probe = await evaluate(`(() => {
    const sel = document.querySelector('select#role')
    if (!sel) return { error: 'no select#role found' }
    const cs = getComputedStyle(sel)
    const opt = sel.options[sel.selectedIndex]
    const allOpts = [...sel.options].map(o => ({ text: o.text, value: o.value, disabled: o.disabled, hidden: o.hidden, selected: o.selected }))
    return {
      value: sel.value,
      selectedIndex: sel.selectedIndex,
      optionCount: sel.options.length,
      allOpts,
      matchingOption: opt ? opt.text : null,
      computed: {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        height: cs.height,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        appearance: cs.appearance || cs.webkitAppearance,
        opacity: cs.opacity,
      },
      outerHTML: sel.outerHTML,
    }
  })()`)
  console.log('--- INITIAL STATE ---')
  console.log(JSON.stringify(probe, null, 2))
  await screenshot('before')

  // Simulate the user picking "Étudiant" through the native select + change event
  const afterPick = await evaluate(`(async () => {
    const sel = document.querySelector('select#role')
    sel.value = 'student'
    sel.dispatchEvent(new Event('input', { bubbles: true }))
    sel.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 800))
    const cs = getComputedStyle(sel)
    const opt = sel.options[sel.selectedIndex]
    const allOpts = [...sel.options].map(o => ({ text: o.text, value: o.value, disabled: o.disabled, hidden: o.hidden, selected: o.selected }))
    return {
      value: sel.value,
      selectedIndex: sel.selectedIndex,
      optionCount: sel.options.length,
      allOpts,
      matchingOption: opt ? opt.text : null,
      textContent: sel.textContent,
      outerHTML: sel.outerHTML,
      computed: { color: cs.color, backgroundColor: cs.backgroundColor, fontSize: cs.fontSize, lineHeight: cs.lineHeight, height: cs.height, opacity: cs.opacity },
    }
  })()`)
  console.log('--- AFTER PICKING A ROLE (native change dispatched) ---')
  console.log(JSON.stringify(afterPick, null, 2))
  await screenshot('after')

  // React controlled value check: does state follow (check select DOM value again)
  const stateCheck = await evaluate(`(() => {
    const sel = document.querySelector('select#role')
    return { value: sel.value, selectedIndex: sel.selectedIndex, selectedText: sel.options[sel.selectedIndex]?.text ?? null }
  })()`)
  console.log('--- FINAL DOM STATE ---')
  console.log(JSON.stringify(stateCheck, null, 2))
} finally {
  ws.close()
  chrome.kill()
  process.exit(0)
}