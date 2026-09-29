const ROOF = "#b3491f";

/** Real product photos for each "Type of Building" option, served from /public/building-types/
 * (plain URL paths, not bundled imports, so they can be swapped without a rebuild). */
const BUILDING_PHOTOS = {
  CLEAR_SPAN: "/building-types/clear-span.jpeg",
  CLEAR_SPAN_ARCHED: "/building-types/clear-span-arched.jpeg",
  MULTI_SPAN_1: "/building-types/multi-span-1.jpeg",
  MULTI_SPAN_2: "/building-types/multi-span-2.jpeg",
  MULTI_SPAN_3: "/building-types/multi-span-3.jpeg",
  MULTI_SPAN_ARCHED: "/building-types/multi-span-arched.jpeg",
  MULTI_GABLE: "/building-types/multi-gable.jpeg",
  SINGLE_SLOPE: "/building-types/single-slope.jpeg",
  ROOF_SYSTEM: "/building-types/roof-system.jpeg",
  LEAN_TO: "/building-types/lean-to.jpeg",
};

/** Icon for a PEB building-type or roofing/cladding option. Building-type values render the
 * company's real elevation photos (from /public/building-types/); roofing/cladding requirement
 * values and "Other" render a small line-art placeholder since no matching photo exists for those. */
export default function BuildingIcon({ type, size = 64 }) {
  const photo = BUILDING_PHOTOS[type];
  if (photo) {
    return <img src={photo} alt="" className="image-radio-photo" />;
  }

  const props = { width: size, height: size * 0.68, viewBox: "0 0 100 68", xmlns: "http://www.w3.org/2000/svg" };

  switch (type) {
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
