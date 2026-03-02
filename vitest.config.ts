import { defineConfig } from "vitest/config";

export default defineConfig({
  test:{
    watch: false,
    fileParallelism: false,
    // pool: 'threads',
    // execArgv: [
    //   '--cpu-prof',
    //   '--cpu-prof-dir=test-runner-profile',
    // ],
  }
});