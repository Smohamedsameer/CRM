import { BUILDING_TYPES, COLUMN_TYPES, gfLabel } from "../utils/constants.js";
import { PARTICULARS } from "./PebDoc.jsx";

const labelOf = (list, v) => (list.find((o) => o.value === v) || {}).label || "";
const ft = (m) => (m ? Math.round(Number(m) * 3.28084) : null);
const dist = (m) => (m ? `${m} mtr (${ft(m)} ft)` : "");

export function parseExtra(enquiry) {
  try { return enquiry?.extraDetails ? JSON.parse(enquiry.extraDetails) : {}; } catch { return {}; }
}

let rowSeq = 0;
export const newRow = (o = {}) => ({
  id: `r${Date.now().toString(36)}${rowSeq++}`, title: "", hint: "", length: "", width: "", area: "", rate: "",
  par: PARTICULARS.map(() => false), cus: [], ...o,
});
/** The requirement rows (serial no 1, 2, ...) fetched from the customer's form. Length, width, area and rate are left for the admin. */
function requirementRows(e, x, typeLabel) {
  const rows = [];
  const type = (typeLabel || "").toUpperCase();
  rows.push(newRow({
    title: "PRE-ENGINEERED STEEL BUILDING" + (type ? " – " + type : ""),
    hint: [x.spanWidth && `width ${x.spanWidth}`, x.length && `length ${x.length}`].filter(Boolean).join(", ") || (e.spanWidthM || e.lengthM ? `width ${e.spanWidthM ?? "-"} m, length ${e.lengthM ?? "-"} m` : ""),
    par: PARTICULARS.map(() => true),
  }));
  const choices = x.roofVentilatorChoices || [];
  if (x.canopy === "yes") rows.push(newRow({ title: "CANOPY", hint: [x.canopySize && `size ${x.canopySize}`, x.canopyHeightFfl && `height from FFL ${x.canopyHeightFfl}`].filter(Boolean).join(", ") }));
  if (e.craneRequired) rows.push(newRow({ title: "CRANE" + (e.craneType ? " – " + e.craneType.toUpperCase() : ""), hint: [e.craneCapacityTonnes && `${e.craneCapacityTonnes} T`, e.craneHeightM && `lifting height ${e.craneHeightM}`].filter(Boolean).join(", ") }));
  if (choices.includes("TURBINE_VENTILATOR") || x.roofVent === "yes") rows.push(newRow({ title: "ROOF (TURBINE) VENTILATOR" }));
  if (choices.includes("RIDGE_VENT") || x.ridgeVent === "yes") rows.push(newRow({ title: "RIDGE VENT" }));
  if (choices.includes("MONITOR_ROOF")) rows.push(newRow({ title: "MONITOR ROOF" }));
  if (x.eaveGutter === "yes") rows.push(newRow({ title: "EAVE GUTTER" + (x.gutterMaterial ? " – " + (x.gutterMaterial === "OTHER" ? x.gutterMaterialOther : x.gutterMaterial) : "") }));
  if (x.valleyGutter === "yes") rows.push(newRow({ title: "VALLEY GUTTER" + (x.gutterMaterial ? " – " + (x.gutterMaterial === "OTHER" ? x.gutterMaterialOther : x.gutterMaterial) : "") }));
  if (x.louver === "yes") rows.push(newRow({ title: "SHEET METAL LOUVER", hint: x.louverSize && `size ${x.louverSize}` }));
  return rows;
}

/** the customer's text for a field, or "" - a free-text answer wins, then the legacy numeric column */
const withUnit = (text, unit) => (text && !new RegExp(unit, "i").test(text) ? `${text} ${unit}` : text || "");
const yes = (v) => v === "yes";
const labelOrOther = (value, other) => (value === "OTHER" ? other || "" : gfLabel(value) || "");

/** Everything the quotation needs. Address / contact come from the Add Lead record, building details from the
 * customer's enquiry form (ONLY the questions the form asks). Pricing (length x width, area, rate) is left for the admin. */
