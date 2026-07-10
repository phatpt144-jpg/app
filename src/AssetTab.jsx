/**
 * AssetTab.jsx — PHẦN 5/6: TAB TÀI SẢN (Wallets tổng hợp + Vàng)
 * ------------------------------------------------------------------
 * App quản lý tài chính cá nhân — phong cách Cyberpunk/Neon.
 * Component này CHỈ nhận dữ liệu/callback qua props, không tự tạo dữ
 * liệu ví/vàng giả bên trong, không tự lưu trữ (không localStorage).
 * State nội bộ chỉ là state UI tạm thời (modal nào đang mở, đang sửa
 * lô vàng nào, giá trị đang gõ trong form...).
 *
 * Props:
 *   {
 *     wallets,        // Wallet[]
 *     goldHoldings,   // GoldHolding[]
 *     goldPrice,      // number — giá vàng hiện tại (VNĐ / chỉ)
 *     goldChange,     // number — % thay đổi giá vàng (so với lần cập nhật trước)
 *     goldLoading,    // boolean — đang tải giá vàng
 *     goldUpdated,    // string | null — thời điểm cập nhật giá gần nhất (ISO)
 *     onFetchGold,    // () => void — yêu cầu làm mới giá vàng
 *     onAddGold,      // (holding: GoldHolding) => void
 *     onEditGold,     // (id: string, patch: Partial<GoldHolding>) => void
 *     onRemoveGold,   // (id: string) => void
 *   }
 *
 * Sub-component trong file này (liệt kê để người ráp nối biết cấu trúc
 * — có thể tách file riêng, giữ nguyên props):
 *   - WalletRow        : 1 dòng ví/tài khoản trong danh sách dọc
 *   - GoldHoldingRow   : 1 dòng lô vàng đã mua
 *   - GoldFormModal    : bottom sheet thêm/sửa lô vàng — props { initial, onClose, onSave }
 *   - DeleteConfirm    : bottom sheet xác nhận xoá dùng chung — props { name, onConfirm, onClose }
 *   - BottomSheet      : khung modal trượt-lên dùng chung nội bộ
 * ------------------------------------------------------------------
 */

import React, { useState, useMemo } from "react";
import {
  Wallet2,
  Landmark,
  CreditCard,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  RectangleHorizontal,
  Circle,
  Gem,
  Coins,
  Check,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Design tokens (bắt buộc dùng chung — không tự đổi)                  */
/* ------------------------------------------------------------------ */
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

const GOLD_TYPES = [
  { key: "Vàng miếng SJC", icon: RectangleHorizontal, color: C.yellow },
  { key: "Vàng nhẫn 9999", icon: Circle, color: C.yellow },
  { key: "Vàng 24K khác", icon: Gem, color: C.yellow },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function formatCurrency(n) {
  const v = Math.round(n || 0);
  return `${v.toLocaleString("vi-VN")} ₫`;
}

function formatCurrencyShort(n) {
  const v = n || 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e9) {
    const num = abs / 1e9;
    return `${sign}${num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)} tỷ`;
  }
  if (abs >= 1e6) {
    const num = abs / 1e6;
    return `${sign}${num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)}tr`;
  }
  return formatCurrency(v);
}

function formatQty(q) {
  const n = Number(q) || 0;
  return `${n % 1 === 0 ? n : n.toFixed(2)} chỉ`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour12: false });
}

function genId(prefix = "g") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/* ------------------------------------------------------------------ */
/* BottomSheet — khung modal dùng chung nội bộ                          */
/* ------------------------------------------------------------------ */
function BottomSheet({ open, onClose, title, children, accent = C.cyan }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(5,6,8,0.7)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 430,
          maxHeight: "88vh",
          background: C.card,
          borderRadius: "24px 24px 0 0",
          border: `1px solid ${C.cardBorder}`,
          borderBottom: "none",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          animation: "asset-sheet-up 0.28s cubic-bezier(.2,.8,.3,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 14px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 17,
              color: C.text,
              textShadow: `0 0 12px ${accent}55`,
            }}
          >
            {title}
          </div>
          <button
            onClick={onClose}
            className="asset-press"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,0.04)",
              color: C.textSub,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={17} />
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1, minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  background: "rgba(255,255,255,0.03)",
  color: C.text,
  fontSize: 14,
  outline: "none",
};

