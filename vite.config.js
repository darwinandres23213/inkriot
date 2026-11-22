import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: fileURLToPath(new URL('./frontend/', import.meta.url)),
  publicDir: 'assets/public',
  plugins: [react()],
  appType: 'mpa',
  // Three and its GLTF loader ship native ES modules. Serve them directly in development.
  optimizeDeps: { exclude: ['three'] },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'three-core', test: /[\\/]three[\\/]build[\\/]three\.core\.js$/ }],
        },
      },
    },
  },
});
