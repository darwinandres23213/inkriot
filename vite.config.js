import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: fileURLToPath(new URL('./frontend/', import.meta.url)),
  plugins: [react()],
  appType: 'mpa',
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
