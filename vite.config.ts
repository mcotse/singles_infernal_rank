import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/singles_infernal_rank/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    strictPort: false,
  },
})
