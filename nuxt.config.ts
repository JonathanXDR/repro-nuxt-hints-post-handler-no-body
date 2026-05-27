export default defineNuxtConfig({
  compatibilityDate: '2026-03-21',
  modules: ['@nuxt/hints'],

  // Enable the dev features whose `postHandler` exhibits the bug.
  hints: {
    features: {
      lazyLoad: {
        logs: false,
        devtools: true,
      },
      webVitals: true,
    },
  },
})
