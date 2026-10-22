import { defineConfig } from 'vite';
export default defineConfig({ base: process.env.DEMO_BASE_PATH || '/', build: { outDir: 'dist' } });
