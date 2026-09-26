import { useState } from "react";

/**
 * Dependency-free 3D pie chart drawn in SVG.
 * data: [{ key, label, value, color }]
 * The pie is an ellipse (the "tilt") with an extruded front wall, so it reads as a 3D disc.
 * Hovering a slice or its legend row pulls that slice out and highlights it.
 */
const W = 320;
const H = 230;
const CX = W / 2;
const CY = 96;
const RX = 130;
const RY = 74;
const DEPTH = 26;
const START = -Math.PI / 2; // first slice starts at 12 o'clock

function shade(hex, amount) {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * amount);
  const g = clamp(((n >> 8) & 255) * amount);
  const b = clamp((n & 255) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

const pt = (a, dy = 0, ox = 0, oy = 0) => [CX + ox + RX * Math.cos(a), CY + oy + RY * Math.sin(a) + dy];
const f = (n) => n.toFixed(2);

/** The part of [a0, a1] that faces the viewer (angles 0..π in SVG space = the lower half). */
function frontInterval(a0, a1) {
  const b0 = Math.max(a0, 0);
  const b1 = Math.min(a1, Math.PI);
  return b1 > b0 ? [b0, b1] : null;
}

export default function Pie3D({ data, title, emptyText = "No data yet." }) {
  const [active, setActive] = useState(null);
  const rows = (data || []).filter((d) => d.value > 0);
  const total = rows.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="chart-card">
        {title && <h4 className="chart-title">{title}</h4>}
        <p className="muted chart-empty">{emptyText}</p>
      </div>
    );
  }

  let angle = START;
  const slices = rows.map((d) => {
    const frac = d.value / total;
    const a0 = angle;
    const a1 = angle + frac * Math.PI * 2;
    angle = a1;
    return { ...d, frac, a0, a1, mid: (a0 + a1) / 2 };
  });

  function renderSlice(s, isActive) {
    const pop = isActive && s.frac < 0.999 ? 12 : 0;
    const ox = Math.cos(s.mid) * pop;
    const oy = Math.sin(s.mid) * pop * (RY / RX);
    const full = s.frac >= 0.999;
    const dim = active && !isActive ? 0.45 : 1;

    // Front wall (only the visible, lower half of the rim)
    let wall = null;
    const iv = full ? [0, Math.PI] : frontInterval(s.a0, s.a1);
    if (iv) {
      const [b0, b1] = iv;
      const p0 = pt(b0, 0, ox, oy);
      const p1 = pt(b1, 0, ox, oy);
      const q1 = pt(b1, DEPTH, ox, oy);
      const q0 = pt(b0, DEPTH, ox, oy);
      wall = (
        <path
          d={`M${f(p0[0])},${f(p0[1])} A${RX},${RY} 0 0 1 ${f(p1[0])},${f(p1[1])} L${f(q1[0])},${f(q1[1])} A${RX},${RY} 0 0 0 ${f(q0[0])},${f(q0[1])} Z`}
          fill={shade(s.color, 0.62)}
          opacity={dim}
        />
      );
    }

    // Top face
    let top;
    if (full) {
      top = <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill={s.color} opacity={dim} />;
    } else {
      const p0 = pt(s.a0, 0, ox, oy);
      const p1 = pt(s.a1, 0, ox, oy);
      const large = s.a1 - s.a0 > Math.PI ? 1 : 0;
      top = (
        <path
          d={`M${f(CX + ox)},${f(CY + oy)} L${f(p0[0])},${f(p0[1])} A${RX},${RY} 0 ${large} 1 ${f(p1[0])},${f(p1[1])} Z`}
          fill={s.color}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="0.8"
          opacity={dim}
        />
      );
    }

    return { wall, top, ox, oy };
  }

  const activeSlice = slices.find((s) => s.key === active);
  const rendered = slices.map((s) => ({ s, ...renderSlice(s, s.key === active) }));
  const normal = rendered.filter((r) => r.s.key !== active);
  const lifted = rendered.filter((r) => r.s.key === active);

  return (
    <div className="chart-card">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="pie3d">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title || "Pie chart"} className="pie3d-svg">
          <defs>
            <radialGradient id="pie3d-shine" cx="40%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* floor shadow */}
          <ellipse cx={CX} cy={CY + DEPTH + 16} rx={RX * 0.95} ry={RY * 0.42} fill="rgba(0,0,0,0.35)" />

          {normal.map((r) => <g key={`w-${r.s.key}`}>{r.wall}</g>)}
          {normal.map((r) => (
            <g key={`t-${r.s.key}`} onMouseEnter={() => setActive(r.s.key)} onMouseLeave={() => setActive(null)} style={{ cursor: "pointer" }}>
              {r.top}
            </g>
          ))}
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#pie3d-shine)" pointerEvents="none" />
          {lifted.map((r) => (
            <g key={`l-${r.s.key}`} onMouseLeave={() => setActive(null)} style={{ cursor: "pointer" }}>
              {r.wall}
              {r.top}
            </g>
          ))}

          {rendered.map(({ s, ox, oy }) =>
            s.frac >= 0.06 ? (
              <text
                key={`lbl-${s.key}`}
                x={CX + ox + Math.cos(s.frac >= 0.999 ? 0 : s.mid) * RX * (s.frac >= 0.999 ? 0 : 0.62)}
                y={CY + oy + Math.sin(s.frac >= 0.999 ? 0 : s.mid) * RY * (s.frac >= 0.999 ? 0 : 0.62) + 4}
                textAnchor="middle"
                className="pie3d-label"
                pointerEvents="none"
              >
                {Math.round(s.frac * 100)}%
              </text>
            ) : null
          )}
        </svg>

        <ul className="pie3d-legend">
          {slices.map((s) => (
            <li
              key={s.key}
              className={s.key === active ? "active" : ""}
              onMouseEnter={() => setActive(s.key)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="dot" style={{ background: s.color }} />
              <span className="name">{s.label}</span>
              <span className="val">{s.value}</span>
              <span className="pct muted">{(s.frac * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="muted chart-foot">
        {activeSlice
          ? `${activeSlice.label}: ${activeSlice.value} of ${total} leads (${(activeSlice.frac * 100).toFixed(1)}%)`
          : `${total} leads · hover a slice for details`}
      </p>
    </div>
  );
}