export function defaultsFromLead(lead, rate = "") {
  const e = lead.enquiry || {};
  const x = parseExtra(e);
  const v2 = x.v === 2;
  const typeLabel = e.buildingType === "OTHER" ? (e.buildingTypeOther || x.buildingTypeOther) : (gfLabel(e.buildingType) || labelOf(BUILDING_TYPES, e.buildingType));
  const col = e.columnType === "OTHER" ? x.columnTypeOther : (labelOf(COLUMN_TYPES, e.columnType) || gfLabel(e.columnType));
  const endFrame = e.endFrameType === "OTHER" ? x.endFrameTypeOther : (gfLabel(e.endFrameType) || "");
  const pick = (text, metres) => (v2 && text ? text : dist(metres));

  // ---- BUILDING TYPE ----
  const b = [
    typeLabel || "", col || "", endFrame,
    pick(x.spanWidth, e.spanWidthM),
    pick(x.eaveHeight, e.eaveHeightM),
    v2 ? x.clearEaveHeight || "" : dist(e.clearEaveHeightM),
    pick(x.length, e.lengthM),
    pick(x.intermediateSpacing, e.intermediateBaySpacingM) || "As per design",
    pick(x.gableBaySpacing, e.endBaySpacingM) || "As per design",
    pick(x.brickWallHeight, e.brickWallHeightM),
    e.roofSlope || x.roofSlope || "1:10",
  ];

  // ---- ROOF & CLADDING ----
  const roofMat = v2 ? labelOrOther(x.roofMaterial, x.roofMaterialOther) : (gfLabel(e.roofCladdingMaterial) || "");
  const clad = v2 ? labelOrOther(x.claddingMaterial, x.claddingMaterialOther) : (gfLabel(e.sideCladdingMaterial) || "");
  const prep = (v2 ? x.surfacePrep || [] : String(e.surfacePreparation || "").split(",").filter(Boolean))
    .map((p) => (p === "OTHER" ? x.surfacePrepOther : gfLabel(p))).filter(Boolean).join(", ");
  const r = [
    labelOrOther(e.roofingCladdingRequirement, x.roofingReqOther),
    roofMat, clad,
    withUnit(x.thickness || e.roofCladdingThickness, "mm") || "0.47mm",
    String(x.colour || e.roofCladdingColour || "").replace(/^RAL\s*/i, "") || "As per your requirements",
    prep,
    labelOrOther(x.coating || e.protectiveCoating, x.coatingOther || e.protectiveCoatingOther) || "As per your requirements",
  ];

  // ---- CRANE REQUIREMENTS ----
  const craneOn = !!e.craneRequired;
  const AYR = "As per your requirements"; // default when the customer left a crane detail blank
  const cr = craneOn ? [e.craneType || AYR, e.craneCapacityTonnes || AYR, e.craneHeightM || AYR] : ["", "", ""];

  // ---- GUTTER ----
  const gc = x.gutterChoices || [];
  const gutterOn = gc.length > 0 && !gc.includes("NOT_REQUIRED");
  const g = [
    gc.length ? (gutterOn ? gc.map((c) => gfLabel(c)).join(" + ") : "Not Required") : "",
    gutterOn ? labelOrOther(x.gutterMaterial, x.gutterMaterialOther) : "",
    gutterOn ? labelOrOther(x.downpipeMaterial, x.downpipeMaterialOther) : "",
  ];

  // ---- VENTILATOR ----
  const vc = x.roofVentilatorChoices || [];
  const vent = vc.length ? vc.map((c) => gfLabel(c)).join(" + ") : (e.roofVentilatorRequired === true ? "Required" : e.roofVentilatorRequired === false ? "Not Required" : "");
  const v = [vent];

  // ---- CANOPY / LOUVER ----
  const cn = yes(x.canopy) ? [x.canopySize || "As per your dimension", x.canopyHeightFfl || "As per design"] : [x.canopy === "other" ? x.canopyOther || "" : "", ""];
  const l = [yes(x.louver) ? x.louverSize || "" : x.louver === "other" ? x.louverOther || "" : ""];

  return {
    ref: "", date: "",
    toName: lead.companyName || lead.customerName || "",
    person: lead.customerName || "", phone: lead.phone || "", email: lead.email || "",
    addr: lead.address || "",                       // fetched from Add Lead
    loc: e.location || "",                         // Project Location from the customer's form
    gst: "",
    project: lead.projectName || x.projectPurpose || (typeLabel ? `${typeLabel} building` : "PEB building"), // Project Name from Add Lead -> cover title & subject
    cover: "",                                     // optional cover picture; no picture = no cover page
    fmt: 2,                                        // Building Description in the enquiry-form layout (see PebDoc.mk)
    // a table is printed only when the customer asked for that item ("Not required" / unanswered = no table)
    show: {
      cr: craneOn,
      g: gutterOn,
      v: vc.length ? !vc.includes("NOT_REQUIRED") : e.roofVentilatorRequired === true,
      cn: x.canopy === "yes" || x.canopy === "other",
      l: x.louver === "yes" || x.louver === "other",
    },
    b, r, cr, g, v, cn, l,
    reqs: requirementRows(e, x, typeLabel),
    rate,
  };
}

