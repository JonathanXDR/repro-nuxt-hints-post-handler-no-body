<script setup lang="ts">
async function send() {
  const res = await fetch('/__nuxt_hints/lazy-load', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: 'demo' }),
  })
  // Expected: 201 Created with JSON body
  // Actual:   404 "Page not found"
  console.log('status', res.status)
  console.log('body', await res.text())
}
</script>

<template>
  <div>
    <p>repro: @nuxt/hints postHandler returns undefined → h3 falls through to 404</p>
    <button @click="send">
      POST /__nuxt_hints/lazy-load
    </button>
  </div>
</template>
