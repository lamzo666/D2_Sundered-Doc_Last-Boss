// vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',                // makes asset URLs relative (great for Pages)
  build: { outDir: 'docs' }, // emit site into /docs
  plugins: [
    VitePWA({
      // Ship the latest build without users needing to hard-refresh. Safe now
      // that the dial persists — a reload restores whatever was on screen.
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: false,       // we hand-maintain public/site.webmanifest
      workbox: {
        // The whole site is ~2MB, so precache all of it: the map and dial art
        // are exactly what you need when the connection drops mid-raid.
        globPatterns: ['**/*.{html,css,js,png,jpg,ico,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      },
      devOptions: { enabled: false }
    })
  ],
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
    setupFiles: ['test/setup.js']
  }
});
