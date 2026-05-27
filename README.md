# Repro: `@nuxt/hints@1.1.2` `postHandler` returns no body → 404 page-not-found

Minimal Nuxt 4 project showing that the dev-only `/__nuxt_hints/lazy-load` endpoint stores the POST body but the response falls through to Nuxt's page renderer because the handler returns `undefined`.

## What you should see

1. `npm run dev`
2. Open the page, click the button.
3. Network panel shows:

```
POST /__nuxt_hints/lazy-load → 404 Page not found
```

Yet the payload is intact: a subsequent `GET /__nuxt_hints/lazy-load` returns the stored payload.

## Why it fails

`node_modules/@nuxt/hints/dist/runtime/.../postHandler` ends with:

```js
setResponseStatus(event, 201)
// implicit `return undefined`
```

In h3, returning `undefined` from a handler signals "I did not handle this request," so h3 hands the request off to the next matching route — Nuxt's page renderer, which 404s.

## Workaround

There is no good user-land workaround; the dev handler must return *something*. We simply tolerate the dev-console 404 noise.

## Ask

Return an explicit body (`{}` is enough) from `postHandler` after `setResponseStatus(event, 201)`, so h3 treats the request as handled.

## Versions

- `nuxt@4.4.6`
- `@nuxt/hints@1.1.2`
