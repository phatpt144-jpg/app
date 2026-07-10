/**
 * storage.js — lớp lưu trữ dùng IndexedDB thay cho localStorage.
 * ------------------------------------------------------------------
 * Lý do đổi sang IndexedDB: localStorage chỉ cho ~5-10MB tổng cộng,
 * trong khi ảnh hoá đơn (base64) trong Transaction.photo có thể nặng
 * vài trăm KB/ảnh — chỉ vài chục giao dịch có ảnh là tràn quota và
 * mất khả năng lưu dữ liệu mới. IndexedDB cho phép lưu tới hàng trăm
 * MB (tuỳ trình duyệt/dung lượng máy), phù hợp để lưu ảnh lâu dài.
 *
 * API export ra ngoài vẫn đơn giản như localStorage (get/set 1 object
 * lớn dưới 1 key), để App.jsx không cần đổi cách dùng nhiều.
 * ------------------------------------------------------------------
 */

const DB_NAME = "cyberfin_db";
const DB_VERSION = 1;
const STORE_NAME = "kv";
const STATE_KEY = "app_state_v1";

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/** Đọc toàn bộ state đã lưu. Trả về null nếu chưa có dữ liệu. */
export async function loadAppState() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(STATE_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("Không đọc được dữ liệu từ IndexedDB.", e);
    return null;
  }
}

/** Ghi đè toàn bộ state. */
export async function saveAppState(state) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(state, STATE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("Không lưu được dữ liệu vào IndexedDB.", e);
    return false;
  }
}
