// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',           // makes asset URLs relative (great for Pages)
  build: { outDir: 'docs' } // emit site into /docs
});
