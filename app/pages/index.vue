<script setup lang="ts">
const status = ref<number | null>(null)
const body = ref('')

async function send() {
  const res = await fetch('/__nuxt_hints/lazy-load', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'demo',
      route: '/',
      state: { pageLoaded: true, hasReported: true, directImports: [] },
    }),
  })
  status.value = res.status
  body.value = await res.text()
}
</script>

<template>
  <main>
    <h1>repro: @nuxt/hints lazy-load postHandler returns no body</h1>
    <p>
      Expected: <code>201 Created</code>. Actual: <code>404 Page not found</code> —
      the dev handler stored the payload, but h3 fell through to Nuxt's page
      renderer because the handler returned <code>undefined</code>.
    </p>
    <button @click="send">
      POST /__nuxt_hints/lazy-load
    </button>
    <pre v-if="status !== null">status: {{ status }}
body: {{ body }}</pre>
  </main>
</template>
