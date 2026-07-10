import React, { useState, useMemo } from "react";
import {
  X, Plus, Pencil, Trash2, HandCoins, Banknote, AlertTriangle, Users,
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
const FONT = "'Space Grotesk', sans-serif";

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
  if (abs >= 1_000) return sign + Math.round(abs / 1000) + "k";
  return sign + abs.toString();
}

/* ============================================================
   Sinh avatar 2 ký tự viết tắt từ tên
   ============================================================ */
function genAvatar(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const lastTwo = words.slice(-2);
    return (lastTwo[0][0] + lastTwo[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return "??";
}

/* ============================================================
   BOTTOM SHEET WRAPPER — dùng chung cho mọi modal trong phần này
   ============================================================ */
function BottomSheet({ title, onClose, children, maxHeight = "88vh", zIndex = 200 }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <style>{FONT_IMPORT}</style>
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0, background: "rgba(5,6,8,0.7)",
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          animation: "df-fade 0.2s ease",
        }}
      />
      <div
        style={{
          position: "relative", width: "100%", maxWidth: 430, maxHeight,
          background: C.card, borderRadius: "24px 24px 0 0",
          border: `1px solid ${C.cardBorder}`, borderBottom: "none",
          boxShadow: `0 -10px 40px rgba(0,240,255,0.06)`,
          display: "flex", flexDirection: "column", fontFamily: FONT,
          animation: "df-slide-up 0.28s cubic-bezier(0.16,1,0.3,1)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, position: "relative" }}>
          <div style={{ width: 36, height: 4, borderRadius: 4, background: C.border, position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)" }} />
          <div style={{ color: C.text, fontWeight: 700, fontSize: 17, marginTop: 6 }}>{title}</div>
          <button onClick={onClose} className="df-press" style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.textSub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginTop: 6 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
      <style>{`
        @keyframes df-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes df-slide-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes df-fade-up { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes df-pop { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: scale(1) } }
        .df-press:active { transform: scale(0.96); }
      `}</style>
    </div>
  );
}

/* ============================================================
   DeleteConfirm — modal xác nhận xoá
   Props: { name, onConfirm, onClose }
   ============================================================ */
export function DeleteConfirm({ name, onConfirm, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{FONT_IMPORT}</style>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(5,6,8,0.75)", backdropFilter: "blur(6px)", animation: "df-fade 0.2s ease" }} />
      <div
        style={{
          position: "relative", width: "100%", maxWidth: 340, background: C.card,
          borderRadius: 20, border: `1px solid ${C.redGlow}`, padding: "24px 22px",
          fontFamily: FONT, boxShadow: `0 0 30px rgba(255,61,0,0.15)`,
          animation: "df-pop 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div style={{ width: 48, height: 48, borderRadius: 14, background: C.redDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <AlertTriangle size={22} color={C.red} />
        </div>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          Xoá {name}?
        </div>
        <div style={{ color: C.textSub, fontSize: 13, lineHeight: 1.5, marginBottom: 22 }}>
          Hành động này không thể hoàn tác.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            className="df-press"
            style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: `1px solid ${C.border}`, background: "transparent", color: C.textMid, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT }}
          >
            Huỷ
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="df-press"
            style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "none", background: C.red, color: "#05070A", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FONT, boxShadow: `0 0 18px ${C.redGlow}` }}
          >
            Xoá
          </button>
        </div>
      </div>
      <style>{`@keyframes df-fade { from { opacity: 0 } to { opacity: 1 } } @keyframes df-pop { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: scale(1) } } .df-press:active { transform: scale(0.96); }`}</style>
    </div>
  );
}

/* ============================================================
   DebtFormModal — thêm/sửa khoản nợ
   Props: { initial, onClose, onSave }
   ============================================================ */
