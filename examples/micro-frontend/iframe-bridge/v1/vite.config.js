import { defineConfig } from 'vite';
export default defineConfig({ base: process.env.DEMO_BASE_PATH || '/', build: { rollupOptions: { input: ['index.html','child.html'] } } });
