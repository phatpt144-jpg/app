/**
 * StatsTab.jsx — PHẦN 3/6: TAB THỐNG KÊ
 * ------------------------------------------------------------------
 * App quản lý tài chính cá nhân — phong cách Cyberpunk/Neon.
 * Component này CHỈ nhận `txList` qua props và tự tính toán MỌI số liệu
 * bên trong (useMemo) — không hard-code số liệu mẫu, không tự lưu trữ
 * dữ liệu nguồn (không localStorage).
 *
 * Props:
 *   { txList }   // Transaction[]
 *
 * Sub-component nội bộ trong file này (liệt kê để người ráp nối biết
 * cấu trúc — có thể tách file sau nếu cần):
 *   - PeriodPill        : 1 nút pill trong bộ lọc kỳ (Ngày/Tuần/Tháng/Năm)
 *   - DateRangePicker   : bottom sheet chọn khoảng ngày tuỳ chỉnh
 *                         (bản tự làm — thay được bằng component chung
 *                         cùng tên từ phần "Lịch sử" nếu có, miễn giữ
 *                         props { open, onClose, onApply(start,end), initialStart, initialEnd })
 *   - StatCard          : 1 thẻ Tổng thu / Tổng chi
 *   - CategoryDonut     : biểu đồ tròn phân tích chi tiêu theo danh mục
 *   - WeekBarChart      : biểu đồ cột thu/chi 7 ngày gần nhất
 * ------------------------------------------------------------------
 */

import React, { useState, useMemo } from "react";
import {
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  PieChart as PieChartIcon,
  X,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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

const CATEGORY_COLORS = {
  "Ăn uống": C.yellow,
  "Di chuyển": C.cyan,
  "Mua sắm": C.purple,
  "Giải trí": "#FF61D8",
  "Y tế": C.red,
  "Học tập": "#6C7CFF",
  Khác: C.textSub,
};

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const PERIODS = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
  { key: "year", label: "Năm" },
  { key: "custom", label: "Tuỳ chọn" },
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

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d) {
  // Tuần bắt đầu từ Thứ Hai
  const x = startOfDay(d);
  const day = x.getDay(); // 0=CN
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfYear(d) {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function getRange(period, customStart, customEnd) {
  const now = new Date();
  switch (period) {
    case "day":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now), end: endOfDay(now) };
    case "month":
      return { start: startOfMonth(now), end: endOfDay(now) };
    case "year":
      return { start: startOfYear(now), end: endOfDay(now) };
    case "custom":
      return {
        start: customStart ? startOfDay(customStart) : startOfMonth(now),
        end: customEnd ? endOfDay(customEnd) : endOfDay(now),
      };
    default:
      return { start: startOfMonth(now), end: endOfDay(now) };
  }
}

function toInputDate(d) {
  if (!d) return "";
  const x = new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}

