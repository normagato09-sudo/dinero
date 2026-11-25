import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Versión = commit que despliega Vercel. Sirve para que la app se actualice sola.
  define: { __VERSION__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || 'local') },
})
