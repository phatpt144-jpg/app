/**
 * App.jsx — PHẦN 6/6: APP SHELL (Khung tổng)
 * ------------------------------------------------------------------
 * App quản lý tài chính cá nhân — phong cách Cyberpunk/Neon.
 *
 * Nhiệm vụ của file này:
 *  1. Vẽ nền động toàn app bằng canvas (lưới phối cảnh neon, hạt sáng,
 *     sao băng) — đặt phía sau mọi nội dung (z-index: 0).
 *  2. Giữ toàn bộ state gốc của app và đồng bộ với localStorage (gộp
 *     tất cả vào 1 key duy nhất để tránh ghi ổ đĩa liên tục).
 *  3. Cung cấp các hàm xử lý (handlers) rồi truyền xuống 5 tab/module
 *     qua props đúng tên đã quy định trong Data Contract.
 *  4. Điều hướng: thanh tab dưới cùng + nút FAB nổi mở modal thêm
 *     giao dịch từ bất kỳ tab nào.
 * ------------------------------------------------------------------
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Home,
  History,
  BarChart3,
  HandCoins,
  Gem,
  Plus,
} from "lucide-react";

import HomeTab from "./HomeTab.jsx";
import { AddModal, HistoryTab } from "./TransactionModule.jsx";
import StatsTab from "./StatsTab.jsx";
import { DebtTab } from "./DebtModule.jsx";
import AssetTab from "./AssetTab.jsx";
import { loadAppState, saveAppState } from "./storage.js";

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

const STORAGE_KEY = "cyberfin_data_v1";
const GOLD_REF_PRICE = 8_850_000; // mốc tham chiếu giá vàng, VNĐ/chỉ

const TABS = [
  { label: "Trang chủ", icon: Home },
  { label: "Lịch sử", icon: History },
  { label: "Thống kê", icon: BarChart3 },
  { label: "Ghi nợ", icon: HandCoins },
  { label: "Tài sản", icon: Gem },
];

/* ------------------------------------------------------------------ */
/* Dữ liệu mặc định — app khởi động phải trống, không mock data        */
/* ------------------------------------------------------------------ */
function defaultBudgets() {
  return CHI_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {});
}

function defaultState() {
  return {
    wallets: [
      {
        id: "cash",
        name: "Tiền mặt",
        type: "cash",
        balance: 0,
        icon: "cash",
        color: C.green,
      },
    ],
    txList: [],
    budgets: defaultBudgets(),
    goldHoldings: [],
    goldPrice: 0,
    goldChange: 0,
    goldUpdated: null,
    debts: [],
  };
}

function mergeWithDefaults(parsed) {
  const base = defaultState();
  if (!parsed) return base;
  return {
    ...base,
    ...parsed,
    wallets:
      Array.isArray(parsed.wallets) && parsed.wallets.length > 0
        ? parsed.wallets
        : base.wallets,
    budgets: { ...base.budgets, ...(parsed.budgets || {}) },
  };
}

