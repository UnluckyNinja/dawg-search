import { defineConfig } from 'tsdown'

export default defineConfig({
  exports: {
    all: true,
    devExports: true,
  },
  // ...config options
  minify: 'dce-only',
})
