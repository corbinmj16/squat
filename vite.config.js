import { defineConfig } from 'vite'

export default defineConfig({
  base: '/squat/', // IMPORTANT for GitHub Pages
  build: {
    assetsDir: '' // Put assets in root of dist instead of /assets subfolder
  }
})