/* ---------- reference pictures that match what the customer chose ---------- */
const TYPE_PHOTO = {
  CLEAR_SPAN: "clear-span", CLEAR_SPAN_ARCHED: "clear-span-arched", MULTI_SPAN_1: "multi-span-1", MULTI_SPAN_2: "multi-span-2",
  MULTI_SPAN_3: "multi-span-3", MULTI_SPAN_ARCHED: "multi-span-arched", MULTI_GABLE: "multi-gable", SINGLE_SLOPE: "single-slope",
  ROOF_SYSTEM: "roof-system", LEAN_TO: "lean-to",
};
const ROOF_REQ = {
  ROOF_ONLY: ["roof-only", "roof1"], ROOF_AND_GABLE_END: ["roof-gable-end", "roof2"],
  ROOF_GABLE_END_AND_WALLS: ["roof-gable-walls", "roof3"], FULL_ROOF_GABLE_END_AND_CLADDING: ["roof-full-cladding", "roof4"],
};

/** Which reference pictures apply to this enquiry. `names` are tried in order; each is a file in /public/diagrams. */
export function referenceCandidates(lead) {
  const e = lead.enquiry || {};
  const x = parseExtra(e);
  const list = [];
  const add = (key, caption, names, dir = "/diagrams") => list.push({ key, caption, names, dir });
  if (TYPE_PHOTO[e.buildingType]) add("type", `Type of building – ${gfLabel(e.buildingType) || labelOf(BUILDING_TYPES, e.buildingType)}`, [TYPE_PHOTO[e.buildingType]], "/building-types");
  if (e.intermediateBaySpacingM || e.endBaySpacingM || x.intermediateSpacing || x.gableBaySpacing) add("bay", "Bay width / bay spacing", ["bay-width", "bay", "bay-image"]);
  if (ROOF_REQ[e.roofingCladdingRequirement]) add("roof", "Roofing & cladding requirement", ROOF_REQ[e.roofingCladdingRequirement]);
  if (e.craneRequired) add("crane", "Crane and hoist", ["crane", "crane1"]);
  if (x.roofVent === "yes") add("wind1", "Roof (turbine) ventilator", ["wind3", "wind1"]);
  if ((x.roofVentilatorChoices || []).includes("MONITOR_ROOF")) add("monitor", "Monitor roof", ["monitor-roof"]);
  if (x.ridgeVent === "yes") add("wind2", "Ridge vent", ["wind2"]);
  if (x.eaveGutter === "yes") add("gutter1", "Eave gutter", ["gutter3", "gutter1"]);
  if (x.valleyGutter === "yes") add("gutter2", "Valley gutter", ["gutter2"]);
  if (x.canopy === "yes") add("canopy", "Canopy", ["slab", "slap"]);
  if (x.louver === "yes") add("louver", "Sheet metal louver", ["window"]);
  return list;
}

const EXTS = ["png", "jpg", "jpeg", "webp"];
const toDataUrl = (blob) => new Promise((ok, fail) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = fail; r.readAsDataURL(blob); });

/** Loads the first existing file for a candidate and returns it as a data URL (null when no file exists). */
export async function loadReference(c) {
  for (const n of c.names) {
    const exts = c.dir === "/building-types" ? ["jpeg", "jpg", "png"] : EXTS;
    for (const ext of exts) {
      try {
        const res = await fetch(`${c.dir}/${n}.${ext}`);
        const type = res.headers.get("content-type") || "";
        if (res.ok && type.startsWith("image/")) return await toDataUrl(await res.blob());
      } catch { /* try next */ }
    }
  }
  return null;
}
