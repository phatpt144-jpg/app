import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Base path khớp với tên repo GitHub thật: phatpt144-jpg/app
  // Nếu sau này đổi tên repo, hoặc deploy lên Vercel/Netlify, sửa/xoá dòng base này.
  base: "/app/",
});
