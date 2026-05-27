# Repro: `@nuxt/hints@1.1.2` POSTs to `/__nuxt_hints/lazy-load` 404 because the dev handler doesn't claim them

Minimal Nuxt 4 project showing that the dev-only `/__nuxt_hints/lazy-load`
endpoint accepts the POST body (data lands in the lazy-load store and the
DevTools panel sees it) but the HTTP response is `404 Page not found`.

## Steps to reproduce

```bash
npm install
npm run dev
```

1. Open the printed local URL.
2. Click **POST /__nuxt_hints/lazy-load** in the page.
3. Observe in the page output and the Network panel:

   ```
   POST /__nuxt_hints/lazy-load → 404 Page not found
   ```

4. Confirm the body was still received by running:

   ```bash
   curl http://localhost:3000/__nuxt_hints/lazy-load
   ```

   The response includes the just-posted `{ "payload": "demo" }` entry.

## Expected behaviour

`POST /__nuxt_hints/lazy-load` returns `201 Created` (with any body, even
`{}`) and h3 treats the request as handled.

## Actual behaviour

The dev handler stores the payload via `setResponseStatus(event, 201)` and
then returns `undefined`. h3's router was created without `preemptive: true`,
so an `undefined` return signals "not handled" and the request falls through
to Nuxt's page renderer, which 404s.

## Root cause

`node_modules/@nuxt/hints/dist/runtime/lazy-load/handlers.js`:

```js
export const postHandler = defineEventHandler(async (event) => {
  // …validate + store…
  setResponseStatus(event, 201)
  // implicit `return undefined`
})
```

combined with `node_modules/@nuxt/hints/dist/module.mjs`:

```js
function createHintsRouter() {
  const router = createRouter() // <- not preemptive
  router.post('/lazy-load', postHandler$1)
  // …
}
```

A `preemptive: true` router would claim the request even when the handler
returns nothing; alternatively the handler could `return null` (or `{}`) so
h3 recognises the response.

## Related upstream activity

- Open issue **[nuxt/hints#186](https://github.com/nuxt/hints/issues/186)** —
  same class of bug for the sibling `/__nuxt_hydration` POST endpoint
  (`FetchError: 400`). Confirms `nuxt-security` interaction.
- Open PR **[nuxt/hints#342](https://github.com/nuxt/hints/pull/342)** —
  *fix: correct router registration*. Splits the registration out of
  `setupDevToolsUI()` and adds `preemptive: true` to the sub-router, which
  resolves the symptom this repro shows.

This repro is a minimal, dependency-light demonstration of the same root
cause limited to `/__nuxt_hints/lazy-load`, which neither #186 nor #342
include.

## Environment

- `nuxt@4.4.6`
- `@nuxt/hints@1.1.2`
- `typescript@6.0.3`
- Node.js ≥ 20.19
