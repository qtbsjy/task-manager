<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <nav class="topnav">
      <RouterLink to="/" class="brand">📋 任务管理</RouterLink>
    </nav>

    <main class="wrap">
      <RouterView />
    </main>

    <footer>布鲁的 TS 任务管理 · 第七个作品 🐾</footer>
  </div>
</template>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
.topnav {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center;
  padding: 14px 24px; background: rgba(15,23,42,.9); backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.brand { font-size: 17px; font-weight: 700; color: #e2e8f0; text-decoration: none; }
.wrap { flex: 1; max-width: 860px; margin: 0 auto; padding: 32px 24px; width: 100%; }
footer { text-align: center; color: #64748b; font-size: 13px; padding: 24px 0; }
</style>
