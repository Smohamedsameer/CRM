export const STATUSES = [
  "NEW", "WELCOME_SENT", "FORM_SENT", "FORM_SUBMITTED", "QUOTATION_GENERATED",
  "QUOTATION_SENT", "QUOTATION_VIEWED", "CALLED_TO_ORDER", "ACCEPTED", "CHANGES_REQUESTED",
  "REJECTED", "ORDER_CONFIRMED", "CLOSED",
];

export const SOURCES = [
  { value: "META_AD", label: "Meta Ads" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WEBSITE", label: "Website" },
  { value: "MANUAL", label: "Manual" },
  { value: "OTHER", label: "Other" },
];

export const SUMMARY_CARDS = [
  ["totalLeads", "Total Leads"],
  ["newLeads", "New Leads"],
  ["formsPending", "Forms Pending"],
  ["formsSubmitted", "Forms Submitted"],
  ["quotationsSent", "Quotations Sent"],
  ["calledToOrder", "Called to Order"],
  ["quotationsAccepted", "Accepted"],
  ["changesRequested", "Changes Requested"],
  ["ordersConfirmed", "Orders Confirmed"],
];

// Order of the timeline shown on the lead detail page
export const TIMELINE_ORDER = [
  "NEW", "WELCOME_SENT", "FORM_SENT", "FORM_SUBMITTED", "QUOTATION_GENERATED",
  "QUOTATION_SENT", "QUOTATION_VIEWED", "ACCEPTED", "ORDER_CONFIRMED",
];

export const TIMELINE_LABELS = {
  NEW: "Lead Created",
  WELCOME_SENT: "Welcome Message Sent",
  FORM_SENT: "Enquiry Form Sent",
  FORM_SUBMITTED: "Enquiry Submitted",
  QUOTATION_GENERATED: "Quotation Generated",
  QUOTATION_SENT: "Quotation Sent",
  QUOTATION_VIEWED: "Quotation Viewed",
  ACCEPTED: "Customer Accepted",
  ORDER_CONFIRMED: "Order Confirmed",
};

const GOOD = new Set(["ACCEPTED", "CALLED_TO_ORDER", "ORDER_CONFIRMED", "READ", "DELIVERED"]);
const BAD = new Set(["FAILED", "REJECTED", "CHANGES_REQUESTED", "EXPIRED"]);

export function toneFor(status) {
  if (GOOD.has(status)) return "success";
  if (BAD.has(status)) return "danger";
  return "";
}

// ---- PEB (Pre-Engineered Building) enquiry form options, from the company's PEB request form ----
export const BUILDING_TYPES = [
  { value: "CLEAR_SPAN", label: "Clear Span" },
  { value: "CLEAR_SPAN_ARCHED", label: "Clear Span (Arched)" },
  { value: "MULTI_SPAN_1", label: "Multi Span-1" },
  { value: "MULTI_SPAN_2", label: "Multi Span-2" },
  { value: "MULTI_SPAN_3", label: "Multi Span-3" },
  { value: "MULTI_SPAN_ARCHED", label: "Multi Span (Arched)" },
  { value: "MULTI_GABLE", label: "Multi Gable" },
  { value: "SINGLE_SLOPE", label: "Single Slope" },
  { value: "ROOF_SYSTEM", label: "Roof System" },
  { value: "LEAN_TO", label: "Lean-To" },
  { value: "OTHER", label: "Others" },
];

export const END_FRAME_TYPES = [
  { value: "LIGHT_FRAME", label: "Light frame (not suitable for future lengthwise expansion)" },
  { value: "RIGID_FRAME", label: "Rigid frame (suitable for future lengthwise expansion)" },
];

export const COLUMN_TYPES = [
  { value: "STEEL", label: "Steel" },
  { value: "RCC", label: "R.C.C" },
];

export const CLADDING_MATERIALS = [
  { value: "CCGI", label: "CCGI" },
  { value: "CCGL", label: "CCGL" },
  { value: "BAREGALVALUME", label: "Bare Galvalume" },
];

export const SCOPE_OF_WORK_OPTIONS = [
  { value: "SUPPLY_EX_WORKS", label: "Only supply (ex-works, Pondicherry)" },
  { value: "SUPPLY_AT_SITE", label: "Only supply (F.O.R at your site)" },
  { value: "OTHER", label: "Other" },
];

export const MEASUREMENT_BASIS_OPTIONS = [
  { value: "CENTRE_TO_CENTRE", label: "Centre to Centre" },
  { value: "OUT_TO_OUT", label: "Out to Out" },
];

export const ROOFING_CLADDING_REQUIREMENTS = [
  { value: "ROOF_ONLY", label: "Roof Only" },
  { value: "ROOF_AND_GABLE_END", label: "Roof and Gable-End Triangular Area" },
  { value: "ROOF_GABLE_END_AND_WALLS", label: "Roof, Gable End and Walls" },
  { value: "FULL_ROOF_GABLE_END_AND_CLADDING", label: "Full Roof, Gable End and Full-Height Cladding" },
];

export const MAIN_SHED_ROOF_MATERIALS = [
  { value: "CCGI", label: "CCGI" },
  { value: "CCGL", label: "CCGL" },
  { value: "BAREGALVALUME", label: "Bare Galvalume" },
  { value: "OTHER", label: "Other" },
];

export const SURFACE_PREPARATION_OPTIONS = [
  { value: "MECHANICAL_CLEANING", label: "Mechanical Cleaning" },
  { value: "SAND_BLASTING_ON_STEEL", label: "Sand Blasting on Steel" },
];

export const PROTECTIVE_COATING_OPTIONS = [
  { value: "RED_OXIDE_PRIMER", label: "Red Oxide Primer" },
  { value: "ZINC_CHROMATE_RED_OXIDE_PRIMER", label: "Zinc Chromate Red Oxide Primer" },
  { value: "OTHER", label: "Other" },
];

export const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const GUTTER_MATERIALS = [
  { value: "PPGI", label: "PPGI" },
  { value: "CCGL", label: "CCGL" },
  { value: "BAREGALVALUME", label: "Bare Galvalume" },
  { value: "OTHER", label: "Others" },
];

export const DOWNPIPE_MATERIALS = [
  { value: "PVC", label: "PVC" },
  { value: "OTHER", label: "Others" },
];

// ======================================================================
// Google Form "Senela International Ventures - PEB Enquiry Form" (rebuilt as the customer enquiry page)
// `src` = fixed picture served from /public/building-types (not changeable by users)
// `photo` = file name(s) in /public/diagrams (png/jpg/jpeg/webp are tried in that order)
// ======================================================================
const BT = (v) => `/building-types/${v}.jpeg`;
export const GF_BUILDING_TYPES = [
  { value: "CLEAR_SPAN", label: "Clear Span", src: BT("clear-span") },
  { value: "MULTI_SPAN_1", label: "Single Span", src: BT("multi-span-1") },
  { value: "MULTI_SPAN_2", label: "Multi Span 2", src: BT("multi-span-2") },
  { value: "MULTI_SPAN_3", label: "Multi Span 3", src: BT("multi-span-3") },
  { value: "SINGLE_SLOPE", label: "Single Slope", src: BT("single-slope") },
  { value: "LEAN_TO", label: "Lean to", src: BT("lean-to") },
  { value: "MULTI_SPAN_ARCHED", label: "Curved Span (Arched)", src: BT("multi-span-arched") },
  { value: "CLEAR_SPAN_ARCHED", label: "Curved Single Span (Arched)", src: BT("clear-span-arched") },
  { value: "MULTI_GABLE", label: "Multi Gable", src: BT("multi-gable") },
  { value: "ROOF_SYSTEM", label: "Roof System", src: BT("roof-system") },
  { value: "OTHER", label: "Others" },
];
export const GF_COLUMN_TYPES = [{ value: "STEEL", label: "Steel" }, { value: "RCC", label: "R.C.C" }, { value: "OTHER", label: "Other" }];
export const GF_END_FRAME_TYPES = [
  { value: "LIGHT_FRAME", label: "Light frame (not suitable for future lengthwise expansion)" },
  { value: "RIGID_FRAME", label: "Rigid frame (suitable for future lengthwise expansion)" },
  { value: "OTHER", label: "Other" },
];
export const GF_ROOFING_REQUIREMENTS = [
  { value: "ROOF_ONLY", label: "Roof Only", photo: ["roof-only", "roof1"] },
  { value: "ROOF_AND_GABLE_END", label: "Roof and Gable-End Triangular Area", photo: ["roof-gable-end", "roof2"] },
  { value: "ROOF_GABLE_END_AND_WALLS", label: "Roof, Gable End and Walls", photo: ["roof-gable-walls", "roof3"] },
  { value: "FULL_ROOF_GABLE_END_AND_CLADDING", label: "Full Roof, Gable End and Full-Height Cladding", photo: ["roof-full-cladding", "roof4"] },
  { value: "OTHER", label: "Other" },
];
export const GF_SHEET_MATERIALS = [
  { value: "CCGI", label: "CCGI (Colour Coated Galvanised Iron)" },
  { value: "CCGL", label: "CCGL (Colour Coated Galvalume)" },
  { value: "BAREGALVALUME", label: "Bare Galvalume" },
  { value: "PUF_PANEL", label: "Puf Panel (30mm / 50mm)" },
  { value: "OTHER", label: "Others" },
];
export const GF_SURFACE_PREPARATION = [
  { value: "MECHANICAL_CLEANING", label: "Mechanical Cleaning" },
  { value: "SAND_BLASTING_CLEANING", label: "Sand Blasting Cleaning" },
  { value: "OTHER", label: "Other" },
];
export const GF_PROTECTIVE_COATING = [
  { value: "RED_OXIDE_PRIMER", label: "Red Oxide Primer" },
  { value: "ZINC_CHROMATE_RED_OXIDE_PRIMER", label: "Zinc Chromate Red Oxide Primer" },
  { value: "ENAMEL_EPOXY_PU", label: "Enamel / Epoxy / PU" },
  { value: "OTHER", label: "Others" },
];
export const GF_YES_NO_OTHER = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "other", label: "Other" }];
export const GF_ROOF_VENTILATORS = [
  { value: "RIDGE_VENT", label: "Ridge Vent", photo: ["wind2"] },
  { value: "TURBINE_VENTILATOR", label: "Turbine Ventilator", photo: ["wind3", "wind1"] },
  { value: "MONITOR_ROOF", label: "Monitor Roof", photo: ["monitor-roof"] },
  { value: "NOT_REQUIRED", label: "Not Required" },
];
export const GF_GUTTERS = [
  { value: "EAVE_GUTTER", label: "Eave Gutter", photo: ["gutter3", "gutter1"] },
  { value: "VALLEY_GUTTER", label: "Valley Gutter", photo: ["gutter2"] },
  { value: "NOT_REQUIRED", label: "Not Required" },
];
export const GF_GUTTER_MATERIALS = [
  { value: "PPGI", label: "PPGI" }, { value: "CCGL", label: "CCGL" }, { value: "PVC", label: "PVC" },
  { value: "OTHER", label: "Others" },
];
export const GF_DOWNPIPE_MATERIALS = [{ value: "PVC", label: "PVC" }, { value: "OTHER", label: "Others" }];

/** value -> readable label, searching every list above */
const ALL_GF = [GF_BUILDING_TYPES, GF_COLUMN_TYPES, GF_END_FRAME_TYPES, GF_ROOFING_REQUIREMENTS, GF_SHEET_MATERIALS,
  GF_SURFACE_PREPARATION, GF_PROTECTIVE_COATING, GF_ROOF_VENTILATORS, GF_GUTTERS, GF_GUTTER_MATERIALS, GF_DOWNPIPE_MATERIALS];
export function gfLabel(value) {
  for (const list of ALL_GF) { const o = list.find((x) => x.value === value); if (o) return o.label; }
  return value || "";
}
