import React, { useState, useMemo, useRef } from "react";
import {
  X, Camera, Image as ImageIcon, Search, ChevronLeft, ChevronRight,
  Calendar, ArrowUpRight, ArrowDownRight, SearchX, Delete,
  UtensilsCrossed, Car, ShoppingBag, Gamepad2, HeartPulse, GraduationCap,
  MoreHorizontal, Wallet, Laptop, TrendingUp, ChevronDown,
} from "lucide-react";

/* ============================================================
   DESIGN SYSTEM — dùng chung, không tự đổi
   ============================================================ */
const C = {
  bg: "#0A0B0D",
  card: "#111318",
  cardBorder: "rgba(0,240,255,0.08)",
  cyan: "#00F0FF",
  cyanDim: "rgba(0,240,255,0.12)",
  cyanGlow: "rgba(0,240,255,0.3)",
  green: "#00E676",
  greenDim: "rgba(0,230,118,0.12)",
  greenGlow: "rgba(0,230,118,0.3)",
  red: "#FF3D00",
  redDim: "rgba(255,61,0,0.12)",
  redGlow: "rgba(255,61,0,0.3)",
  purple: "#B24BF3",
  purpleGlow: "rgba(178,75,243,0.3)",
  yellow: "#FFD600",
  text: "#FFFFFF",
  textSub: "#94A3B8",
  textMid: "#CBD5E1",
  border: "rgba(255,255,255,0.06)",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');`;

/* ============================================================
   DANH MỤC — icon + màu, dùng chung cho AddModal & HistoryTab
   ============================================================ */
const CHI_CATEGORIES = [
  { name: "Ăn uống", icon: UtensilsCrossed, color: C.yellow },
  { name: "Di chuyển", icon: Car, color: C.cyan },
  { name: "Mua sắm", icon: ShoppingBag, color: C.purple },
  { name: "Giải trí", icon: Gamepad2, color: C.red },
  { name: "Y tế", icon: HeartPulse, color: C.green },
  { name: "Học tập", icon: GraduationCap, color: "#4AA8FF" },
  { name: "Khác", icon: MoreHorizontal, color: C.textSub },
];

const THU_CATEGORIES = [
  { name: "Lương", icon: Wallet, color: C.green },
  { name: "Freelance", icon: Laptop, color: C.cyan },
  { name: "Đầu tư", icon: TrendingUp, color: C.purple },
  { name: "Khác", icon: MoreHorizontal, color: C.textSub },
];

const ALL_CATEGORY_META = [...CHI_CATEGORIES, ...THU_CATEGORIES].reduce((acc, c) => {
  acc[c.name] = acc[c.name] || c; // ưu tiên định nghĩa đầu tiên (Chi) nếu trùng tên "Khác"
  return acc;
}, {});
// "Khác" xuất hiện ở cả 2 nhóm — tách theo type khi tra cứu
function getCategoryMeta(name, type) {
  const pool = type === "thu" ? THU_CATEGORIES : CHI_CATEGORIES;
  return pool.find((c) => c.name === name) || ALL_CATEGORY_META[name] || {
    name, icon: MoreHorizontal, color: C.textSub,
  };
}

/* ============================================================
   HÀM ĐỊNH DẠNG TIỀN TỆ
   ============================================================ */
function formatVND(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("vi-VN") + " ₫";
}

function shortenVND(n) {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    const t = abs / 1_000_000_000;
    return sign + (t % 1 === 0 ? t.toFixed(0) : t.toFixed(1)) + " tỷ";
  }
  if (abs >= 1_000_000) {
    const tr = abs / 1_000_000;
    return sign + (tr % 1 === 0 ? tr.toFixed(0) : tr.toFixed(1)) + "tr";
  }
  if (abs >= 1_000) {
    return sign + Math.round(abs / 1000) + "k";
  }
  return sign + abs.toString();
}