export function DebtFormModal({ initial = null, onClose, onSave }) {
  const isEdit = !!initial;
  const [type, setType] = useState(initial?.type || "receive");
  const [name, setName] = useState(initial?.name || "");
  const [amountStr, setAmountStr] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date || "");

  const themeColor = type === "receive" ? C.green : C.red;
  const themeGlow = type === "receive" ? C.greenGlow : C.redGlow;
  const themeDim = type === "receive" ? C.greenDim : C.redDim;
  const amount = Number(amountStr || 0);
  const canSave = name.trim().length > 0 && amount > 0;

  function handleAmountChange(e) {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setAmountStr(digits);
  }

  function handleSave() {
    if (!canSave) return;
    const debt = {
      id: initial?.id ?? Date.now(),
      name: name.trim(),
      amount,
      type,
      date: date.trim(),
      avatar: genAvatar(name),
    };
    onSave(debt);
    onClose();
  }

  return (
    <BottomSheet title={isEdit ? "Sửa khoản nợ" : "Thêm khoản nợ"} onClose={onClose} zIndex={220}>
      <div style={{ padding: "18px 20px 26px" }}>
        {/* Toggle loại */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 4, border: `1px solid ${C.border}`, marginBottom: 20 }}>
          {[
            { key: "receive", label: "Họ nợ mình" },
            { key: "owe", label: "Mình nợ họ" },
          ].map((t) => {
            const active = type === t.key;
            const col = t.key === "receive" ? C.green : C.red;
            return (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className="df-press"
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 13, fontFamily: FONT,
                  background: active ? (t.key === "receive" ? C.greenDim : C.redDim) : "transparent",
                  color: active ? col : C.textSub,
                  boxShadow: active ? `0 0 14px ${t.key === "receive" ? C.greenGlow : C.redGlow}` : "none",
                  transition: "all 0.2s",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tên người */}
        <div style={{ color: C.textSub, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>TÊN NGƯỜI</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Nguyễn Văn A"
          style={{
            width: "100%", padding: "13px 14px", borderRadius: 14, border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.02)", color: C.text, fontSize: 14, marginBottom: 18,
            boxSizing: "border-box", fontFamily: FONT, outline: "none",
          }}
        />

        {/* Số tiền */}
        <div style={{ color: C.textSub, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>SỐ TIỀN</div>
        <div style={{ position: "relative", marginBottom: 18 }}>
          <input
            value={amountStr ? Number(amountStr).toLocaleString("vi-VN") : ""}
            onChange={handleAmountChange}
            inputMode="numeric"
            placeholder="0"
            style={{
              width: "100%", padding: "13px 34px 13px 14px", borderRadius: 14, border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,0.02)",
              color: amount > 0 ? themeColor : C.text,
              fontSize: 18, fontWeight: 700, boxSizing: "border-box", fontFamily: FONT, outline: "none",
              textShadow: amount > 0 ? `0 0 10px ${themeGlow}` : "none",
              transition: "color 0.2s",
            }}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: C.textSub, fontSize: 14, fontWeight: 600 }}>₫</span>
        </div>

        {/* Hạn */}
        <div style={{ color: C.textSub, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>HẠN (TUỲ CHỌN)</div>
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="VD: 15/08"
          style={{
            width: "100%", padding: "13px 14px", borderRadius: 14, border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.02)", color: C.text, fontSize: 14, marginBottom: 24,
            boxSizing: "border-box", fontFamily: FONT, outline: "none",
          }}
        />

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="df-press"
          style={{
            width: "100%", padding: "15px 0", borderRadius: 16, border: "none",
            cursor: canSave ? "pointer" : "not-allowed",
            background: canSave ? themeColor : "rgba(255,255,255,0.05)",
            color: canSave ? "#05070A" : C.textSub, fontWeight: 700, fontSize: 15, fontFamily: FONT,
            boxShadow: canSave ? `0 0 20px ${themeGlow}` : "none", transition: "all 0.2s",
          }}
        >
          {isEdit ? "Lưu thay đổi" : "Thêm khoản nợ"}
        </button>
      </div>
    </BottomSheet>
  );
}

/* ============================================================
   DebtTab — tab chính
   Props: { debts, onAddDebt, onEditDebt, onRemoveDebt }
   ============================================================ */
export function DebtTab({ debts = [], onAddDebt, onEditDebt, onRemoveDebt }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [deletingDebt, setDeletingDebt] = useState(null);

  const { totalReceive, totalOwe } = useMemo(() => {
    let r = 0, o = 0;
    for (const d of debts) {
      if (d.type === "receive") r += Number(d.amount) || 0;
      else o += Number(d.amount) || 0;
    }
    return { totalReceive: r, totalOwe: o };
  }, [debts]);

  const sorted = useMemo(
    () => [...debts].sort((a, b) => (b.id || 0) - (a.id || 0)),
    [debts]
  );

  function openAddForm() {
    setEditingDebt(null);
    setFormOpen(true);
  }
  function openEditForm(debt) {
    setEditingDebt(debt);
    setFormOpen(true);
  }
  function handleSave(debt) {
    if (editingDebt) onEditDebt?.(debt);
    else onAddDebt?.(debt);
  }

  return (
    <div style={{ position: "relative", zIndex: 1, fontFamily: FONT, padding: "16px 16px 90px", maxWidth: 430, margin: "0 auto" }}>
      <style>{FONT_IMPORT}</style>

      {/* 2 thẻ tổng */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div
          style={{
            padding: "16px 16px", borderRadius: 18, background: C.card,
            border: `1px solid ${C.cardBorder}`, position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: C.greenDim, filter: "blur(10px)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, position: "relative" }}>
            <HandCoins size={15} color={C.green} />
            <span style={{ color: C.textSub, fontSize: 12, fontWeight: 600 }}>Sẽ nhận</span>
          </div>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 19, textShadow: `0 0 10px ${C.greenGlow}, 0 0 20px ${C.greenGlow}`, position: "relative" }}>
            {shortenVND(totalReceive)}
          </div>
        </div>
        <div
          style={{
            padding: "16px 16px", borderRadius: 18, background: C.card,
            border: `1px solid ${C.cardBorder}`, position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: C.redDim, filter: "blur(10px)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, position: "relative" }}>
            <Banknote size={15} color={C.red} />
            <span style={{ color: C.textSub, fontSize: 12, fontWeight: 600 }}>Sẽ trả</span>
          </div>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 19, textShadow: `0 0 10px ${C.redGlow}, 0 0 20px ${C.redGlow}`, position: "relative" }}>
            {shortenVND(totalOwe)}
          </div>
        </div>
      </div>

      {/* Nút thêm */}
      <button
        onClick={openAddForm}
        className="df-press"
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "13px 0", borderRadius: 16, border: `1px solid ${C.cyan}`,
          background: C.cyanDim, color: C.cyan, fontWeight: 700, fontSize: 14, cursor: "pointer",
          fontFamily: FONT, boxShadow: `0 0 16px ${C.cyanGlow}`, marginBottom: 18,
        }}
      >
        <Plus size={16} /> Thêm khoản nợ
      </button>

      {/* Danh sách */}
      {sorted.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", opacity: 0.6 }}>
          <Users size={40} color={C.textSub} style={{ marginBottom: 12, opacity: 0.5 }} />
          <div style={{ color: C.textSub, fontSize: 14, fontWeight: 600 }}>Chưa có khoản nợ nào</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((d, i) => {
            const isReceive = d.type === "receive";
            const gradient = isReceive
              ? `linear-gradient(135deg, ${C.green}, ${C.cyan})`
              : `linear-gradient(135deg, ${C.red}, ${C.purple})`;
            return (
              <div
                key={d.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  borderRadius: 16, background: C.card, border: `1px solid ${C.cardBorder}`,
                  animation: `df-fade-up 0.35s ease ${Math.min(i, 12) * 0.03}s both`,
                }}
              >
                <div
                  style={{
                    width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                    background: gradient, display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#05070A", fontWeight: 700, fontSize: 14,
                    boxShadow: `0 0 12px ${isReceive ? C.greenGlow : C.redGlow}`,
                  }}
                >
                  {d.avatar || genAvatar(d.name)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: C.text, fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {d.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                        color: isReceive ? C.green : C.red,
                        background: isReceive ? C.greenDim : C.redDim,
                      }}
                    >
                      {isReceive ? "Họ nợ mình" : "Mình nợ họ"}
                    </span>
                    {d.date && <span style={{ color: C.textSub, fontSize: 11 }}>Hạn {d.date}</span>}
                  </div>
                </div>

                <div style={{ color: isReceive ? C.green : C.red, fontWeight: 700, fontSize: 14, flexShrink: 0, marginRight: 2 }}>
                  {isReceive ? "+" : "-"}{formatVND(d.amount)}
                </div>

                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => openEditForm(d)}
                    className="df-press"
                    style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.textSub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeletingDebt(d)}
                    className="df-press"
                    style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.red, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <DebtFormModal
          initial={editingDebt}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
        />
      )}

      {deletingDebt && (
        <DeleteConfirm
          name={deletingDebt.name}
          onClose={() => setDeletingDebt(null)}
          onConfirm={() => onRemoveDebt?.(deletingDebt.id)}
        />
      )}
    </div>
  );
}

/* ============================================================
   DEMO — chỉ để xem trước, KHÔNG thuộc phần bàn giao.
   App Shell thật sẽ tự quản lý debts và truyền qua props.
   ============================================================ */
export default function Demo() {
  const [debts, setDebts] = useState([]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "20px 16px 0" }}>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Demo xem trước — Ghi nợ</div>
        <div style={{ color: C.textSub, fontSize: 12, marginBottom: 4 }}>
          (App Shell thật sẽ quản lý dữ liệu — đây chỉ là bản demo để kiểm tra UI)
        </div>
      </div>
      <DebtTab
        debts={debts}
        onAddDebt={(d) => setDebts((list) => [d, ...list])}
        onEditDebt={(d) => setDebts((list) => list.map((x) => (x.id === d.id ? d : x)))}
        onRemoveDebt={(id) => setDebts((list) => list.filter((x) => x.id !== id))}
      />
    </div>
  );
}
