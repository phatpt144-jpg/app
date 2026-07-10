# Hướng dẫn build APK Android (dùng Capacitor)

App đã có sẵn `capacitor.config.ts` và script trong `package.json`. Cách này
đóng gói y nguyên bản build web (`dist/`) thành 1 app Android **thật**, chạy
độc lập, không cần internet, không cần host web ở đâu cả (dữ liệu vẫn lưu
bằng `localStorage`/WebView storage ngay trên máy).

## Yêu cầu cài trước (làm 1 lần trên máy tính của bạn)
- **Node.js** (đã có sẵn nếu bạn chạy được `npm run dev`).
- **Android Studio** (tải tại https://developer.android.com/studio) — cài kèm
  Android SDK. Mở Android Studio ít nhất 1 lần để nó tự tải SDK + Gradle.
- Trên máy Windows/Mac/Linux đều được, không cần máy Mac.

## Các bước

### 1. Cài dependency
```bash
npm install
```
(lệnh này đã có sẵn `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`
trong `package.json`, không cần cài thêm gì khác)

### 2. Build bản web
```bash
npm run build
```
Lệnh này tạo thư mục `dist/` — đây là "web app" mà Capacitor sẽ nhúng vào
Android.

### 3. Tạo project Android (chỉ làm 1 lần)
```bash
npm run android:add
```
Lệnh này tạo ra thư mục `android/` — đây chính là project Android Studio
thật, bạn có thể mở bằng Android Studio, sửa icon/tên/màu splash screen ở đây
nếu muốn.

### 4. Đồng bộ code web → Android
Mỗi lần sửa code React xong, chạy lại lệnh này để cập nhật vào app Android:
```bash
npm run android:sync
```

### 5. Mở Android Studio để build APK
```bash
npm run android:open
```
Android Studio sẽ tự mở project `android/`. Trong Android Studio:
- Vào menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
- Đợi build xong, bấm **locate** trong thông báo góc dưới phải để tìm file
  APK, thường nằm ở:
  `android/app/build/outputs/apk/debug/app-debug.apk`
- Copy file `.apk` này qua điện thoại (qua cáp USB, Zalo, Google Drive...) rồi
  mở lên cài. Nếu Android chặn "cài từ nguồn không xác định", vào
  **Cài đặt → Bảo mật → Cho phép cài đặt ứng dụng không rõ nguồn gốc** rồi thử
  lại.

### 6. (Tuỳ chọn) Build bản release để tự phát hành / đăng Play Store
Bản ở bước 5 là bản **debug**, chỉ để tự cài thử. Muốn có bản chính thức
(release), cần ký (sign) bằng keystore riêng:
```bash
keytool -genkey -v -keystore cyberfin-release.keystore -alias cyberfin -keyalg RSA -keysize 2048 -validity 10000
```
Nhập thông tin theo hướng dẫn trên màn hình (nhớ lưu lại mật khẩu — mất là
không sửa/cập nhật lại app đã đăng được nữa). Sau đó trong Android Studio:
**Build → Generate Signed Bundle / APK** → chọn APK → chọn file keystore vừa
tạo → build ra bản release, có thể tự cài hoặc đăng lên Google Play Console
(https://play.google.com/console — cần trả 25 USD một lần để tạo tài khoản
nhà phát triển).

## Icon & tên app hiển thị trên Android
- Icon: thay các file trong `android/app/src/main/res/mipmap-*/` (Android
  Studio có công cụ **Image Asset** hỗ trợ tạo tự động: chuột phải vào `res`
  → **New → Image Asset**, chọn ảnh logo của bạn).
- Tên app: sửa `appName` trong `capacitor.config.ts` rồi chạy lại
  `npm run android:sync`, hoặc sửa trực tiếp
  `android/app/src/main/res/values/strings.xml`.
- Màu splash screen / status bar: đã đặt sẵn nền `#0A0B0D` khớp theme
  cyberpunk trong `capacitor.config.ts`.

## Cách khác: PWA / TWA (nếu bạn muốn app tự cập nhật mà không cần build lại APK)
Nếu sau này bạn deploy web lên Vercel/Netlify (xem `HUONG_DAN_DEPLOY.md`) và
muốn có 1 APK "vỏ mỏng" trỏ thẳng vào website đó (app tự động có bản mới mỗi
khi bạn deploy web, không cần build APK lại), có thể dùng **Bubblewrap**
(công cụ chính thức của Google cho TWA - Trusted Web Activity):
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://your-domain.vercel.app/manifest.json
bubblewrap build
```
Cách này yêu cầu website phải chạy HTTPS thật và cần thêm 1 file xác minh
domain (`assetlinks.json`). Phù hợp nếu bạn ưu tiên "sửa web là app tự cập
nhật" hơn là 1 file APK độc lập. Với hầu hết trường hợp tự dùng/cài thử,
**Capacitor ở trên là lựa chọn đơn giản và chắc ăn hơn.**
