import { BUILDING_TYPES, COLUMN_TYPES, CLADDING_MATERIALS, gfLabel } from "../utils/constants.js";
import { BL, CL, OL, XL, PARTICULARS } from "./PebDoc.jsx";

const labelOf = (list, v) => (list.find((o) => o.value === v) || {}).label || "";
const ft = (m) => (m ? Math.round(Number(m) * 3.28084) : null);
const dist = (m) => (m ? `${m} mtr (${ft(m)} ft)` : "");
/** "CCGI (Colour Coated Galvanised Iron)" -> "CCGI" for the printed specification */
const short = (v) => (v ? (gfLabel(v) || labelOf(CLADDING_MATERIALS, v) || v).replace(/\s*\((Colour|Colored)[^)]*\)/i, "") : "");
const material = (m, other, thickness, colour) =>
  [m === "OTHER" ? other : short(m), thickness && /mm/i.test(thickness) ? thickness : thickness ? `${thickness} mm` : "", colour && `RAL ${String(colour).replace(/^RAL\s*/i, "")}`].filter(Boolean).join(", ");

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

/** Everything the quotation needs. Address / contact come from the Add Lead record, building details from the
 * customer's form. Pricing (length x width, area, rate) is left for the admin. */
export function defaultsFromLead(lead, rate = "") {
  const e = lead.enquiry || {};
  const x = parseExtra(e);
  const v2 = x.v === 2;
  const typeLabel = e.buildingType === "OTHER" ? (e.buildingTypeOther || x.buildingTypeOther) : (gfLabel(e.buildingType) || labelOf(BUILDING_TYPES, e.buildingType));
  const col = e.columnType === "OTHER" ? x.columnTypeOther : (labelOf(COLUMN_TYPES, e.columnType) || gfLabel(e.columnType));
  const endFrame = e.endFrameType === "LIGHT_FRAME" ? "Light Frame" : e.endFrameType === "RIGID_FRAME" ? "Rigid Frame" : e.endFrameType === "OTHER" ? x.endFrameTypeOther : "";
  const pick = (text, metres) => (v2 && text ? text : dist(metres));
  const eave = pick(x.eaveHeight, e.eaveHeightM || e.clearEaveHeightM);
  const clear = v2 ? x.clearEaveHeight : "";
  const b = BL.map(() => "");
  b[0] = typeLabel || "";
  b[1] = col || "";
  b[2] = endFrame;
  b[3] = pick(x.length, e.lengthM);
  b[4] = pick(x.spanWidth, e.spanWidthM);
  b[5] = eave && clear ? `${eave} (clear ${clear})` : eave;
  b[6] = b[5];
  b[8] = e.roofSlope || x.roofSlope || "";
  b[9] = pick(x.gableBaySpacing, e.endBaySpacingM);
  b[10] = b[9];
  b[11] = pick(x.intermediateSpacing, e.intermediateBaySpacingM);
  b[12] = "Rod";
  b[13] = "Rod";
  b[14] = v2 ? material(x.roofMaterial, x.roofMaterialOther, x.thickness, x.colour) : material(e.roofCladdingMaterial, "", e.roofCladdingThickness, e.roofCladdingColour);
  b[15] = v2 ? material(x.claddingMaterial, x.claddingMaterialOther, x.thickness, x.colour) : material(e.sideCladdingMaterial, "", e.sideCladdingThickness, e.sideCladdingColour);
  b[16] = pick(x.brickWallHeight, e.brickWallHeightM);

  const c = CL.map(() => "");
  c[0] = x.canopySize || "";
  c[2] = x.canopyHeightFfl || "";
  const turbine = (x.roofVentilatorChoices || []).includes("TURBINE_VENTILATOR") || x.roofVent === "yes";
  const o = OL.map(() => "");
  o[0] = e.skylightRequired ? "Yes" : "";
  o[1] = turbine ? [x.roofVentQty && `${x.roofVentQty} nos`, x.roofVentThroat && `throat ${x.roofVentThroat}`].filter(Boolean).join(", ") || "Yes" : "";
  const xs = XL.map(() => "");
  const tonnes = parseFloat(e.craneCapacityTonnes);
  xs[0] = tonnes ? `${Math.round(tonnes * 10)} (${tonnes} Tons)` : e.craneCapacityTonnes || "";
  xs[1] = e.craneHeightM || "";
  xs[6] = e.craneType || "";

  return {
    ref: "", date: "",
    toName: lead.companyName || lead.customerName || "",
    person: lead.customerName || "", phone: lead.phone || "", email: lead.email || "",
    addr: lead.address || "",                       // fetched from Add Lead
    loc: e.location || "",                         // Project Location from the customer's form
    gst: "",
    project: lead.projectName || (typeLabel ? `${typeLabel} building` : "PEB building"), // Project Name from Add Lead -> cover title & subject
    cover: "",                                     // optional cover picture; no picture = no cover page
    cOn: x.canopy === "yes",
    oOn: !!(e.skylightRequired || turbine),
    xOn: !!e.craneRequired,
    b, c, o, x: xs,
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
