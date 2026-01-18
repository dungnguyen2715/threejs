import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()],
  server: {
    port: 5174, // Ép chạy đúng 5174
    strictPort: true, // Nếu 5174 bận thì báo lỗi chứ không nhảy sang cổng khác
    host: true,
    open: true
  }
});