function formatDateTimeFull(iso) {
  const d = new Date(iso);
  const pad = (x) => String(x).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoToDateOnly(iso) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/* ============================================================
   BOTTOM SHEET WRAPPER — dùng chung cho mọi modal trong phần này
   ============================================================ */
function BottomSheet({ title, onClose, children, maxHeight = "88vh" }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <style>{FONT_IMPORT}</style>
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(5,6,8,0.7)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          animation: "tf-fade 0.2s ease",
        }}
      />
      <div
        style={{
          position: "relative", width: "100%", maxWidth: 430,
          maxHeight, background: C.card,
          borderRadius: "24px 24px 0 0",
          border: `1px solid ${C.cardBorder}`,
          borderBottom: "none",
          boxShadow: `0 -10px 40px rgba(0,240,255,0.06)`,
          display: "flex", flexDirection: "column",
          fontFamily: "'Space Grotesk', sans-serif",
          animation: "tf-slide-up 0.28s cubic-bezier(0.16,1,0.3,1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 4, background: C.border, position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)" }} />
          <div style={{ color: C.text, fontWeight: 700, fontSize: 17, marginTop: 6 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,0.03)", color: C.textSub,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", marginTop: 6, transition: "transform 0.15s",
            }}
            className="tf-press"
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
      <style>{`
        @keyframes tf-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tf-slide-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes tf-fade-up { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .tf-press:active { transform: scale(0.96); }
        .tf-scroll::-webkit-scrollbar { width: 4px; }
        .tf-scroll::-webkit-scrollbar-thumb { background: rgba(0,240,255,0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
}

/* ============================================================
   2A — ADD MODAL
   Props: { onClose, onAdd, wallets, initialPhoto }
   ============================================================ */
export function AddModal({ onClose, onAdd, wallets = [], initialPhoto = null }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState("chi"); // "chi" | "thu"
  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState(null);
  const [walletId, setWalletId] = useState(wallets[0]?.id || "cash");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(initialPhoto);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const themeColor = type === "chi" ? C.red : C.green;
  const themeDim = type === "chi" ? C.redDim : C.greenDim;
  const themeGlow = type === "chi" ? C.redGlow : C.greenGlow;
  const categories = type === "chi" ? CHI_CATEGORIES : THU_CATEGORIES;
  const amount = Number(amountStr || 0);
  const selectedWallet = wallets.find((w) => w.id === walletId) || wallets[0];

  function pressDigit(d) {
    if (amountStr.replace(/^0+/, "").length >= 12) return;
    if (d === "00") {
      setAmountStr((s) => (s === "" ? "" : s + "00"));
    } else {
      setAmountStr((s) => (s === "0" ? d : s + d));
    }
  }
  function pressBackspace() {
    setAmountStr((s) => s.slice(0, -1));
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function goToStep2() {
    if (amount <= 0) return;
    setStep(2);
  }

  function handleSave() {
    if (!category || amount <= 0 || !selectedWallet) return;
    onAdd({
      id: Date.now(),
      type,
      category,
      amount,
      note,
      timestamp: new Date().toISOString(),
      wallet: selectedWallet.id,
      photo,
    });
    onClose();
  }

  return (
    <BottomSheet title={step === 1 ? "Nhập số tiền" : "Chi tiết giao dịch"} onClose={onClose}>
      {/* Toggle Chi / Thu */}
      <div style={{ padding: "16px 20px 0" }}>
        <div
          style={{
            display: "flex", background: "rgba(255,255,255,0.03)",
            borderRadius: 14, padding: 4, border: `1px solid ${C.border}`,
          }}
        >
          {["chi", "thu"].map((t) => {
            const active = type === t;
            const col = t === "chi" ? C.red : C.green;
            return (
              <button
                key={t}
                onClick={() => { setType(t); setCategory(null); }}
                className="tf-press"
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                  cursor: "pointer", fontWeight: 700, fontSize: 14,
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: active ? (t === "chi" ? C.redDim : C.greenDim) : "transparent",
                  color: active ? col : C.textSub,
                  boxShadow: active ? `0 0 16px ${t === "chi" ? C.redGlow : C.greenGlow}` : "none",
                  transition: "all 0.2s",
                }}
              >
                {t === "chi" ? "Chi tiêu" : "Thu nhập"}
              </button>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <div style={{ padding: "28px 20px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              fontSize: 40, fontWeight: 700, color: amount > 0 ? themeColor : C.textSub,
              textShadow: amount > 0 ? `0 0 10px ${themeGlow}, 0 0 20px ${themeGlow}` : "none",
              letterSpacing: 0.5, minHeight: 50, display: "flex", alignItems: "center",
              transition: "color 0.2s",
            }}
          >
            {amountStr ? Number(amountStr).toLocaleString("vi-VN") : "0"}
            <span style={{ fontSize: 20, marginLeft: 6, color: C.textSub, fontWeight: 600 }}>₫</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: "100%", marginTop: 24 }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "⌫"].map((k) => (
              <button
                key={k}
                onClick={() => (k === "⌫" ? pressBackspace() : pressDigit(k))}
                className="tf-press"
                style={{
                  padding: "16px 0", borderRadius: 14, border: `1px solid ${C.border}`,
                  background: "rgba(255,255,255,0.02)", color: C.text,
                  fontSize: 19, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {k === "⌫" ? <Delete size={18} color={C.textSub} /> : k}
              </button>
            ))}
          </div>

          <button
            onClick={goToStep2}
            disabled={amount <= 0}
            className="tf-press"
            style={{
              width: "100%", marginTop: 20, padding: "15px 0", borderRadius: 16,
              border: "none", cursor: amount > 0 ? "pointer" : "not-allowed",
              background: amount > 0 ? themeColor : "rgba(255,255,255,0.05)",
              color: amount > 0 ? "#05070A" : C.textSub,
              fontWeight: 700, fontSize: 15,
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: amount > 0 ? `0 0 20px ${themeGlow}` : "none",
              transition: "all 0.2s",
            }}
          >
            Tiếp tục
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ padding: "18px 20px 28px" }}>
          {/* Số tiền tóm tắt + quay lại */}
          <button
            onClick={() => setStep(1)}
            className="tf-press"
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "none",
              border: "none", color: themeColor, fontWeight: 700, fontSize: 18,
              cursor: "pointer", padding: 0, marginBottom: 18,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <ChevronLeft size={18} />
            {type === "chi" ? "-" : "+"}{formatVND(amount)}
          </button>

          {/* Danh mục */}
          <div style={{ color: C.textSub, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>
            DANH MỤC
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
            {categories.map((c, i) => {
              const Icon = c.icon;
              const active = category === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => setCategory(c.name)}
                  className="tf-press"
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "12px 4px", borderRadius: 14, cursor: "pointer",
                    border: `1px solid ${active ? c.color : C.border}`,
                    background: active ? `${c.color}1F` : "rgba(255,255,255,0.02)",
                    boxShadow: active ? `0 0 14px ${c.color}55` : "none",
                    transition: "all 0.2s",
                    animation: `tf-fade-up 0.3s ease ${i * 0.03}s both`,
                  }}
                >
                  <Icon size={20} color={active ? c.color : C.textSub} />
                  <span style={{ fontSize: 11, color: active ? C.text : C.textSub, fontWeight: 600, textAlign: "center", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ví */}
          <div style={{ color: C.textSub, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>
            VÍ / TÀI KHOẢN
          </div>
          <button
            onClick={() => setWalletPickerOpen((v) => !v)}
            className="tf-press"
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,0.02)", cursor: "pointer", marginBottom: walletPickerOpen ? 8 : 22,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${selectedWallet?.color || C.cyan}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {selectedWallet?.icon || "💳"}
              </div>
              <span style={{ color: C.text, fontWeight: 600, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
                {selectedWallet?.name || "Chọn ví"}
              </span>
            </div>
            <ChevronDown size={16} color={C.textSub} style={{ transform: walletPickerOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {walletPickerOpen && (
            <div style={{ marginBottom: 22, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => { setWalletId(w.id); setWalletPickerOpen(false); }}
                  className="tf-press"
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", background: w.id === walletId ? "rgba(0,240,255,0.06)" : "transparent",
                    border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: `${w.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                    {w.icon}
                  </div>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>{w.name}</span>
                  <span style={{ marginLeft: "auto", color: C.textSub, fontSize: 12 }}>{shortenVND(w.balance)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Ghi chú */}
          <div style={{ color: C.textSub, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>
            GHI CHÚ
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Thêm ghi chú..."
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 14,
              border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)",
              color: C.text, fontSize: 14, marginBottom: 22, boxSizing: "border-box",
              fontFamily: "'Space Grotesk', sans-serif", outline: "none",
            }}
          />

          {/* Ảnh hoá đơn */}
          <div style={{ color: C.textSub, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>
            HOÁ ĐƠN
          </div>
          {photo ? (
            <div style={{ position: "relative", marginBottom: 22, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
              <img src={photo} alt="Hoá đơn" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />
              <button
                onClick={() => setPhoto(null)}
                className="tf-press"
                style={{
                  position: "absolute", top: 8, right: 8, width: 28, height: 28,
                  borderRadius: 8, border: "none", background: "rgba(5,6,8,0.7)",
                  color: C.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="tf-press"
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "16px 0", borderRadius: 14, border: `1px dashed ${C.border}`,
                  background: "rgba(255,255,255,0.02)", color: C.textSub, cursor: "pointer",
                }}
              >
                <Camera size={20} />
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>Chụp ảnh</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="tf-press"
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "16px 0", borderRadius: 14, border: `1px dashed ${C.border}`,
                  background: "rgba(255,255,255,0.02)", color: C.textSub, cursor: "pointer",
                }}
              >
                <ImageIcon size={20} />
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>Thư viện</span>
              </button>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!category}
            className="tf-press"
            style={{
              width: "100%", padding: "15px 0", borderRadius: 16, border: "none",
              cursor: category ? "pointer" : "not-allowed",
              background: category ? themeColor : "rgba(255,255,255,0.05)",
              color: category ? "#05070A" : C.textSub,
              fontWeight: 700, fontSize: 15,
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: category ? `0 0 20px ${themeGlow}` : "none",
              transition: "all 0.2s",
            }}
          >
            Lưu giao dịch
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

/* ============================================================
   DateRangePicker — modal lịch chọn khoảng ngày (tái sử dụng)
   Props: { onClose, onApply, initialStart, initialEnd }
   ============================================================ */
export function DateRangePicker({ onClose, onApply, initialStart = null, initialEnd = null }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(initialStart ? initialStart.getMonth() : today.getMonth());
  const [viewYear, setViewYear] = useState(initialStart ? initialStart.getFullYear() : today.getFullYear());
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);

  const monthNames = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];
  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  function changeMonth(delta) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m); setViewYear(y);
  }

  function handlePick(day) {
    if (!day) return;
    if (!start || (start && end)) {
      setStart(day); setEnd(null);
    } else if (day < start) {
      setStart(day); setEnd(null);
    } else {
      setEnd(day);
    }
  }

  function isSameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function inRange(day) {
    if (!start || !end || !day) return false;
    return day > start && day < end;
  }

  return (
    <BottomSheet title="Chọn khoảng ngày" onClose={onClose} maxHeight="80vh">
      <div style={{ padding: "16px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={() => changeMonth(-1)} className="tf-press" style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 15, fontFamily: "'Space Grotesk', sans-serif" }}>
            {monthNames[viewMonth]} {viewYear}
          </div>
          <button onClick={() => changeMonth(1)} className="tf-press" style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
          {weekDays.map((w) => (
            <div key={w} style={{ textAlign: "center", color: C.textSub, fontSize: 11, fontWeight: 600, padding: "6px 0" }}>{w}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const selStart = isSameDay(day, start);
            const selEnd = isSameDay(day, end);
            const between = inRange(day);
            const isToday = isSameDay(day, today);
            return (
              <button
                key={i}
                onClick={() => handlePick(day)}
                className="tf-press"
                style={{
                  aspectRatio: "1", borderRadius: selStart || selEnd ? 10 : between ? 0 : 10,
                  border: isToday && !selStart && !selEnd ? `1px solid ${C.cyan}` : "none",
                  background: selStart || selEnd ? C.cyan : between ? C.cyanDim : "transparent",
                  color: selStart || selEnd ? "#05070A" : C.text,
                  fontWeight: selStart || selEnd ? 700 : 500, fontSize: 13, cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                  boxShadow: selStart || selEnd ? `0 0 12px ${C.cyanGlow}` : "none",
                }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}>
          <span style={{ color: C.textSub, fontSize: 12 }}>Từ ngày</span>
          <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{start ? start.toLocaleDateString("vi-VN") : "—"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}>
          <span style={{ color: C.textSub, fontSize: 12 }}>Đến ngày</span>
          <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{end ? end.toLocaleDateString("vi-VN") : "—"}</span>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            onClick={() => { setStart(null); setEnd(null); }}
            className="tf-press"
            style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Xoá lọc
          </button>
          <button
            onClick={() => { onApply(start, end || start); onClose(); }}
            disabled={!start}
            className="tf-press"
            style={{
              flex: 2, padding: "13px 0", borderRadius: 14, border: "none",
              cursor: start ? "pointer" : "not-allowed",
              background: start ? C.cyan : "rgba(255,255,255,0.05)",
              color: start ? "#05070A" : C.textSub, fontWeight: 700, fontSize: 14,
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: start ? `0 0 16px ${C.cyanGlow}` : "none",
            }}
          >
            Áp dụng
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

/* ============================================================
   2B — HISTORY TAB
   Props: { txList, wallets }
   ============================================================ */
export function HistoryTab({ txList = [], wallets = [] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | thu | chi
  const [rangeOpen, setRangeOpen] = useState(false);
  const [dateStart, setDateStart] = useState(null);
  const [dateEnd, setDateEnd] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txList
      .filter((tx) => (filter === "all" ? true : tx.type === filter))
      .filter((tx) => {
        if (!q) return true;
        return (tx.note || "").toLowerCase().includes(q) || (tx.category || "").toLowerCase().includes(q);
      })
      .filter((tx) => {
        if (!dateStart || !dateEnd) return true;
        const d = isoToDateOnly(tx.timestamp);
        const s = new Date(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate());
        const e = new Date(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate());
        return d >= s && d <= e;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [txList, search, filter, dateStart, dateEnd]);

  const walletName = (id) => wallets.find((w) => w.id === id)?.name || "";

  return (
    <div style={{ position: "relative", zIndex: 1, fontFamily: "'Space Grotesk', sans-serif", padding: "16px 16px 90px", maxWidth: 430, margin: "0 auto" }}>
      <style>{FONT_IMPORT}</style>

      {/* Tìm kiếm */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
          borderRadius: 16, background: C.card, border: `1px solid ${C.cardBorder}`, marginBottom: 12,
        }}
      >
        <Search size={17} color={C.textSub} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo ghi chú, danh mục..."
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: C.text, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="tf-press" style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", display: "flex" }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Bộ lọc + khoảng ngày */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[
          { key: "all", label: "Tất cả" },
          { key: "thu", label: "Thu" },
          { key: "chi", label: "Chi" },
        ].map((f) => {
          const active = filter === f.key;
          const col = f.key === "thu" ? C.green : f.key === "chi" ? C.red : C.cyan;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="tf-press"
              style={{
                padding: "8px 16px", borderRadius: 12, cursor: "pointer",
                border: `1px solid ${active ? col : C.border}`,
                background: active ? `${col}1F` : "rgba(255,255,255,0.02)",
                color: active ? col : C.textSub, fontWeight: 700, fontSize: 13,
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: active ? `0 0 12px ${col}44` : "none",
                transition: "all 0.2s",
              }}
            >
              {f.label}
            </button>
          );
        })}
        <button
          onClick={() => setRangeOpen(true)}
          className="tf-press"
          style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 12, cursor: "pointer",
            border: `1px solid ${dateStart ? C.cyan : C.border}`,
            background: dateStart ? C.cyanDim : "rgba(255,255,255,0.02)",
            color: dateStart ? C.cyan : C.textSub, fontWeight: 600, fontSize: 12,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          <Calendar size={14} />
          {dateStart && dateEnd
            ? `${dateStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${dateEnd.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`
            : "Ngày"}
        </button>
        {dateStart && (
          <button onClick={() => { setDateStart(null); setDateEnd(null); }} className="tf-press" style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer" }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Đếm kết quả */}
      <div style={{ color: C.textSub, fontSize: 12, marginBottom: 10, fontWeight: 500 }}>
        {filtered.length} kết quả
      </div>

      {/* Danh sách */}
      {filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", opacity: 0.6 }}>
          <SearchX size={40} color={C.textSub} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div style={{ color: C.textSub, fontSize: 14, fontWeight: 600 }}>Không tìm thấy</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((tx, i) => {
            const meta = getCategoryMeta(tx.category, tx.type);
            const Icon = meta.icon;
            const isThu = tx.type === "thu";
            return (
              <div
                key={tx.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  borderRadius: 16, background: C.card, border: `1px solid ${C.cardBorder}`,
                  animation: `tf-fade-up 0.35s ease ${Math.min(i, 12) * 0.03}s both`,
                }}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: `${meta.color}1F`, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon size={19} color={meta.color} />
                </div>

                {tx.photo && (
                  <img
                    src={tx.photo}
                    alt="Hoá đơn"
                    onClick={() => setLightboxPhoto(tx.photo)}
                    style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", cursor: "pointer", flexShrink: 0, border: `1px solid ${C.border}` }}
                  />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: C.text, fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tx.note || tx.category}
                  </div>
                  <div style={{ color: C.textSub, fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{formatDateTimeFull(tx.timestamp)}</span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span>{walletName(tx.wallet)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  {isThu ? <ArrowDownRight size={14} color={C.green} /> : <ArrowUpRight size={14} color={C.red} />}
                  <span style={{ color: isThu ? C.green : C.red, fontWeight: 700, fontSize: 14 }}>
                    {isThu ? "+" : "-"}{formatVND(tx.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rangeOpen && (
        <DateRangePicker
          onClose={() => setRangeOpen(false)}
          onApply={(s, e) => { setDateStart(s); setDateEnd(e); }}
          initialStart={dateStart}
          initialEnd={dateEnd}
        />
      )}

      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 300, background: "rgba(5,6,8,0.92)",
            backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "zoom-out",
          }}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="tf-press"
            style={{
              position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: 12,
              border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.05)", color: C.text,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
          <img src={lightboxPhoto} alt="Hoá đơn phóng to" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 16, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DEMO — chỉ để xem trước, KHÔNG thuộc phần bàn giao.
   App Shell thật sẽ tự quản lý wallets/txList và truyền qua props.
   ============================================================ */
export default function Demo() {
  const [wallets] = useState([
    { id: "cash", name: "Tiền mặt", type: "cash", balance: 850000, icon: "💵", color: C.green },
    { id: "w1", name: "Vietcombank", type: "bank", balance: 12500000, icon: "🏦", color: C.cyan },
    { id: "w2", name: "Thẻ tín dụng", type: "atm", balance: -300000, icon: "💳", color: C.purple },
  ]);
  const [txList, setTxList] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState("history");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "20px 16px 0" }}>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Demo xem trước</div>
        <div style={{ color: C.textSub, fontSize: 12, marginBottom: 16 }}>
          (App Shell thật sẽ quản lý dữ liệu — đây chỉ là bản demo để kiểm tra UI)
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="tf-press"
          style={{
            width: "100%", padding: "14px 0", borderRadius: 16, border: "none",
            background: C.cyan, color: "#05070A", fontWeight: 700, fontSize: 14,
            cursor: "pointer", boxShadow: `0 0 20px ${C.cyanGlow}`, marginBottom: 20,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          + Thêm giao dịch
        </button>
      </div>

      <HistoryTab txList={txList} wallets={wallets} />

      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onAdd={(tx) => setTxList((list) => [tx, ...list])}
          wallets={wallets}
          initialPhoto={null}
        />
      )}
    </div>
  );
}