const primaryBtnStyle = {
  width: "100%",
  padding: "14px 0",
  borderRadius: 14,
  border: "none",
  background: C.yellow,
  color: "#221A00",
  fontWeight: 800,
  fontSize: 14.5,
  boxShadow: `0 0 18px rgba(255,214,0,0.35)`,
  marginTop: 4,
};

/* ------------------------------------------------------------------ */
/* WalletRow — dòng ví/tài khoản (danh sách dọc, đầy đủ STK/số thẻ)     */
/* ------------------------------------------------------------------ */
function WalletRow({ wallet, index }) {
  const accent = wallet.color || (wallet.type === "cash" ? C.green : C.cyan);
  const Icon =
    wallet.type === "cash" ? Wallet2 : wallet.type === "bank" ? Landmark : CreditCard;

  return (
    <div
      className="asset-fadeup"
      style={{
        animationDelay: `${index * 60}ms`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: C.card,
        border: `1px solid ${accent}2E`,
        borderRadius: 16,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: `${accent}22`,
          border: `1px solid ${accent}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={19} color={accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
          {wallet.type === "cash" ? "Tiền mặt" : wallet.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.textSub,
            fontFamily: wallet.type === "cash" ? "inherit" : "monospace",
            marginTop: 2,
          }}
        >
          {wallet.type === "atm"
            ? wallet.cardNo || "—"
            : wallet.type === "bank"
            ? wallet.accountNo || "—"
            : "Ví mặc định"}
        </div>
      </div>
      <div
        style={{
          fontSize: 15.5,
          fontWeight: 800,
          color: C.text,
          textShadow: `0 0 8px ${accent}55`,
          flexShrink: 0,
          textAlign: "right",
        }}
      >
        {formatCurrency(wallet.balance)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GoldHoldingRow — dòng lô vàng đã mua                                 */
/* ------------------------------------------------------------------ */
function GoldHoldingRow({ holding, index, onEdit, onRemove }) {
  const typeInfo = GOLD_TYPES.find((t) => t.key === holding.type) || GOLD_TYPES[0];
  const Icon = typeInfo.icon;

  return (
    <div
      className="asset-fadeup"
      style={{
        animationDelay: `${index * 60}ms`,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(255,214,0,0.12)",
          border: `1px solid ${C.yellow}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={17} color={C.yellow} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{holding.type}</div>
        <div style={{ fontSize: 12, color: C.textSub, marginTop: 3 }}>
          {formatQty(holding.qty)} · {formatCurrency(holding.buyPrice)}/chỉ
        </div>
        <div style={{ fontSize: 11.5, color: C.textSub, marginTop: 2 }}>
          Ngày mua: {formatDate(holding.date)}
        </div>
        {holding.note && (
          <div style={{ fontSize: 12, color: C.textMid, marginTop: 4, fontStyle: "italic" }}>
            {holding.note}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(holding)}
          className="asset-press"
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pencil size={12} color={C.textSub} />
        </button>
        <button
          onClick={() => onRemove(holding)}
          className="asset-press"
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            border: `1px solid ${C.red}44`,
            background: C.redDim,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trash2 size={12} color={C.red} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GoldFormModal — thêm/sửa lô vàng                                     */
/* ------------------------------------------------------------------ */
function GoldFormModal({ open, initial, onClose, onSave }) {
  const [type, setType] = useState(initial?.type || GOLD_TYPES[0].key);
  const [qty, setQty] = useState(initial?.qty ? String(initial.qty) : "");
  const [buyPrice, setBuyPrice] = useState(initial?.buyPrice ? String(initial.buyPrice) : "");
  const [note, setNote] = useState(initial?.note || "");

  React.useEffect(() => {
    if (open) {
      setType(initial?.type || GOLD_TYPES[0].key);
      setQty(initial?.qty ? String(initial.qty) : "");
      setBuyPrice(initial?.buyPrice ? String(initial.buyPrice) : "");
      setNote(initial?.note || "");
    }
  }, [open, initial]);

  const numQty = Number(qty.replace(",", "."));
  const numBuyPrice = Number(buyPrice.replace(/\D/g, ""));
  const canSubmit = numQty > 0 && numBuyPrice > 0;

  const handleSubmit = () => {
    const holding = {
      id: initial?.id || genId(),
      type,
      qty: numQty,
      buyPrice: numBuyPrice,
      note: note.trim(),
      date: initial?.date || new Date().toISOString(),
    };
    onSave(holding);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={initial ? "Sửa lô vàng" : "Thêm vàng"}
      accent={C.yellow}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>Loại vàng</div>
          <div style={{ display: "flex", gap: 8 }}>
            {GOLD_TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className="asset-press"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 6px",
                    borderRadius: 14,
                    border: `1px solid ${active ? C.yellow : C.border}`,
                    background: active ? "rgba(255,214,0,0.12)" : "rgba(255,255,255,0.03)",
                    boxShadow: active ? "0 0 14px rgba(255,214,0,0.3)" : "none",
                  }}
                >
                  <Icon size={18} color={active ? C.yellow : C.textSub} />
                  <span
                    style={{
                      fontSize: 10.5,
                      color: active ? C.yellow : C.textSub,
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: 1.3,
                    }}
                  >
                    {t.key}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>Số lượng (chỉ)</div>
          <input
            inputMode="decimal"
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="VD: 2"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>Giá mua / chỉ</div>
          <input
            inputMode="numeric"
            value={buyPrice ? Number(buyPrice).toLocaleString("vi-VN") : ""}
            onChange={(e) => setBuyPrice(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>Ghi chú (tuỳ chọn)</div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Mua tại tiệm vàng ABC"
            style={inputStyle}
          />
        </div>

        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="asset-press"
          style={{
            ...primaryBtnStyle,
            opacity: canSubmit ? 1 : 0.4,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {initial ? "Lưu thay đổi" : "Thêm vào danh mục"}
        </button>
      </div>
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/* DeleteConfirm — xác nhận xoá dùng chung                              */
/* ------------------------------------------------------------------ */
function DeleteConfirm({ open, name, onConfirm, onClose }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Xác nhận xoá" accent={C.red}>
      <div style={{ color: C.textMid, fontSize: 14, marginBottom: 18 }}>
        Bạn có chắc muốn xoá <b style={{ color: C.text }}>{name}</b>? Hành động này không thể
        hoàn tác.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onClose}
          className="asset-press"
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: "transparent",
            color: C.textMid,
            fontWeight: 600,
          }}
        >
          Huỷ
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="asset-press"
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 14,
            border: "none",
            background: C.red,
            color: "#fff",
            fontWeight: 700,
            boxShadow: `0 0 16px ${C.redGlow}`,
          }}
        >
          <Check size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
          Xoá
        </button>
      </div>
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/* AssetTab — component chính                                           */
/* ------------------------------------------------------------------ */
export default function AssetTab({
  wallets = [],
  goldHoldings = [],
  goldPrice = 0,
  goldChange = 0,
  goldLoading = false,
  goldUpdated = null,
  onFetchGold,
  onAddGold,
  onEditGold,
  onRemoveGold,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const walletsTotal = useMemo(
    () => wallets.reduce((sum, w) => sum + (w.balance || 0), 0),
    [wallets]
  );

  const goldStats = useMemo(() => {
    const totalQty = goldHoldings.reduce((s, g) => s + (g.qty || 0), 0);
    const totalCost = goldHoldings.reduce((s, g) => s + (g.qty || 0) * (g.buyPrice || 0), 0);
    const totalValue = totalQty * (goldPrice || 0);
    const profitPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    return { totalQty, totalCost, totalValue, profitPct };
  }, [goldHoldings, goldPrice]);

  const grandTotal = walletsTotal + goldStats.totalValue;

  const openAddForm = () => {
    setEditingHolding(null);
    setFormOpen(true);
  };
  const openEditForm = (holding) => {
    setEditingHolding(holding);
    setFormOpen(true);
  };
  const handleSaveGold = (holding) => {
    if (editingHolding) {
      onEditGold?.(editingHolding.id, holding);
    } else {
      onAddGold?.(holding);
    }
  };

  const isPositiveChange = goldChange >= 0;

  return (
    <div style={{ position: "relative", zIndex: 1, padding: "20px 16px 100px" }}>
      <style>{`
        @keyframes asset-sheet-up {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes asset-fadeup-kf {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes asset-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .asset-fadeup { animation: asset-fadeup-kf 0.4s ease both; }
        .asset-press { transition: transform 0.12s ease; }
        .asset-press:active { transform: scale(0.96); }
        .asset-spin { animation: asset-spin 0.9s linear infinite; }
      `}</style>

      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 16 }}>
        Tài sản
      </div>

      {/* ---------- Thẻ tổng tài sản ---------- */}
      <div
        style={{
          background: `linear-gradient(160deg, ${C.card} 0%, #1A1408 100%)`,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 22,
          padding: "22px 20px",
          marginBottom: 22,
          boxShadow: `0 0 30px rgba(255,214,0,0.18)`,
        }}
      >
        <div style={{ fontSize: 12.5, color: C.textSub, marginBottom: 6 }}>
          Tổng tài sản (Ví + Vàng)
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: C.text,
            textShadow: `0 0 10px ${C.cyanGlow}, 0 0 22px rgba(255,214,0,0.3)`,
            letterSpacing: -0.5,
          }}
        >
          {formatCurrency(grandTotal)}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: C.textSub, marginBottom: 4 }}>Ví & tài khoản</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.cyan }}>
              {formatCurrencyShort(walletsTotal)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: C.textSub, marginBottom: 4 }}>Vàng quy đổi</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.yellow }}>
              {formatCurrencyShort(goldStats.totalValue)}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Danh sách ví (dọc) ---------- */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>
          Ví & tài khoản
        </div>
        {wallets.map((w, i) => (
          <WalletRow key={w.id} wallet={w} index={i} />
        ))}
      </div>

      {/* ---------- Đầu tư — Vàng ---------- */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Đầu tư — Vàng</div>
          <button
            onClick={onFetchGold}
            disabled={goldLoading}
            className="asset-press"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 999,
              border: `1px solid ${C.yellow}44`,
              background: "rgba(255,214,0,0.1)",
              color: C.yellow,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <RefreshCw size={13} className={goldLoading ? "asset-spin" : ""} />
            {goldLoading ? "Đang tải..." : "Làm mới giá"}
          </button>
        </div>

        {/* Giá vàng hiện tại */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.card,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: 16,
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 11.5, color: C.textSub, marginBottom: 4 }}>
              Giá vàng / chỉ
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
              {goldPrice ? formatCurrency(goldPrice) : "—"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                justifyContent: "flex-end",
                color: isPositiveChange ? C.green : C.red,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {isPositiveChange ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isPositiveChange ? "+" : ""}
              {goldChange?.toFixed?.(2) ?? goldChange}%
            </div>
            {goldUpdated && (
              <div style={{ fontSize: 10.5, color: C.textSub, marginTop: 4 }}>
                Cập nhật {formatTime(goldUpdated)}
              </div>
            )}
          </div>
        </div>

        {goldHoldings.length > 0 && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: 16,
              padding: "16px 16px",
              marginBottom: 14,
              boxShadow: "0 0 20px rgba(255,214,0,0.12)",
            }}
          >
            <div style={{ fontSize: 11.5, color: C.textSub, marginBottom: 4 }}>
              Tổng nắm giữ: {formatQty(goldStats.totalQty)}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: C.text,
                textShadow: "0 0 10px rgba(255,214,0,0.4)",
                marginBottom: 8,
              }}
            >
              {formatCurrency(goldStats.totalValue)}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 999,
                background: goldStats.profitPct >= 0 ? C.greenDim : C.redDim,
                color: goldStats.profitPct >= 0 ? C.green : C.red,
                fontWeight: 700,
                fontSize: 12.5,
              }}
            >
              {goldStats.profitPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {goldStats.profitPct >= 0 ? "+" : ""}
              {goldStats.profitPct.toFixed(2)}% so với giá vốn
            </div>
          </div>
        )}

        <button
          onClick={openAddForm}
          className="asset-press"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "13px 0",
            borderRadius: 14,
            border: `1px dashed ${C.yellow}55`,
            background: "rgba(255,214,0,0.08)",
            color: C.yellow,
            fontWeight: 700,
            fontSize: 13.5,
            marginBottom: 16,
          }}
        >
          <Plus size={16} />
          Thêm vàng
        </button>

        {goldHoldings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px 0",
              color: C.textSub,
              fontSize: 13,
            }}
          >
            <Coins size={26} color={C.textSub} style={{ marginBottom: 8 }} />
            <div>Chưa có khoản vàng nào</div>
          </div>
        ) : (
          <div>
            {goldHoldings.map((g, i) => (
              <GoldHoldingRow
                key={g.id}
                holding={g}
                index={i}
                onEdit={openEditForm}
                onRemove={(h) => setDeleteTarget(h)}
              />
            ))}
          </div>
        )}
      </div>

      <GoldFormModal
        open={formOpen}
        initial={editingHolding}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveGold}
      />

      <DeleteConfirm
        open={!!deleteTarget}
        name={deleteTarget ? `lô ${deleteTarget.type} (${formatQty(deleteTarget.qty)})` : ""}
        onConfirm={() => deleteTarget && onRemoveGold?.(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
