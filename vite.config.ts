import { existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * `npm run dev:mock` only: loads a local, gitignored preview layer (src/mocks)
 * before the app. Does nothing if that folder is absent or in any other mode.
 */
function localPreview(mode: string): Plugin | false {
  const entry = 'src/mocks/install.ts'
  if (mode !== 'mock' || !existsSync(entry)) return false
  return {
    name: 'local-preview',
    apply: 'serve',
    transformIndexHtml: () => [{ tag: 'script', attrs: { type: 'module', src: `/${entry}` }, injectTo: 'head-prepend' }],
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), localPreview(mode)],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
