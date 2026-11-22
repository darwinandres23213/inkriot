import { defineConfig } from '@playwright/test';

const port = 4380;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    viewport: { width: 1280, height: 820 },
    reducedMotion: 'reduce',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'api', testDir: './backend/tests', testMatch: '**/*.spec.js' },
    { name: 'editor', testDir: './frontend/src/modules/shirt-designer/tests', testMatch: '**/*.spec.js' },
    { name: 'lookbook', testDir: './frontend/src/modules/lookbook/tests', testMatch: '**/*.spec.js' },
  ],
  webServer: {
    command: 'npm start',
    url: baseURL + '/api/shirt-designer/presets',
    env: {
      HOST: '127.0.0.1', PORT: String(port),
      SHIRT_SERVICE_HOST: '127.0.0.1', SHIRT_SERVICE_PORT: '4381', SHIRT_SERVICE_URL: 'http://127.0.0.1:4381',
      LOOKBOOK_SERVICE_HOST: '127.0.0.1', LOOKBOOK_SERVICE_PORT: '4382', LOOKBOOK_SERVICE_URL: 'http://127.0.0.1:4382',
    },
    timeout: 30_000,
  },
});
