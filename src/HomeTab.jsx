/**
 * HomeTab.jsx — PHẦN 1/6: TRANG CHỦ
 * ------------------------------------------------------------------
 * App quản lý tài chính cá nhân — phong cách Cyberpunk/Neon.
 * Component này CHỈ nhận dữ liệu và callback qua props, không tự lưu
 * trữ dữ liệu gốc (state nguồn do "App Shell" quản lý). State nội bộ
 * ở đây chỉ là state UI tạm thời (modal nào đang mở, giá trị input...).
 *
 * Props:
 *  {
 *    onAdd,          // () => void  — mở modal thêm giao dịch (do phần "Thêm giao dịch & Lịch sử" xử lý FAB, ở đây chỉ khai báo cho khớp interface, KHÔNG render FAB)
 *    txList,         // Transaction[]
 *    wallets,        // Wallet[]
 *    onAddBank,      // (wallet: Wallet) => void
 *    onEditWallet,   // (walletId: string, patch: Partial<Wallet>) => void
 *    onRemoveWallet, // (walletId: string) => void
 *    onNavigate,     // (tabIndex: number) => void
 *    onTransfer,     // (fromId: string, toId: string, amount: number) => void
 *    onScanReceipt,  // (base64: string) => void
 *    budgets,        // Budgets = { [categoryName]: number }
 *    onSaveBudgets,  // (budgets: Budgets) => void
 *  }
 *
 * Sub-component nội bộ trong file này (không export riêng, nhưng liệt kê
 * để người ráp nối biết cấu trúc — có thể tách file sau nếu cần):
 *   - BottomSheet        : khung modal trượt-lên dùng chung
 *   - QuickActionButton  : 1 ô trong lưới 4 thao tác nhanh
 *   - WalletCard         : 1 thẻ ví trong danh sách cuộn ngang
 *   - TransactionRow     : 1 dòng trong "giao dịch gần đây"
 *   - TransferModal      : bottom sheet "Chuyển khoản giữa 2 ví"
 *   - BudgetModal        : bottom sheet "Đặt ngân sách theo danh mục"
 *   - AddWalletModal     : bottom sheet "+ Ngân hàng" / "+ Thẻ ATM"
 *   - WalletQRModal       : bottom sheet hiển thị QR nhận tiền / chuyển tiền
 * ------------------------------------------------------------------
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ScanLine,
  ArrowLeftRight,
  BarChart3,
  Wallet2,
  Plus,
  X,
  Pencil,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  TrendingUp,
  Banknote,
  Landmark,
  CreditCard,
  QrCode,
  Check,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";

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

const CHI_CATEGORIES = [
  "Ăn uống",
  "Di chuyển",
  "Mua sắm",
  "Giải trí",
  "Y tế",
  "Học tập",
  "Khác",
];
const THU_CATEGORIES = ["Lương", "Freelance", "Đầu tư", "Khác"];

const CATEGORY_ICONS = {
  "Ăn uống": Utensils,
  "Di chuyển": Car,
  "Mua sắm": ShoppingBag,
  "Giải trí": Gamepad2,
  "Y tế": HeartPulse,
  "Học tập": GraduationCap,
  Lương: Banknote,
  Freelance: Briefcase,
  "Đầu tư": TrendingUp,
  Khác: MoreHorizontal,
};

const CATEGORY_COLORS = {
  "Ăn uống": C.yellow,
  "Di chuyển": C.cyan,
  "Mua sắm": C.purple,
  "Giải trí": "#FF61D8",
  "Y tế": C.red,
  "Học tập": "#6C7CFF",
  Lương: C.green,
  Freelance: C.cyan,
  "Đầu tư": C.purple,
  Khác: C.textSub,
};

const BANK_COLORS = {
  Vietcombank: "#00693E",
  Techcombank: "#DA1F2D",
  BIDV: "#1B75BC",
  VPBank: "#00A651",
  "MB Bank": "#8B1D2C",
  Sacombank: "#0033A0",
  ACB: "#0055A5",
  VIB: "#F7941D",
  Agribank: "#7A1E22",
  OCB: "#F58220",
};
const BANK_LIST = Object.keys(BANK_COLORS);

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

function greetingByHour(h) {
  if (h < 11) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  return `${day} ngày trước`;
}

function maskEnd(str, visible = 4, hideCount = 4) {
  if (!str) return "";
  const s = String(str);
  if (s.length <= visible) return s;
  const head = s.slice(0, Math.max(s.length - hideCount, 0));
  return `${head}${"•".repeat(Math.min(hideCount, s.length))}`.slice(
    0,
    head.length + hideCount
  );
}

function qrUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    text
  )}`;
}

function genId(prefix = "w") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/* ------------------------------------------------------------------ */
/* BottomSheet — khung modal dùng chung                                 */
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
          boxShadow: `0 -8px 40px rgba(0,0,0,0.6)`,
          display: "flex",
          flexDirection: "column",
          animation: "hometab-sheet-up 0.28s cubic-bezier(.2,.8,.3,1)",
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
            className="hometab-press"
          >
            <X size={17} />
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* QuickActionButton                                                    */
/* ------------------------------------------------------------------ */
function QuickActionButton({ icon: Icon, label, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="hometab-press"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: "transparent",
        border: "none",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: `${color}1F`,
          border: `1px solid ${color}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 16px ${color}33`,
        }}
      >
        <Icon size={22} color={color} />
      </div>
      <span style={{ fontSize: 11.5, color: C.textMid, fontWeight: 500 }}>
        {label}
      </span>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* WalletCard                                                           */
