import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3100", channel: "chrome", viewport: {width:1536,height:960}, trace: "retain-on-failure" },
  webServer: {
    command: "npm.cmd run start -- --port 3100",
    url: "http://127.0.0.1:3100/login",
    timeout: 60000,
    reuseExistingServer: false,
    env: { DEMO_MODE: "true", BYTEFX_DATA_NAMESPACE: `e2e-${Date.now()}` },
  },
});
