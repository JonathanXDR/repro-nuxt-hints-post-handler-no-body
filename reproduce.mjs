// Headless reproduction for @nuxt/hints lazy-load POST 404.
// Starts the Nuxt dev server, waits until it is ready, then POSTs a valid
// lazy-load payload and prints the HTTP status. The handler stores the payload
// and sets status 201 but returns undefined, so h3's non-preemptive router
// falls through to Nuxt's page renderer and the response is 404.
import { spawn } from 'node:child_process'

const PORT = 41739
const URL = `http://localhost:${PORT}/__nuxt_hints/lazy-load`
const PAYLOAD = {
  id: 'demo',
  route: '/',
  state: { pageLoaded: true, hasReported: true, directImports: [] },
}

const dev = spawn('npx', ['nuxi', 'dev', '--port', String(PORT)], {
  stdio: ['ignore', 'inherit', 'inherit'],
  env: { ...process.env, PORT: String(PORT), NUXT_PORT: String(PORT) },
})

function cleanup(code) {
  try { dev.kill('SIGTERM') } catch {}
  setTimeout(() => process.exit(code), 300)
}

async function waitForReady() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/`)
      if (res.status < 500) return
    } catch {}
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('dev server did not become ready')
}

try {
  await waitForReady()
  // Give the dev server a moment to register the __nuxt_hints dev handler.
  await new Promise((r) => setTimeout(r, 2000))

  const post = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(PAYLOAD),
  })
  const postBody = await post.text()

  console.log('\n========== @nuxt/hints lazy-load repro ==========')
  console.log(`POST ${URL}`)
  console.log(`-> HTTP ${post.status} ${post.statusText}`)
  console.log(`-> body: ${postBody.slice(0, 200).replace(/\s+/g, ' ').trim()}`)

  // Prove the payload was still accepted and stored despite the 404.
  const get = await fetch(URL)
  const stored = await get.text()
  console.log(`\nGET ${URL} -> HTTP ${get.status}`)
  console.log(`-> stored entries: ${stored}`)

  const reproduced = post.status === 404 && stored.includes('demo')
  console.log('\nExpected: POST returns 201 Created and is treated as handled.')
  console.log(`Actual:   POST returns ${post.status} yet the payload was stored.`)
  console.log(reproduced ? 'BUG REPRODUCED: 404 on a stored POST.' : 'NOT REPRODUCED.')
  console.log('=================================================\n')

  cleanup(reproduced ? 0 : 1)
} catch (err) {
  console.error('repro error:', err)
  cleanup(1)
}
