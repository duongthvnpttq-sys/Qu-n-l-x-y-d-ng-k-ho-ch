import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Chia nhỏ các thư viện nặng thành các khối riêng biệt
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
    // 2. Điều chỉnh giới hạn cảnh báo kích thước khối (đơn vị: kB)
    chunkSizeWarningLimit: 2000, 
  },
});
