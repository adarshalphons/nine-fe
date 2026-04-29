import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────

const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000";

const COLORS = {
  bg: "#0d0d16",
  card: "#13131f",
  border: "#1e1e2e",
  indigo: "#6366f1",
  indigoLight: "#818cf8",
  text: "#f1f5f9",
  muted: "#94a3b8",
  green: "#34d399",
  red: "#f87171",
};

const FAILURE_DATA = [
  { name: "Good",            value: 72, color: COLORS.green,      description: "Correct garment fit, identity preserved, clean background." },
  { name: "Identity Loss",   value: 10, color: "#f59e0b",         description: "Subject's face or body features altered by the model." },
  { name: "Garment Bleed",   value: 8,  color: "#fb923c",         description: "Garment texture bleeds into background or body region." },
  { name: "Occlusion Fail",  value: 5,  color: "#a78bfa",         description: "Occluded areas (arms, accessories) rendered incorrectly." },
  { name: "Background Leak", value: 3,  color: COLORS.indigo,     description: "Background pixels appear inside the garment region." },
  { name: "Bad Fit",         value: 2,  color: COLORS.red,        description: "Garment geometry misaligned with body pose." },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTimestamp(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, unit = "" }) {
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      padding: "20px 24px",
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{ color: COLORS.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ color: COLORS.text, fontSize: 28, fontWeight: 700 }}>
        {value ?? "—"}{unit && <span style={{ fontSize: 16, color: COLORS.muted, marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ color: COLORS.text, fontSize: 16, fontWeight: 600, marginBottom: 16, letterSpacing: "0.03em" }}>
      {children}
    </h2>
  );
}

// ─── Section: Cost Economics ─────────────────────────────────────────────────

function CostEconomics() {
  const [volume, setVolume] = useState(10000);
  const [projection, setProjection] = useState(null);

  const fetchProjection = useCallback(async (vol) => {
    try {
      const res = await fetch(`${API_URL}/analytics/cost_projection?monthly_volume=${vol}`);
      if (!res.ok) return;
      setProjection(await res.json());
    } catch {
      // silently ignore — stale data remains visible
    }
  }, []);

  useEffect(() => {
    fetchProjection(volume);
  }, [volume, fetchProjection]);

  const barData = projection
    ? [
        {
          name: "Current (API)",
          cost: projection.current_monthly_cost_dollars,
          fill: COLORS.red,
        },
        {
          name: "Proprietary Model",
          cost: projection.proprietary_model_monthly_cost_dollars,
          fill: COLORS.green,
        },
      ]
    : [];

  return (
    <section style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
      <SectionTitle>Unit Economics — API vs Proprietary Model</SectionTitle>

      {/* Slider */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: COLORS.muted, fontSize: 13, display: "block", marginBottom: 8 }}>
          Monthly Volume:{" "}
          <span style={{ color: COLORS.indigoLight, fontWeight: 600 }}>
            {volume.toLocaleString()} try-ons
          </span>
        </label>
        <input
          type="range"
          min={1000}
          max={1000000}
          step={1000}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: "100%", accentColor: COLORS.indigo, cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.muted, fontSize: 11, marginTop: 4 }}>
          <span>1,000</span><span>1,000,000</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Bar chart */}
        <div style={{ flex: "1 1 300px" }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <Tooltip
                contentStyle={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6 }}
                labelStyle={{ color: COLORS.text }}
                formatter={(v) => [`$${v.toLocaleString()}`, "Monthly cost"]}
              />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Savings callout */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flex: "0 0 180px", gap: 8 }}>
          <div style={{ color: COLORS.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Monthly Savings</div>
          <div style={{ color: COLORS.green, fontSize: 40, fontWeight: 800 }}>
            {projection ? `$${projection.monthly_savings_dollars.toLocaleString()}` : "—"}
          </div>
          <div style={{
            background: "#1a2e1a",
            color: COLORS.green,
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 13,
            fontWeight: 600,
          }}>
            {projection ? `${projection.savings_percentage}% cheaper` : ""}
          </div>
          <div style={{ color: COLORS.muted, fontSize: 11, textAlign: "center", marginTop: 4 }}>
            {projection
              ? `$${projection.current_cost_per_tryon_cents}¢ → $${projection.proprietary_model_cost_per_tryon_cents}¢ per try-on`
              : ""}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Failure Taxonomy ────────────────────────────────────────────────

const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.04) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function FailureTaxonomy() {
  return (
    <section style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 24 }}>
      <SectionTitle>Output Quality — Manual Review (50 samples)</SectionTitle>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Donut */}
        <ResponsiveContainer width={260} height={260}>
          <PieChart>
            <Pie
              data={FAILURE_DATA}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={<CustomLabel />}
            >
              {FAILURE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6 }}
              formatter={(v, name) => [`${v}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Table */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Category", "%", "Description"].map((h) => (
                  <th key={h} style={{ textAlign: "left", color: COLORS.muted, fontWeight: 500,
                    padding: "4px 12px 10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FAILURE_DATA.map((row) => (
                <tr key={row.name}>
                  <td style={{ padding: "8px 12px 8px 0", verticalAlign: "top" }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2,
                      background: row.color, marginRight: 8, verticalAlign: "middle" }} />
                    <span style={{ color: COLORS.text }}>{row.name}</span>
                  </td>
                  <td style={{ padding: "8px 12px 8px 0", color: row.color, fontWeight: 600, verticalAlign: "top" }}>
                    {row.value}%
                  </td>
                  <td style={{ padding: "8px 0 8px 0", color: COLORS.muted, verticalAlign: "top" }}>
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/analytics/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSummary(await res.json());
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", padding: "32px 40px", fontFamily: "system-ui, sans-serif", color: COLORS.text }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.text }}>
            <span style={{ color: COLORS.indigo }}>Nine AI</span> — Live Metrics
          </h1>
          {lastUpdated && (
            <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
              Last updated: {fmtTimestamp(lastUpdated)}
            </div>
          )}
        </div>
        <button
          onClick={fetchSummary}
          disabled={loading}
          style={{
            background: COLORS.indigo,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {/* Stats Row */}
      <section style={{ marginBottom: 24 }}>
        <SectionTitle>Try-On Activity</SectionTitle>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard label="Total Try-Ons Processed" value={summary?.total_tryons ?? "—"} />
          <StatCard label="Completed Try-Ons"        value={summary?.completed_tryons ?? "—"} />
          <StatCard label="Avg Latency"              value={summary?.avg_latency_ms ?? "—"} unit="ms" />
          <StatCard label="Avg Cost Per Try-On"      value={summary?.avg_cost_cents ?? "—"} unit="¢" />
        </div>
      </section>

      {/* Cost Economics */}
      <CostEconomics />

      {/* Failure Taxonomy */}
      <FailureTaxonomy />
    </div>
  );
}