/* ------------------------------------------------------------------ */
function WalletCard({ wallet, index, onOpenQR, onEdit, onRemove }) {
  const isCash = wallet.type === "cash";
  const accent = wallet.color || (isCash ? C.green : C.cyan);
  const bankInitials = (wallet.name || "??")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div
      className="hometab-fadeup"
      style={{
        animationDelay: `${index * 60}ms`,
        minWidth: 168,
        maxWidth: 168,
        background: C.card,
        border: `1px solid ${accent}33`,
        borderRadius: 18,
        padding: 14,
        flexShrink: 0,
        position: "relative",
        boxShadow: `0 0 18px ${accent}22`,
        cursor: isCash ? "default" : "pointer",
      }}
      onClick={() => !isCash && onOpenQR(wallet)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: `${accent}22`,
            border: `1px solid ${accent}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            color: accent,
          }}
        >
          {isCash ? <Wallet2 size={16} color={accent} /> : bankInitials}
        </div>
        {!isCash && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="hometab-press"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(wallet);
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                border: `1px solid ${C.border}`,
                background: "rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pencil size={11} color={C.textSub} />
            </button>
            <button
              className="hometab-press"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(wallet);
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                border: `1px solid ${C.red}44`,
                background: C.redDim,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={11} color={C.red} />
            </button>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: C.textSub, marginBottom: 2 }}>
        {isCash
          ? "Tiền mặt"
          : maskEnd(wallet.name, wallet.name?.length, 0) || wallet.name}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: C.textMid,
          marginBottom: 8,
          fontFamily: "monospace",
        }}
      >
        {wallet.type === "atm"
          ? maskEnd(wallet.cardNo, 4, 6)
          : wallet.type === "bank"
          ? maskEnd(wallet.accountNo, 4, 4)
          : "—"}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: C.text,
          textShadow: `0 0 10px ${accent}55, 0 0 20px ${accent}33`,
        }}
      >
        {formatCurrencyShort(wallet.balance)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TransactionRow                                                       */
/* ------------------------------------------------------------------ */
function TransactionRow({ tx, index }) {
  const Icon = CATEGORY_ICONS[tx.category] || MoreHorizontal;
  const color = CATEGORY_COLORS[tx.category] || C.textSub;
  const isThu = tx.type === "thu";
  return (
    <div
      className="hometab-fadeup"
      style={{
        animationDelay: `${index * 50}ms`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 4px",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${color}1F`,
          border: `1px solid ${color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            color: C.text,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tx.note || tx.category}
        </div>
        <div style={{ fontSize: 11.5, color: C.textSub, marginTop: 2 }}>
          {timeAgo(tx.timestamp)}
        </div>
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: isThu ? C.green : C.red,
          flexShrink: 0,
        }}
      >
        {isThu ? "+" : "-"}
        {formatCurrencyShort(tx.amount)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TransferModal — chuyển tiền giữa 2 ví                                */
/* ------------------------------------------------------------------ */
function TransferModal({ open, onClose, wallets, onTransfer }) {
  const [fromId, setFromId] = useState(wallets[0]?.id || "cash");
  const [toId, setToId] = useState(wallets[1]?.id || "");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) {
      setFromId(wallets[0]?.id || "cash");
      setToId(wallets.find((w) => w.id !== wallets[0]?.id)?.id || "");
      setAmount("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const numAmount = Number(amount.replace(/\D/g, "")) || 0;
  const fromWallet = wallets.find((w) => w.id === fromId);
  const canSubmit =
    fromId && toId && fromId !== toId && numAmount > 0 && fromWallet
      ? numAmount <= fromWallet.balance
      : false;

  return (
    <BottomSheet open={open} onClose={onClose} title="Chuyển khoản" accent={C.cyan}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>
            Từ ví
          </div>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            style={selectStyle}
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.type === "cash" ? "Tiền mặt" : w.name} —{" "}
                {formatCurrencyShort(w.balance)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: C.cyanDim,
              border: `1px solid ${C.cyan}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeftRight size={16} color={C.cyan} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>
            Đến ví
          </div>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            style={selectStyle}
          >
            <option value="">— Chọn ví nhận —</option>
            {wallets
              .filter((w) => w.id !== fromId)
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.type === "cash" ? "Tiền mặt" : w.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>
            Số tiền
          </div>
          <input
            inputMode="numeric"
            value={amount ? Number(amount).toLocaleString("vi-VN") : ""}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            style={inputStyle}
          />
          {fromWallet && numAmount > fromWallet.balance && (
            <div style={{ color: C.red, fontSize: 11.5, marginTop: 6 }}>
              Số dư ví nguồn không đủ.
            </div>
          )}
        </div>

        <button
          disabled={!canSubmit}
          onClick={() => {
            onTransfer(fromId, toId, numAmount);
            onClose();
          }}
          className="hometab-press"
          style={{
            ...primaryBtnStyle,
            opacity: canSubmit ? 1 : 0.4,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          Xác nhận chuyển
        </button>
      </div>
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/* BudgetModal — đặt hạn mức ngân sách theo danh mục (chỉ nhóm Chi)     */
/* ------------------------------------------------------------------ */
function BudgetModal({ open, onClose, budgets, onSaveBudgets }) {
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (open) {
      const init = {};
      CHI_CATEGORIES.forEach((c) => (init[c] = budgets?.[c] || 0));
      setDraft(init);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BottomSheet open={open} onClose={onClose} title="Ngân sách tháng" accent={C.purple}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {CHI_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || MoreHorizontal;
          const color = CATEGORY_COLORS[cat] || C.textSub;
          return (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: `${color}1F`,
                  border: `1px solid ${color}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color={color} />
              </div>
              <div style={{ flex: 1, fontSize: 13, color: C.textMid }}>{cat}</div>
              <input
                inputMode="numeric"
                value={draft[cat] ? Number(draft[cat]).toLocaleString("vi-VN") : ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    [cat]: Number(e.target.value.replace(/\D/g, "")) || 0,
                  }))
                }
                placeholder="0"
                style={{ ...inputStyle, width: 130, textAlign: "right" }}
              />
            </div>
          );
        })}

        <button
          onClick={() => {
            onSaveBudgets(draft);
            onClose();
          }}
          className="hometab-press"
          style={{ ...primaryBtnStyle, background: C.purple, boxShadow: `0 0 18px ${C.purpleGlow}` }}
        >
          Lưu ngân sách
        </button>
      </div>
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/* AddWalletModal — thêm ví ngân hàng / thẻ ATM                         */
/* ------------------------------------------------------------------ */
function AddWalletModal({ open, onClose, mode, onAddBank }) {
  // mode: "bank" | "atm"
  const [bankName, setBankName] = useState(BANK_LIST[0]);
  const [accountNo, setAccountNo] = useState("");
  const [cardNo, setCardNo] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    if (open) {
      setBankName(BANK_LIST[0]);
      setAccountNo("");
      setCardNo("");
      setAccountName("");
    }
  }, [open, mode]);

  const numberField = mode === "atm" ? cardNo : accountNo;
  const canSubmit = bankName && numberField.trim().length >= 4 && accountName.trim();

  const handleSubmit = () => {
    const qrText =
      mode === "atm"
        ? `Ngan hang: ${bankName} | So the: ${cardNo} | Chu the: ${accountName}`
        : `Ngan hang: ${bankName} | So TK: ${accountNo} | Chu TK: ${accountName}`;

    const wallet = {
      id: genId(mode),
      name: bankName,
      type: mode,
      balance: 0,
      icon: bankName.slice(0, 3).toUpperCase(),
      color: BANK_COLORS[bankName] || C.cyan,
      accountNo: mode === "bank" ? accountNo : undefined,
      cardNo: mode === "atm" ? cardNo : undefined,
      accountName,
      qrReceive: qrUrl(`${qrText} | Muc dich: Nhan tien`),
      qrPay: qrUrl(`${qrText} | Muc dich: Chuyen tien`),
    };
    onAddBank(wallet);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={mode === "atm" ? "Thêm thẻ ATM" : "Thêm tài khoản ngân hàng"}
      accent={C.cyan}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>Ngân hàng</div>
          <select value={bankName} onChange={(e) => setBankName(e.target.value)} style={selectStyle}>
            {BANK_LIST.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>
            {mode === "atm" ? "Số thẻ" : "Số tài khoản"}
          </div>
          <input
            value={mode === "atm" ? cardNo : accountNo}
            onChange={(e) =>
              mode === "atm"
                ? setCardNo(e.target.value.replace(/\D/g, ""))
                : setAccountNo(e.target.value.replace(/\D/g, ""))
            }
            placeholder={mode === "atm" ? "VD: 9704 1234 5678 9012" : "VD: 0123456789"}
            style={inputStyle}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>Chủ tài khoản</div>
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value.toUpperCase())}
            placeholder="VD: NGUYEN VAN A"
            style={inputStyle}
          />
        </div>

        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="hometab-press"
          style={{
            ...primaryBtnStyle,
            opacity: canSubmit ? 1 : 0.4,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          Lưu ví
        </button>
      </div>
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/* WalletQRModal — hiển thị QR nhận tiền / chuyển tiền                  */
/* ------------------------------------------------------------------ */
function WalletQRModal({ open, onClose, wallet }) {
  const [tab, setTab] = useState("receive");
  useEffect(() => {
    if (open) setTab("receive");
  }, [open]);

  if (!wallet) return null;
  const src = tab === "receive" ? wallet.qrReceive : wallet.qrPay;

  return (
    <BottomSheet open={open} onClose={onClose} title={wallet.name} accent={wallet.color}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <button
            onClick={() => setTab("receive")}
            className="hometab-press"
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: `1px solid ${tab === "receive" ? C.green : C.border}`,
              background: tab === "receive" ? C.greenDim : "transparent",
              color: tab === "receive" ? C.green : C.textSub,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Nhận tiền
          </button>
          <button
            onClick={() => setTab("pay")}
            className="hometab-press"
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: `1px solid ${tab === "pay" ? C.cyan : C.border}`,
              background: tab === "pay" ? C.cyanDim : "transparent",
              color: tab === "pay" ? C.cyan : C.textSub,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Chuyển tiền
          </button>
        </div>

        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: 20,
            background: "#fff",
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 30px ${wallet.color}55`,
          }}
        >
          {src ? (
            <img src={src} alt="QR" style={{ width: "100%", height: "100%" }} />
          ) : (
            <QrCode size={80} color="#ccc" />
          )}
        </div>

        <div style={{ textAlign: "center", color: C.textMid, fontSize: 13 }}>
          {wallet.accountName}
          <br />
          <span style={{ fontFamily: "monospace", color: C.textSub }}>
            {wallet.type === "atm" ? wallet.cardNo : wallet.accountNo}
          </span>
        </div>
      </div>
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/* Shared inline styles                                                 */
/* ------------------------------------------------------------------ */
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

const selectStyle = { ...inputStyle, appearance: "none" };

const primaryBtnStyle = {
  width: "100%",
  padding: "14px 0",
  borderRadius: 14,
  border: "none",
  background: C.cyan,
  color: "#04141A",
  fontWeight: 800,
  fontSize: 14.5,
  boxShadow: `0 0 18px ${C.cyanGlow}`,
  marginTop: 4,
};

/* ------------------------------------------------------------------ */
/* HomeTab — component chính                                            */
/* ------------------------------------------------------------------ */
export default function HomeTab({
  onAdd, // eslint-disable-line no-unused-vars -- khai báo để khớp interface, FAB do phần khác render
  txList = [],
  wallets = [],
  onAddBank,
  onEditWallet,
  onRemoveWallet,
  onNavigate,
  onTransfer,
  onScanReceipt,
  budgets = {},
  onSaveBudgets,
}) {
  const [now, setNow] = useState(new Date());
  const [userName] = useState("Bạn");

  const [transferOpen, setTransferOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [addWalletMode, setAddWalletMode] = useState(null); // "bank" | "atm" | null
  const [qrWallet, setQrWallet] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null); // wallet pending removal

  const fileInputRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ---- tính toán từ txList (không hard-code) ---- */
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of txList) {
      if (t.type === "thu") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, balance: income - expense };
  }, [txList]);

  const recentTx = useMemo(() => {
    return [...txList]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  }, [txList]);

  const chartData = useMemo(() => {
    const nowD = new Date();
    const month = nowD.getMonth();
    const year = nowD.getFullYear();
    const monthTx = txList
      .filter((t) => {
        const d = new Date(t.timestamp);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (monthTx.length === 0) return [{ label: "", balance: 0 }];

    let running = 0;
    return monthTx.map((t) => {
      running += t.type === "thu" ? t.amount : -t.amount;
      const d = new Date(t.timestamp);
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, balance: running };
    });
  }, [txList]);

  const savingsPct =
    totals.income > 0 ? Math.round((totals.balance / totals.income) * 100) : null;

  const handleScanFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onScanReceipt?.(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div style={{ position: "relative", zIndex: 1, padding: "20px 16px 100px" }}>
      <style>{`
        @keyframes hometab-sheet-up {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes hometab-fadeup-kf {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .hometab-fadeup {
          animation: hometab-fadeup-kf 0.4s ease both;
        }
        .hometab-press {
          transition: transform 0.12s ease;
        }
        .hometab-press:active {
          transform: scale(0.96);
        }
        .hometab-wallet-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ---------- Header ---------- */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: C.textSub }}>
            {greetingByHour(now.getHours())}, {userName} 👋
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginTop: 2 }}>
            Tổng quan tài chính
          </div>
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 15,
            color: C.cyan,
            textShadow: `0 0 10px ${C.cyanGlow}`,
            background: C.cyanDim,
            border: `1px solid ${C.cyan}33`,
            borderRadius: 12,
            padding: "8px 12px",
          }}
        >
          {now.toLocaleTimeString("vi-VN", { hour12: false })}
        </div>
      </div>

      {/* ---------- Thẻ tổng số dư ---------- */}
      <div
        style={{
          background: `linear-gradient(160deg, ${C.card} 0%, #0D1420 100%)`,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 22,
          padding: "22px 20px",
          marginBottom: 16,
          boxShadow: `0 0 30px ${totals.balance >= 0 ? C.cyanGlow : C.redGlow}`,
        }}
      >
        <div style={{ fontSize: 12.5, color: C.textSub, marginBottom: 6 }}>Số dư tổng</div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: C.text,
            textShadow: `0 0 10px ${C.cyanGlow}, 0 0 24px ${C.cyanGlow}`,
            letterSpacing: -0.5,
          }}
        >
          {formatCurrency(totals.balance)}
        </div>
        <div
          style={{
            fontSize: 12.5,
            marginTop: 6,
            fontWeight: 600,
            color: totals.balance >= 0 ? C.green : C.red,
          }}
        >
          {totals.balance >= 0
            ? savingsPct !== null
              ? `Tiết kiệm ${savingsPct}% thu nhập`
              : "Chưa có dữ liệu thu nhập"
            : "⚠ Chi vượt thu nhập"}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <div
            style={{
              flex: 1,
              background: C.greenDim,
              border: `1px solid ${C.green}33`,
              borderRadius: 14,
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <ArrowDownCircle size={14} color={C.green} />
              <span style={{ fontSize: 11.5, color: C.textSub }}>Thu nhập</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>
              {formatCurrencyShort(totals.income)}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: C.redDim,
              border: `1px solid ${C.red}33`,
              borderRadius: 14,
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <ArrowUpCircle size={14} color={C.red} />
              <span style={{ fontSize: 11.5, color: C.textSub }}>Chi tiêu</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.red }}>
              {formatCurrencyShort(totals.expense)}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 4 thao tác nhanh ---------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <QuickActionButton
          icon={ScanLine}
          label="Quét hoá đơn"
          color={C.purple}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleScanFile}
          />
        </QuickActionButton>
        <QuickActionButton
          icon={ArrowLeftRight}
          label="Chuyển khoản"
          color={C.cyan}
          onClick={() => setTransferOpen(true)}
        />
        <QuickActionButton
          icon={BarChart3}
          label="Phân tích"
          color={C.green}
          onClick={() => onNavigate?.(2)}
        />
        <QuickActionButton
          icon={Wallet2}
          label="Ngân sách"
          color={C.yellow}
          onClick={() => setBudgetOpen(true)}
        />
      </div>

      {/* ---------- Danh sách ví ---------- */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Ví & tài khoản</span>
        </div>
        <div
          className="hometab-wallet-scroll"
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {wallets.map((w, i) => (
            <WalletCard
              key={w.id}
              wallet={w}
              index={i}
              onOpenQR={setQrWallet}
              onEdit={(wallet) => onEditWallet?.(wallet.id, wallet)}
              onRemove={(wallet) => setConfirmRemove(wallet)}
            />
          ))}

          <button
            onClick={() => setAddWalletMode("bank")}
            className="hometab-press"
            style={{
              minWidth: 108,
              borderRadius: 18,
              border: `1px dashed ${C.cyan}55`,
              background: C.cyanDim,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: C.cyan,
              flexShrink: 0,
            }}
          >
            <Landmark size={18} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>+ Ngân hàng</span>
          </button>

          <button
            onClick={() => setAddWalletMode("atm")}
            className="hometab-press"
            style={{
              minWidth: 108,
              borderRadius: 18,
              border: `1px dashed ${C.purple}55`,
              background: `${C.purple}1A`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: C.purple,
              flexShrink: 0,
            }}
          >
            <CreditCard size={18} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>+ Thẻ ATM</span>
          </button>
        </div>
      </div>

      {/* ---------- Biểu đồ số dư tháng này ---------- */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 18,
          padding: "16px 12px 8px",
          marginBottom: 22,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, padding: "0 6px 8px" }}>
          Số dư tháng này
        </div>
        <div style={{ width: "100%", height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="hometabAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.cyan} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: C.textSub, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{
                  background: C.card,
                  border: `1px solid ${C.cyan}44`,
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: C.textSub }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={C.cyan}
                strokeWidth={2}
                fill="url(#hometabAreaFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---------- Giao dịch gần đây ---------- */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Giao dịch gần đây</span>
        </div>
        {recentTx.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: C.textSub, fontSize: 13 }}>
            Chưa có giao dịch nào.
          </div>
        ) : (
          recentTx.map((tx, i) => <TransactionRow key={tx.id} tx={tx} index={i} />)
        )}
      </div>

      {/* ---------- Modals ---------- */}
      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        wallets={wallets}
        onTransfer={onTransfer}
      />
      <BudgetModal
        open={budgetOpen}
        onClose={() => setBudgetOpen(false)}
        budgets={budgets}
        onSaveBudgets={onSaveBudgets}
      />
      <AddWalletModal
        open={!!addWalletMode}
        mode={addWalletMode}
        onClose={() => setAddWalletMode(null)}
        onAddBank={onAddBank}
      />
      <WalletQRModal open={!!qrWallet} wallet={qrWallet} onClose={() => setQrWallet(null)} />

      {/* Xác nhận xoá ví */}
      <BottomSheet
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Xoá ví"
        accent={C.red}
      >
        <div style={{ color: C.textMid, fontSize: 14, marginBottom: 18 }}>
          Bạn có chắc muốn xoá ví <b style={{ color: C.text }}>{confirmRemove?.name}</b>? Hành động
          này không thể hoàn tác.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setConfirmRemove(null)}
            className="hometab-press"
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
              onRemoveWallet?.(confirmRemove.id);
              setConfirmRemove(null);
            }}
            className="hometab-press"
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
            Xoá ví
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
