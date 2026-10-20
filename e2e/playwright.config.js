// Runs against the app started locally (server: npm run dev:db, npm run seed, npm start;
// client: npm run dev). Accounts come from server/.env (npm run seed).
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env'), quiet: true });

// NFR-07 asks for Chrome, Firefox and Edge. Edge runs on this machine if it is installed;
// WebKit (Safari's engine) is added as an extra check.
const projects = [
  { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: process.env.E2E_NO_CHANNEL ? undefined : 'chrome' } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
].filter((p) => !(process.env.E2E_PROJECTS && !process.env.E2E_PROJECTS.split(',').includes(p.name)));

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90000,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173', trace: 'retain-on-failure' },
  projects,
});
