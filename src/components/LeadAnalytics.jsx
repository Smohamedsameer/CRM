import { useEffect, useState } from "react";
import { getAnalytics } from "../api/index.js";
import Pie3D from "./Pie3D.jsx";
import { SOURCES } from "../utils/constants.js";
import { labelize } from "../utils/format.js";

const STATUS_COLORS = {
  NEW: "#7aa2ff",
  WELCOME_SENT: "#5ec8e5",
  FORM_SENT: "#4fb3a9",
  FORM_SUBMITTED: "#3ddc84",
  QUOTATION_GENERATED: "#cda349",
  QUOTATION_SENT: "#f0c35a",
  QUOTATION_VIEWED: "#f39c4a",
  ACCEPTED: "#9be15d",
  CHANGES_REQUESTED: "#ff8f6b",
  REJECTED: "#ff5a6e",
  ORDER_CONFIRMED: "#b58cff",
  CLOSED: "#8a8d98",
};

const SOURCE_COLORS = {
  META_AD: "#4c8dff",
  FACEBOOK: "#6f7dff",
  INSTAGRAM: "#e1567c",
  WEBSITE: "#3cc4b4",
  MANUAL: "#cda349",
  OTHER: "#8a8d98",
};

const sourceLabel = (key) => SOURCES.find((s) => s.value === key)?.label ?? labelize(key);

/** Small 3D bar graph: new leads per month. */
function MonthlyBars({ data }) {
  const W = 340;
  const H = 230;
  const left = 30;
  const bottom = 190;
  const plotH = 150;
  const depth = 8;
  const max = Math.max(1, ...data.map((d) => d.count));
  const slot = (W - left - 10) / Math.max(1, data.length);
  const barW = Math.min(34, slot * 0.55);
  const ticks = [0, Math.ceil(max / 2), max];

  return (
    <div className="chart-card">
      <h4 className="chart-title">New leads per month</h4>
      <svg viewBox={`0 0 ${W} ${H}`} className="bars3d-svg" role="img" aria-label="New leads per month">
        {ticks.map((t) => {
          const y = bottom - (t / max) * plotH;
          return (
            <g key={t}>
              <line x1={left} x2={W - 6} y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 4" />
              <text x={left - 6} y={y + 4} textAnchor="end" className="bars3d-axis">{t}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.count / max) * plotH;
          const x = left + slot * i + (slot - barW) / 2;
          const y = bottom - h;
          return (
            <g key={d.month}>
              {h > 0 && (
                <>
                  {/* side */}
                  <path d={`M${x + barW},${y} l${depth},${-depth} v${h} l${-depth},${depth} Z`} fill="#8a6a26" />
                  {/* top */}
                  <path d={`M${x},${y} l${depth},${-depth} h${barW} l${-depth},${depth} Z`} fill="#e6c26f" />
                  {/* front */}
                  <rect x={x} y={y} width={barW} height={h} fill="var(--primary)" />
                </>
              )}
              <text x={x + barW / 2 + depth / 2} y={y - depth - 5} textAnchor="middle" className="bars3d-value">{d.count}</text>
              <text x={x + barW / 2} y={bottom + 16} textAnchor="middle" className="bars3d-axis">{d.month.split(" ")[0]}</text>
            </g>
          );
        })}
        <line x1={left} x2={W - 6} y1={bottom} y2={bottom} stroke="var(--muted)" />
      </svg>
      <p className="muted chart-foot">Last 6 months</p>
    </div>
  );
}

export default function LeadAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAnalytics()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="card"><p className="muted">Could not load lead analysis: {error}</p></div>;
  if (!data) return <div className="card"><p className="muted">Loading lead analysis…</p></div>;

  const statusData = (data.byStatus || []).map((d) => ({
    key: d.key, label: labelize(d.key), value: d.count, color: STATUS_COLORS[d.key] || "#8a8d98",
  }));
  const sourceData = (data.bySource || []).map((d) => ({
    key: d.key, label: sourceLabel(d.key), value: d.count, color: SOURCE_COLORS[d.key] || "#8a8d98",
  }));
  const topSource = [...sourceData].sort((a, b) => b.value - a.value)[0];
  const inProgress = Math.max(0, data.totalLeads - data.won - data.lost);

  return (
    <div className="card analytics">
      <div className="card-header-row">
        <h3>Lead analysis</h3>
      </div>

      <div className="analytics-kpis">
        <div><span className="k">{data.totalLeads}</span><span className="muted">Total leads</span></div>
        <div><span className="k">{data.conversionRate}%</span><span className="muted">Conversion (accepted + orders)</span></div>
        <div><span className="k ok">{data.won}</span><span className="muted">Won</span></div>
        <div><span className="k">{inProgress}</span><span className="muted">In progress</span></div>
        <div><span className="k bad">{data.lost}</span><span className="muted">Rejected / closed</span></div>
        <div><span className="k">{topSource ? topSource.label : "-"}</span><span className="muted">Top source</span></div>
      </div>

      <div className="analytics-grid">
        <Pie3D title="Leads by status" data={statusData} />
        <Pie3D title="Leads by source" data={sourceData} />
        <MonthlyBars data={data.monthly || []} />
      </div>
    </div>
  );
}
