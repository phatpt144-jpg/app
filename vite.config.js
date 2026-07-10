import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Đổi "cyberfin" thành đúng tên repo GitHub của bạn.
  // Nếu deploy lên Vercel/Netlify (không phải GitHub Pages), xoá dòng base này đi.
  base: "/cyberfin/",
});
