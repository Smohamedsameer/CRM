const ROOF = "#b3491f";
const STEEL = "#8a8a8a";
const FILL = "none";

/** Small line-art icon for a PEB building-type or roofing/cladding option, matching the
 * company's original request-form icons. `type` selects which shape to draw. */
export default function BuildingIcon({ type, size = 64 }) {
  const props = { width: size, height: size * 0.68, viewBox: "0 0 100 68", xmlns: "http://www.w3.org/2000/svg" };

  switch (type) {
    case "CLEAR_SPAN":
      return (
        <svg {...props}>
          <path d="M8 50 L50 12 L92 50" fill={FILL} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <line x1="8" y1="50" x2="8" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="92" y1="50" x2="92" y2="58" stroke={STEEL} strokeWidth="3" />
        </svg>
      );
    case "MULTI_SPAN_1":
      return (
        <svg {...props}>
          <path d="M6 50 L32 20 L58 50" fill={FILL} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <path d="M42 50 L68 20 L94 50" fill={FILL} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <line x1="6" y1="50" x2="6" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="50" y1="50" x2="50" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="94" y1="50" x2="94" y2="58" stroke={STEEL} strokeWidth="3" />
        </svg>
      );
    case "MULTI_SPAN_2":
      return (
        <svg {...props}>
          <path d="M4 50 L22 24 L40 50" fill={FILL} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <path d="M30 50 L48 24 L66 50" fill={FILL} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <path d="M56 50 L74 24 L92 50" fill={FILL} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <line x1="4" y1="50" x2="4" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="35" y1="50" x2="35" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="61" y1="50" x2="61" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="92" y1="50" x2="92" y2="58" stroke={STEEL} strokeWidth="3" />
        </svg>
      );
    case "MULTI_SPAN_3":
      return (
        <svg {...props}>
          <path d="M2 50 L16 26 L30 50" fill={FILL} stroke={ROOF} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M23 50 L37 26 L51 50" fill={FILL} stroke={ROOF} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M44 50 L58 26 L72 50" fill={FILL} stroke={ROOF} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M65 50 L79 26 L93 50" fill={FILL} stroke={ROOF} strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="2" y1="50" x2="2" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="26" y1="50" x2="26" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="47" y1="50" x2="47" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="68" y1="50" x2="68" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="93" y1="50" x2="93" y2="58" stroke={STEEL} strokeWidth="3" />
        </svg>
      );
    case "MULTI_GABLE":
      return (
        <svg {...props}>
          <path d="M4 50 L26 22 L48 50" fill={FILL} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <path d="M46 50 L68 22 L90 50" fill={FILL} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <path d="M18 50 L26 34 L34 50" fill={FILL} stroke={ROOF} strokeWidth="2" strokeLinejoin="round" opacity="0.6" />
          <line x1="4" y1="50" x2="4" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="47" y1="50" x2="47" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="90" y1="50" x2="90" y2="58" stroke={STEEL} strokeWidth="3" />
        </svg>
      );
    case "LEAN_TO":
      return (
        <svg {...props}>
          <path d="M10 22 L10 50 L90 50 L90 38 Z" fill={FILL} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <rect x="4" y="18" width="8" height="34" fill="#333" opacity="0.75" />
          <line x1="10" y1="50" x2="10" y2="58" stroke={STEEL} strokeWidth="3" />
          <line x1="90" y1="50" x2="90" y2="58" stroke={STEEL} strokeWidth="3" />
        </svg>
      );
    case "OTHER":
      return (
        <svg {...props}>
          <rect x="14" y="16" width="72" height="38" rx="4" fill="none" stroke="#9aa0a6" strokeWidth="2.5" strokeDasharray="6 5" />
          <line x1="38" y1="35" x2="62" y2="35" stroke="#9aa0a6" strokeWidth="3" />
          <line x1="50" y1="23" x2="50" y2="47" stroke="#9aa0a6" strokeWidth="3" />
        </svg>
      );

    // ---- Roofing & cladding requirement icons ----
    case "ROOF_ONLY":
      return (
        <svg {...props}>
          <path d="M10 44 L50 20 L90 44 L90 50 L10 50 Z" fill={ROOF} stroke={ROOF} strokeWidth="2" strokeLinejoin="round" opacity="0.9" />
        </svg>
      );
    case "ROOF_AND_GABLE_END":
      return (
        <svg {...props}>
          <path d="M10 44 L50 20 L90 44 L90 50 L10 50 Z" fill={ROOF} stroke={ROOF} strokeWidth="2" strokeLinejoin="round" opacity="0.9" />
          <path d="M32 50 L50 26 L68 50 Z" fill="#d97b4a" stroke={ROOF} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "ROOF_GABLE_END_AND_WALLS":
      return (
        <svg {...props}>
          <path d="M10 44 L50 20 L90 44 L90 50 L10 50 Z" fill={ROOF} stroke={ROOF} strokeWidth="2" strokeLinejoin="round" opacity="0.9" />
          <path d="M32 50 L50 26 L68 50 Z" fill="#d97b4a" stroke={ROOF} strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="16" y="50" width="10" height="10" fill="#333" />
          <rect x="74" y="50" width="10" height="10" fill="#333" />
        </svg>
      );
    case "FULL_ROOF_GABLE_END_AND_CLADDING":
      return (
        <svg {...props}>
          <path d="M10 44 L50 20 L90 44 L90 50 L10 50 Z" fill={ROOF} stroke={ROOF} strokeWidth="2" strokeLinejoin="round" opacity="0.9" />
          <path d="M32 50 L50 26 L68 50 Z" fill="#d97b4a" stroke={ROOF} strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="10" y="50" width="80" height="10" fill="#333" />
        </svg>
      );

    default:
      return null;
  }
}
