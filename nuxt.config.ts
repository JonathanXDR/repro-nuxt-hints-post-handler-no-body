export default defineNuxtConfig({
  compatibilityDate: '2026-03-21',
  modules: ['@nuxt/hints'],

  // Enable the dev feature whose `postHandler` exhibits the bug. With
  // `devtools: true`, every report triggers a POST to
  // `/__nuxt_hints/lazy-load` from the client plugin
  // (node_modules/@nuxt/hints/dist/runtime/lazy-load/plugin.client.js).
  hints: {
    features: {
      lazyLoad: {
        logs: false,
        devtools: true,
      },
    },
  },
})
