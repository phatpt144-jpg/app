# Hướng dẫn deploy CyberFin lên hosting miễn phí

Cấu trúc dự án đã sẵn sàng chạy bằng **Vite**. Các file `App.jsx`, `HomeTab.jsx`,
`TransactionModule.jsx`, `StatsTab.jsx`, `DebtModule.jsx`, `AssetTab.jsx` nằm
trong `src/`. `manifest.json` + `service-worker.js` nằm trong `public/`.

## 0. Chuẩn bị icon
Bỏ 4 file PNG vào `public/icons/` theo đúng tên đã ghi trong
`public/icons/README.txt` (192/512, bản thường + bản maskable). Có thể tạo
nhanh bằng https://realfavicongenerator.net hoặc Figma/Canva.

## 1. Cài đặt & chạy thử local
```bash
npm install
npm run dev
```
Mở `http://localhost:5173` để xem thử. Sửa code xong, kiểm tra build production:
```bash
npm run build
npm run preview
```

## 2. Deploy lên Vercel (khuyên dùng — nhanh nhất)
1. Tạo tài khoản tại https://vercel.com (đăng nhập bằng GitHub).
2. Đẩy code lên 1 repo GitHub mới:
   ```bash
   git init
   git add .
   git commit -m "CyberFin PWA"
   git branch -M main
   git remote add origin https://github.com/<ten-ban>/cyberfin.git
   git push -u origin main
   ```
3. Vào Vercel → **Add New Project** → chọn repo vừa tạo.
4. Vercel tự nhận diện Vite: Build Command `npm run build`, Output Directory `dist`. Bấm **Deploy**.
5. Sau vài chục giây sẽ có link dạng `https://cyberfin-xxxx.vercel.app`.

## 3. Deploy lên Netlify (thay thế)
1. Tạo tài khoản tại https://netlify.com.
2. **Add new site → Import an existing project** → chọn repo GitHub.
3. Build command: `npm run build`, Publish directory: `dist`.
4. Bấm **Deploy site**, chờ có link dạng `https://cyberfin-xxxx.netlify.app`.

## 4. Deploy lên GitHub Pages (miễn phí, không cần tài khoản khác)
1. Cài plugin hỗ trợ route base:
   ```bash
   npm install gh-pages --save-dev
   ```
2. Trong `vite.config.js`, thêm `base: "/cyberfin/"` (đổi `cyberfin` thành tên repo GitHub của bạn):
   ```js
   export default defineConfig({
     plugins: [react()],
     base: "/cyberfin/",
   });
   ```
3. Thêm script vào `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && npx gh-pages -d dist"
   }
   ```
4. Chạy:
   ```bash
   npm run deploy
   ```
5. Vào Settings → Pages của repo, chọn nhánh `gh-pages` làm nguồn. Link sẽ là
   `https://<ten-ban>.github.io/cyberfin/`.

## 5. Cài lên điện thoại Android (PWA)
1. Mở link đã deploy bằng **Chrome trên Android**.
2. Chạm menu (⋮ ở góc phải) → **"Thêm vào Màn hình chính"** (Add to Home screen).
3. Xác nhận → icon CyberFin xuất hiện ngoài màn hình chính, mở lên chạy toàn
   màn hình như app thật (không thanh địa chỉ trình duyệt).
4. Dữ liệu (ví, giao dịch, nợ, vàng, kể cả ảnh hoá đơn) được lưu bằng
   **IndexedDB** ngay trên máy — tắt app, tắt máy, mất mạng vẫn còn nguyên khi
   mở lại. IndexedDB được chọn thay vì `localStorage` vì cho lưu dữ liệu lớn
   hơn nhiều (localStorage chỉ ~5-10MB, không đủ cho nhiều ảnh hoá đơn).

## Lưu ý quan trọng
- **HTTPS bắt buộc**: Service worker và "Thêm vào màn hình chính" chỉ hoạt
  động trên HTTPS (Vercel/Netlify/GitHub Pages đều tự có HTTPS miễn phí).
- Mỗi lần deploy bản mới, service worker dùng chiến lược *network-first* cho
  trang HTML nên người dùng sẽ tự động nhận bản cập nhật khi có mạng.
- Nếu đổi cấu trúc dữ liệu sau này, nên đổi `DB_VERSION`/`STATE_KEY` trong
  `src/storage.js` và viết thêm bước chuyển đổi dữ liệu cũ, để tránh xung đột
  với dữ liệu của người dùng đã cài đặt trước đó.
