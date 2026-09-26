import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: path.resolve(
        process.cwd(),
        'views/app.html'
      )
    }
  }
})