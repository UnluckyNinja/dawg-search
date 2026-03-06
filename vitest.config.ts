import { defineConfig } from "vitest/config";
import codspeedPlugin from "@codspeed/vitest-plugin";

export default defineConfig({
  // plugins: [codspeedPlugin()],
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