/* ------------------------------------------------------------------ */
/* Nền động canvas — lưới phối cảnh neon, hạt sáng, sao băng            */
/* ------------------------------------------------------------------ */
function AnimatedBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    let particles = [];
    let blobs = [];
    let shootingStar = null;
    let shootingStarTimer = 0;
    let t = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initScene() {
      particles = Array.from({ length: 46 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.6,
        speed: 0.15 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.2,
        alpha: 0.2 + Math.random() * 0.6,
        hue: Math.random() > 0.5 ? C.cyan : C.purple,
      }));
      blobs = [
        { x: w * 0.2, y: h * 0.25, r: w * 0.45, color: C.cyan, vx: 0.05, vy: 0.03 },
        { x: w * 0.8, y: h * 0.6, r: w * 0.4, color: C.purple, vx: -0.04, vy: 0.02 },
        { x: w * 0.5, y: h * 0.85, r: w * 0.35, color: C.green, vx: 0.03, vy: -0.02 },
      ];
    }

    function drawGrid() {
      const horizonY = h * 0.52;

      // Bầu trời — lưới phẳng mờ nửa trên
      ctx.save();
      ctx.strokeStyle = "rgba(0,240,255,0.05)";
      ctx.lineWidth = 1;
      const skyStep = 34;
      for (let x = -skyStep; x < w + skyStep; x += skyStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, horizonY);
        ctx.stroke();
      }
      for (let y = 0; y < horizonY; y += skyStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      // Đường chân trời phát sáng
      const glow = ctx.createLinearGradient(0, horizonY - 20, 0, horizonY + 20);
      glow.addColorStop(0, "rgba(0,240,255,0)");
      glow.addColorStop(0.5, "rgba(0,240,255,0.55)");
      glow.addColorStop(1, "rgba(0,240,255,0)");
      ctx.save();
      ctx.fillStyle = glow;
      ctx.fillRect(0, horizonY - 20, w, 40);
      ctx.restore();

      // Lưới phối cảnh neon nửa dưới
      ctx.save();
      ctx.strokeStyle = "rgba(0,240,255,0.28)";
      ctx.lineWidth = 1;
      const vanishX = w / 2;
      const spread = w * 1.4;
      const cols = 14;
      for (let i = -cols; i <= cols; i++) {
        const xBottom = vanishX + (i / cols) * spread;
        ctx.beginPath();
        ctx.moveTo(vanishX, horizonY);
        ctx.lineTo(xBottom, h);
        ctx.stroke();
      }
      const rows = 10;
      const scrollOffset = (t * 0.6) % 1;
      for (let j = 0; j < rows; j++) {
        const progress = (j + scrollOffset) / rows;
        const y = horizonY + Math.pow(progress, 2.2) * (h - horizonY);
        const alpha = 0.35 * (1 - progress * 0.6);
        ctx.strokeStyle = `rgba(0,240,255,${Math.max(alpha, 0)})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawBlobs() {
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -b.r * 0.3 || b.x > w + b.r * 0.3) b.vx *= -1;
        if (b.y < -b.r * 0.3 || b.y > h + b.r * 0.3) b.vy *= -1;
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, `${b.color}22`);
        grad.addColorStop(1, `${b.color}00`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawParticles() {
      for (const p of particles) {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.hue;
        ctx.shadowColor = p.hue;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function maybeSpawnShootingStar() {
      shootingStarTimer -= 1;
      if (!shootingStar && shootingStarTimer <= 0) {
        if (Math.random() < 0.006) {
          shootingStar = {
            x: Math.random() * w * 0.6 + w * 0.2,
            y: Math.random() * h * 0.2,
            vx: 5 + Math.random() * 4,
            vy: 2.5 + Math.random() * 2,
            life: 0,
            maxLife: 40,
          };
          shootingStarTimer = 260 + Math.random() * 300;
        }
      }
    }

    function drawShootingStar() {
      if (!shootingStar) return;
      const s = shootingStar;
      s.x += s.vx;
      s.y += s.vy;
      s.life += 1;
      const alpha = Math.max(0, 1 - s.life / s.maxLife);
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = C.cyan;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 6, s.y - s.vy * 6);
      ctx.stroke();
      ctx.restore();
      if (s.life >= s.maxLife || s.x > w + 40 || s.y > h + 40) {
        shootingStar = null;
      }
    }

    function frame() {
      t += 0.01;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      drawBlobs();
      drawGrid();
      drawParticles();
      maybeSpawnShootingStar();
      drawShootingStar();
      rafRef.current = requestAnimationFrame(frame);
    }

    resize();
    initScene();
    frame();

    const handleResize = () => {
      resize();
      initScene();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "block",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* App gốc                                                              */
/* ------------------------------------------------------------------ */
export default function App() {
  const [state, setState] = useState(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalPhoto, setAddModalPhoto] = useState(null);

  const {
    wallets,
    txList,
    budgets,
    goldHoldings,
    goldPrice,
    goldChange,
    goldUpdated,
    debts,
  } = state;
  const [goldLoading, setGoldLoading] = useState(false);

  // Nạp dữ liệu 1 lần khi mount — đọc từ IndexedDB (chứa được ảnh lớn,
  // không giới hạn ~5-10MB như localStorage). Nếu máy còn dữ liệu cũ lưu
  // bằng localStorage (bản trước), tự chuyển (migrate) sang IndexedDB.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let saved = await loadAppState();
      if (!saved) {
        try {
          const legacyRaw = localStorage.getItem(STORAGE_KEY);
          if (legacyRaw) {
            saved = JSON.parse(legacyRaw);
            await saveAppState(saved);
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (e) {
          console.warn("Không đọc được dữ liệu cũ từ localStorage.", e);
        }
      }
      if (!cancelled) {
        if (saved) setState(mergeWithDefaults(saved));
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lưu xuống IndexedDB mỗi khi state thay đổi (gộp 1 object duy nhất).
  // Chỉ lưu sau khi đã hydrate xong, để không ghi đè dữ liệu thật bằng
  // dữ liệu mặc định lúc app vừa mở lên.
  useEffect(() => {
    if (!hydrated) return;
    saveAppState(state);
  }, [state, hydrated]);

  const patchState = useCallback((patch) => {
    setState((prev) => ({
      ...prev,
      ...(typeof patch === "function" ? patch(prev) : patch),
    }));
  }, []);

  /* ---------------- Giao dịch ---------------- */
  const handleAdd = useCallback((tx) => {
    setState((prev) => ({
      ...prev,
      txList: [tx, ...prev.txList],
      wallets: prev.wallets.map((w) => {
        if (w.id !== tx.wallet) return w;
        const delta = tx.type === "thu" ? tx.amount : -tx.amount;
        return { ...w, balance: (w.balance || 0) + delta };
      }),
    }));
  }, []);

  const handleScanReceipt = useCallback((base64) => {
    setAddModalPhoto(base64);
    setAddModalOpen(true);
  }, []);

  /* ---------------- Ví ---------------- */
  const handleAddBank = useCallback((wallet) => {
    setState((prev) => ({ ...prev, wallets: [...prev.wallets, wallet] }));
  }, []);

  const handleEditWallet = useCallback((walletId, patch) => {
    setState((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) =>
        w.id === walletId ? { ...w, ...patch } : w
      ),
    }));
  }, []);

  const handleRemoveWallet = useCallback((walletId) => {
    setState((prev) => ({
      ...prev,
      wallets: prev.wallets.filter((w) => w.id !== walletId),
    }));
  }, []);

  const handleTransfer = useCallback((fromId, toId, amount) => {
    setState((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) => {
        if (w.id === fromId) return { ...w, balance: (w.balance || 0) - amount };
        if (w.id === toId) return { ...w, balance: (w.balance || 0) + amount };
        return w;
      }),
    }));
  }, []);

  const handleSaveBudgets = useCallback((newBudgets) => {
    patchState({ budgets: newBudgets });
  }, [patchState]);

  /* ---------------- Vàng ---------------- */
  const handleAddGold = useCallback((holding) => {
    setState((prev) => ({
      ...prev,
      goldHoldings: [holding, ...prev.goldHoldings],
    }));
  }, []);

  const handleEditGold = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      goldHoldings: prev.goldHoldings.map((g) =>
        g.id === id ? { ...g, ...patch } : g
      ),
    }));
  }, []);

  const handleRemoveGold = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      goldHoldings: prev.goldHoldings.filter((g) => g.id !== id),
    }));
  }, []);

  const fetchGold = useCallback(() => {
    setGoldLoading(true);
    setTimeout(() => {
      const noise = Math.round((Math.random() - 0.5) * 2 * 60_000);
      const newPrice = GOLD_REF_PRICE + noise;
      setState((prev) => {
        const prevPrice = prev.goldPrice || GOLD_REF_PRICE;
        return {
          ...prev,
          goldPrice: newPrice,
          goldChange: newPrice - prevPrice,
          goldUpdated: new Date().toISOString(),
        };
      });
      setGoldLoading(false);
    }, 1200);
  }, []);

  /* ---------------- Ghi nợ ---------------- */
  const handleAddDebt = useCallback((debt) => {
    setState((prev) => ({ ...prev, debts: [debt, ...prev.debts] }));
  }, []);

  const handleEditDebt = useCallback((debt) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === debt.id ? debt : d)),
    }));
  }, []);

  const handleRemoveDebt = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  }, []);

  /* ---------------- Render ---------------- */
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 0:
        return (
          <HomeTab
            onAdd={() => setAddModalOpen(true)}
            txList={txList}
            wallets={wallets}
            onAddBank={handleAddBank}
            onEditWallet={handleEditWallet}
            onRemoveWallet={handleRemoveWallet}
            onNavigate={setActiveTab}
            onTransfer={handleTransfer}
            onScanReceipt={handleScanReceipt}
            budgets={budgets}
            onSaveBudgets={handleSaveBudgets}
          />
        );
      case 1:
        return <HistoryTab txList={txList} wallets={wallets} />;
      case 2:
        return <StatsTab txList={txList} />;
      case 3:
        return (
          <DebtTab
            debts={debts}
            onAddDebt={handleAddDebt}
            onEditDebt={handleEditDebt}
            onRemoveDebt={handleRemoveDebt}
          />
        );
      case 4:
        return (
          <AssetTab
            wallets={wallets}
            goldHoldings={goldHoldings}
            goldPrice={goldPrice}
            goldChange={goldChange}
            goldLoading={goldLoading}
            goldUpdated={goldUpdated}
            onFetchGold={fetchGold}
            onAddGold={handleAddGold}
            onEditGold={handleEditGold}
            onRemoveGold={handleRemoveGold}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab,
    txList,
    wallets,
    budgets,
    debts,
    goldHoldings,
    goldPrice,
    goldChange,
    goldLoading,
    goldUpdated,
    handleAddBank,
    handleEditWallet,
    handleRemoveWallet,
    handleTransfer,
    handleScanReceipt,
    handleSaveBudgets,
    handleAddDebt,
    handleEditDebt,
    handleRemoveDebt,
    fetchGold,
    handleAddGold,
    handleEditGold,
    handleRemoveGold,
  ]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'Space Grotesk', sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: ${C.bg}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,240,255,0.2); border-radius: 4px; }
        .app-shell-press:active { transform: scale(0.96); }
        .app-shell-tab-btn { transition: color 0.15s, transform 0.15s; }
        .app-shell-fab { transition: transform 0.15s, box-shadow 0.15s; }
      `}</style>

      <AnimatedBackground />

      {!hydrated ? (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 430,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: `3px solid ${C.cyanDim}`,
              borderTopColor: C.cyan,
              animation: "app-shell-spin 0.8s linear infinite",
            }}
          />
          <span style={{ color: C.textSub, fontSize: 13 }}>Đang tải dữ liệu...</span>
          <style>{`@keyframes app-shell-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 430,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ---------- Nội dung tab đang chọn ---------- */}
        <div style={{ flex: 1, overflowY: "auto" }}>{tabContent}</div>

        {/* ---------- Nút FAB thêm giao dịch ---------- */}
        <button
          onClick={() => {
            setAddModalPhoto(null);
            setAddModalOpen(true);
          }}
          className="app-shell-fab app-shell-press"
          aria-label="Thêm giao dịch"
          style={{
            position: "fixed",
            bottom: 84,
            left: "50%",
            transform: "translateX(calc(-50% + 155px))",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
            color: "#04141a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 22px ${C.cyanGlow}, 0 4px 18px rgba(0,0,0,0.5)`,
            cursor: "pointer",
            zIndex: 50,
          }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>

        {/* ---------- Thanh điều hướng dưới cùng ---------- */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            background: "rgba(10,11,13,0.85)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            padding: "8px 4px calc(env(safe-area-inset-bottom, 0px) + 8px)",
          }}
        >
          {TABS.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = activeTab === i;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className="app-shell-tab-btn app-shell-press"
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: isActive ? C.cyan : C.textSub,
                  position: "relative",
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 2}
                  style={
                    isActive
                      ? { filter: `drop-shadow(0 0 6px ${C.cyanGlow})` }
                      : undefined
                  }
                />
                <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 500 }}>
                  {tab.label}
                </span>
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -8,
                      width: 18,
                      height: 3,
                      borderRadius: 3,
                      background: C.cyan,
                      boxShadow: `0 0 8px ${C.cyanGlow}`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* ---------- Modal thêm giao dịch (mở từ FAB hoặc quét hoá đơn) ---------- */}
      {addModalOpen && (
        <AddModal
          onClose={() => {
            setAddModalOpen(false);
            setAddModalPhoto(null);
          }}
          onAdd={handleAdd}
          wallets={wallets}
          initialPhoto={addModalPhoto}
        />
      )}
    </div>
  );
}
