export const STATUSES = [
  "NEW", "WELCOME_SENT", "FORM_SENT", "FORM_SUBMITTED", "QUOTATION_GENERATED",
  "QUOTATION_SENT", "QUOTATION_VIEWED", "ACCEPTED", "CHANGES_REQUESTED",
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

const GOOD = new Set(["ACCEPTED", "ORDER_CONFIRMED", "READ", "DELIVERED"]);
const BAD = new Set(["FAILED", "REJECTED", "CHANGES_REQUESTED", "EXPIRED"]);

export function toneFor(status) {
  if (GOOD.has(status)) return "success";
  if (BAD.has(status)) return "danger";
  return "";
}

// ---- PEB (Pre-Engineered Building) enquiry form options, from the company's PEB request form ----
export const BUILDING_TYPES = [
  { value: "CLEAR_SPAN", label: "Clear Span" },
  { value: "MULTI_SPAN_1", label: "Multi Span-1" },
  { value: "MULTI_SPAN_2", label: "Multi Span-2" },
  { value: "MULTI_SPAN_3", label: "Multi Span-3" },
  { value: "MULTI_GABLE", label: "Multi Gable" },
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
