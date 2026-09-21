import { defineConfig } from 'tsx/config';
export default defineConfig({
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'node',
    esModuleInterop: true,
    skipLibCheck: true,
  },
});
