import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Filenames are pinned (no content hash) so the Squarespace Code Block's
// <script src> / <link href> never has to change between deploys —
// just rebuild and re-upload to wherever you're hosting dist/.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 3000
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'seat-chart.js',
        chunkFileNames: 'seat-chart.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'seat-chart.css'
          return 'seat-chart.[ext]'
        }
      }
    }
  }
})