/* ------------------------------------------------------------------ */
/* PeriodPill                                                           */
/* ------------------------------------------------------------------ */
function PeriodPill({ active, label, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="stats-press"
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? C.cyan : C.border}`,
        background: active ? C.cyanDim : "rgba(255,255,255,0.03)",
        color: active ? C.cyan : C.textSub,
        fontSize: 12.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 5,
        boxShadow: active ? `0 0 12px ${C.cyanGlow}` : "none",
        flexShrink: 0,
      }}
    >
      {Icon && <Icon size={13} />}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* DateRangePicker — bottom sheet chọn khoảng ngày tuỳ chỉnh            */
/* (thay được bằng component chung từ phần "Lịch sử" nếu đã có)         */
/* ------------------------------------------------------------------ */
function DateRangePicker({ open, onClose, onApply, initialStart, initialEnd }) {
  const [start, setStart] = useState(toInputDate(initialStart));
  const [end, setEnd] = useState(toInputDate(initialEnd));

  if (!open) return null;

  const canApply = start && end && new Date(start) <= new Date(end);

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
          background: C.card,
          borderRadius: "24px 24px 0 0",
          border: `1px solid ${C.cardBorder}`,
          borderBottom: "none",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          animation: "stats-sheet-up 0.28s cubic-bezier(.2,.8,.3,1)",
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
              textShadow: `0 0 12px ${C.cyanGlow}`,
            }}
          >
            Chọn khoảng ngày
          </div>
          <button
            onClick={onClose}
            className="stats-press"
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

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>Từ ngày</div>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>Đến ngày</div>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={inputStyle}
            />
          </div>
          {!canApply && start && end && (
            <div style={{ color: C.red, fontSize: 11.5 }}>
              Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
            </div>
          )}
          <button
            disabled={!canApply}
            onClick={() => {
              onApply(new Date(start), new Date(end));
              onClose();
            }}
            className="stats-press"
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 14,
              border: "none",
              background: C.cyan,
              color: "#04141A",
              fontWeight: 800,
              fontSize: 14.5,
              boxShadow: `0 0 18px ${C.cyanGlow}`,
              opacity: canApply ? 1 : 0.4,
              cursor: canApply ? "pointer" : "not-allowed",
            }}
          >
            Áp dụng
          </button>
        </div>
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
  colorScheme: "dark",
};

/* ------------------------------------------------------------------ */
/* StatCard                                                             */
/* ------------------------------------------------------------------ */
function StatCard({ label, value, color, dim, icon: Icon }) {
  return (
    <div
      style={{
        flex: 1,
        background: dim,
        border: `1px solid ${color}33`,
        borderRadius: 16,
        padding: "16px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Icon size={15} color={color} />
        <span style={{ fontSize: 12, color: C.textSub, fontWeight: 600 }}>{label}</span>
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 800,
          color,
          textShadow: `0 0 10px ${color}55`,
        }}
      >
        {formatCurrencyShort(value)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CategoryDonut — chi tiêu theo danh mục                               */
/* ------------------------------------------------------------------ */
function CategoryDonut({ data, total }) {
  if (data.length === 0) {
    return (
      <div
        style={{
          padding: "40px 0",
          textAlign: "center",
          color: C.textSub,
          fontSize: 13,
        }}
      >
        <PieChartIcon size={28} color={C.textSub} style={{ marginBottom: 8 }} />
        <div>Chưa có chi tiêu nào</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ position: "relative", width: 148, height: 148, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatCurrency(v)}
              contentStyle={{
                background: C.card,
                border: `1px solid ${C.cyan}44`,
                borderRadius: 10,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 10.5, color: C.textSub }}>Tổng chi</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: C.text,
              textShadow: `0 0 8px ${C.redGlow}`,
              textAlign: "center",
            }}
          >
            {formatCurrencyShort(total)}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        {data.map((d, i) => (
          <div
            key={d.name}
            className="stats-fadeup"
            style={{
              animationDelay: `${i * 60}ms`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 3,
                background: d.color,
                flexShrink: 0,
                boxShadow: `0 0 6px ${d.color}88`,
              }}
            />
            <span
              style={{
                fontSize: 12.5,
                color: C.textMid,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {d.name}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>
              {d.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* WeekBarChart — thu/chi 7 ngày gần nhất                               */
/* ------------------------------------------------------------------ */
function WeekBarChart({ data }) {
  return (
    <div style={{ width: "100%", height: 190 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: C.textSub, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: C.textSub, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrencyShort(v)}
            width={44}
          />
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
          <Bar dataKey="thu" name="Thu" fill={C.green} radius={[4, 4, 0, 0]} />
          <Bar dataKey="chi" name="Chi" fill={C.red} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatsTab — component chính                                           */
/* ------------------------------------------------------------------ */
export default function StatsTab({ txList = [] }) {
  const [period, setPeriod] = useState("month");
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [pickerOpen, setPickerOpen] = useState(false);

  const { start, end } = useMemo(
    () => getRange(period, customRange.start, customRange.end),
    [period, customRange]
  );

  const filteredTx = useMemo(() => {
    return txList.filter((t) => {
      const d = new Date(t.timestamp);
      return d >= start && d <= end;
    });
  }, [txList, start, end]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filteredTx) {
      if (t.type === "thu") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense };
  }, [filteredTx]);

  const donutData = useMemo(() => {
    const groups = {};
    for (const t of filteredTx) {
      if (t.type !== "chi") continue;
      groups[t.category] = (groups[t.category] || 0) + t.amount;
    }
    const total = Object.values(groups).reduce((a, b) => a + b, 0);
    if (total === 0) return { items: [], total: 0 };
    const items = Object.entries(groups)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || C.textSub,
        pct: Math.round((value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
    return { items, total };
  }, [filteredTx]);

  const weekData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({ date: startOfDay(d), label: WEEKDAY_LABELS[d.getDay()], thu: 0, chi: 0 });
    }
    for (const t of txList) {
      const d = startOfDay(new Date(t.timestamp));
      const bucket = days.find((day) => day.date.getTime() === d.getTime());
      if (bucket) {
        if (t.type === "thu") bucket.thu += t.amount;
        else bucket.chi += t.amount;
      }
    }
    return days;
  }, [txList]);

  const periodDisplayLabel = useMemo(() => {
    if (period !== "custom") return null;
    const s = start.toLocaleDateString("vi-VN");
    const e = end.toLocaleDateString("vi-VN");
    return `${s} → ${e}`;
  }, [period, start, end]);

  return (
    <div style={{ position: "relative", zIndex: 1, padding: "20px 16px 100px" }}>
      <style>{`
        @keyframes stats-sheet-up {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes stats-fadeup-kf {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .stats-fadeup { animation: stats-fadeup-kf 0.4s ease both; }
        .stats-press { transition: transform 0.12s ease; }
        .stats-press:active { transform: scale(0.96); }
        .stats-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 16 }}>
        Thống kê
      </div>

      {/* ---------- Bộ lọc kỳ ---------- */}
      <div
        className="stats-scroll"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          marginBottom: 14,
          scrollbarWidth: "none",
        }}
      >
        {PERIODS.map((p) =>
          p.key === "custom" ? (
            <PeriodPill
              key={p.key}
              icon={Calendar}
              label={periodDisplayLabel || p.label}
              active={period === "custom"}
              onClick={() => setPickerOpen(true)}
            />
          ) : (
            <PeriodPill
              key={p.key}
              label={p.label}
              active={period === p.key}
              onClick={() => setPeriod(p.key)}
            />
          )
        )}
      </div>

      {/* ---------- 2 thẻ Tổng thu / Tổng chi ---------- */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <StatCard
          label="Tổng thu"
          value={totals.income}
          color={C.green}
          dim={C.greenDim}
          icon={ArrowDownCircle}
        />
        <StatCard
          label="Tổng chi"
          value={totals.expense}
          color={C.red}
          dim={C.redDim}
          icon={ArrowUpCircle}
        />
      </div>

      {/* ---------- Donut chi tiêu theo danh mục ---------- */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 18,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 14 }}>
          Chi tiêu theo danh mục
        </div>
        <CategoryDonut data={donutData.items} total={donutData.total} />
      </div>

      {/* ---------- Bar chart 7 ngày gần nhất ---------- */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 18,
          padding: "16px 8px 10px",
        }}
      >
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, padding: "0 10px 6px" }}>
          Thu / Chi 7 ngày gần nhất
        </div>
        <WeekBarChart data={weekData} />
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: C.green }} />
            <span style={{ fontSize: 11.5, color: C.textSub }}>Thu</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: C.red }} />
            <span style={{ fontSize: 11.5, color: C.textSub }}>Chi</span>
          </div>
        </div>
      </div>

      <DateRangePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onApply={(s, e) => {
          setCustomRange({ start: s, end: e });
          setPeriod("custom");
        }}
        initialStart={customRange.start || new Date()}
        initialEnd={customRange.end || new Date()}
      />
    </div>
  );
}
