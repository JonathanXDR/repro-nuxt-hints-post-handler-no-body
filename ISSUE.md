# `POST /__nuxt_hints/lazy-load` returns 404 even though the payload is stored

### Environment

- Nuxt 4.4.6 (Nitro 2.13.4, Vite 7.3.6, Vue 3.5.39)
- `@nuxt/hints` 1.1.2
- Node.js 20.19+
- Reproduced native-free in a WebContainer (StackBlitz) and locally with plain npm

### Reproduction

https://stackblitz.com/github/JonathanXDR/repro-nuxt-hints-post-handler-no-body

### Describe the bug

The dev-only `/__nuxt_hints/lazy-load` POST endpoint accepts and stores the payload, but the HTTP response is `404 Page not found`. The request falls through to Nuxt's page renderer instead of being treated as handled.

Observed proof from `node reproduce.mjs`:

```
POST http://localhost:41739/__nuxt_hints/lazy-load
-> HTTP 404 Page not found: /__nuxt_hints/lazy-load
-> body: { "error": true, "statusCode": 404, "statusMessage": "Page not found: /__nuxt_hints/lazy-load", ... }

GET http://localhost:41739/__nuxt_hints/lazy-load -> HTTP 200
-> stored entries: [{"id":"demo","route":"/","state":{"pageLoaded":true,"hasReported":true,"directImports":[]}}]
```

The dev log also shows `[Vue Router warn]: No match found for location with path "/__nuxt_hints/lazy-load"`, confirming the POST reached the client router after the server handler silently ran.

The client plugin (`runtime/lazy-load/plugin.client.js`) fires this POST automatically for every lazy-load report, so the console fills with 404s during normal dev usage even though the DevTools panel still receives the data.

### Expected behavior

`POST /__nuxt_hints/lazy-load` returns `201 Created` (with any body, even `{}`) and h3 treats the request as handled, so it never reaches the page renderer.

### Additional context

Root cause is a non-preemptive h3 router combined with a handler that returns `undefined`.

`dist/runtime/lazy-load/handlers.js` line 33: `postHandler` calls `setResponseStatus(event, 201)` and then implicitly returns `undefined`:

```js
export const postHandler = defineEventHandler(async (event) => {
  const body = await readBody(event)
  // ...validate and store...
  setResponseStatus(event, 201)
  // implicit `return undefined`
})
```

`dist/module.mjs` line 18: `createHintsRouter()` builds the router with `createRouter()` and no `preemptive: true`:

```js
function createHintsRouter() {
  const router = createRouter() // not preemptive
  // ...
  router.post('/lazy-load', postHandler$1) // line 23
  // ...
}
```

With a non-preemptive h3 router, a handler that returns `undefined` signals "not handled", so the router does not claim the request and it falls through to Nuxt's catch-all page route, which 404s. The same shape affects the sibling `/hydration` and `/html-validate` POST handlers registered in the same router.

A fix is either to add `preemptive: true` to the router in `createHintsRouter()`, or to make `postHandler` return a concrete value such as `null` or `{}` so h3 recognises the response.
