# Repro: `@nuxt/hints@1.1.2` `POST /__nuxt_hints/lazy-load` returns 404

Minimal Nuxt 4 project showing that the dev-only `/__nuxt_hints/lazy-load`
endpoint accepts and stores the POST body (the data lands in the lazy-load store
and the DevTools panel sees it) but the HTTP response is `404 Page not found`.

## Reproduce

On StackBlitz: https://stackblitz.com/github/JonathanXDR/repro-nuxt-hints-post-handler-no-body

Locally:

```bash
npm install
npm run repro
```

`npm run repro` runs `node reproduce.mjs`, which boots `nuxi dev`, POSTs a valid
lazy-load payload to `/__nuxt_hints/lazy-load`, and prints the result:

```
POST http://localhost:41739/__nuxt_hints/lazy-load
-> HTTP 404 Page not found: /__nuxt_hints/lazy-load

GET http://localhost:41739/__nuxt_hints/lazy-load -> HTTP 200
-> stored entries: [{"id":"demo","route":"/", ... }]
```

The POST 404s, yet the GET proves the payload was stored. The dev log also emits
`[Vue Router warn]: No match found for location with path "/__nuxt_hints/lazy-load"`,
confirming the request fell through to Nuxt's page renderer.

The interactive page (`app/pages/index.vue`) does the same POST from a button if
you prefer to reproduce it in the browser with `npm run dev`.

## Expected behaviour

`POST /__nuxt_hints/lazy-load` returns `201 Created` (with any body, even `{}`)
and h3 treats the request as handled.

## Root cause

`node_modules/@nuxt/hints/dist/runtime/lazy-load/handlers.js` line 33:

```js
export const postHandler = defineEventHandler(async (event) => {
  // ...validate and store...
  setResponseStatus(event, 201)
  // implicit `return undefined`
})
```

combined with `node_modules/@nuxt/hints/dist/module.mjs` line 18:

```js
function createHintsRouter() {
  const router = createRouter() // not preemptive
  router.post('/lazy-load', postHandler$1)
  // ...
}
```

A non-preemptive h3 router treats an `undefined` return as "not handled", so the
request falls through to Nuxt's catch-all page route. A `preemptive: true` router
would claim the request even when the handler returns nothing. Alternatively the
handler could `return null` (or `{}`) so h3 recognises the response.

## Environment

- `nuxt@4.4.6`
- `@nuxt/hints@1.1.2`
- `typescript@6.0.3`
- Node.js >= 20.19
