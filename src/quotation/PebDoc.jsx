/* The 8-page Senela PEB quotation (cover, letter, index, building description ... force majeure)
 * (no reference-image pages). Layout is measured and paginated in the browser, exactly like the
 * standalone quotation generator, so the page order and look stay identical.                     */
import React, { useEffect, useMemo, useRef, useState } from "react";
import SIG from "./assets/signature.jpg";
import ISO from "./assets/iso.jpg";
import "./quotation-doc.css";

const h = React.createElement;
const PH = 870; // usable body height of one page

export const BL = ["Building type", "Type of Column", "Type of End Frame", "Length in mtr/ft (o/o of steel)", "Width in mtr/ft (o/o of steel)", "Left eave height ", "Right eave height ", "Ridge line distance", "Roof slope (ratio,deg)", "Left end wall bay spacing", "Right end wall bay spacing ", "Side wall bay spacing", "Wall bracing type", "Roof bracing type", "Roof sheeting", "Wall sheeting", "Brick wall Height"];
export const CL = ["Canopy Extension ", "Slope", "Canopy clear height", "Eave extension", "Gable extension"];
export const OL = ["Skylights (FRP or Poly carbonate 3.25m x 1m)", "Turbo Ventilators (600 mm throat diameter)", "Windows size", "Door size"];
export const XL = ["Crane Capacity in kN", "Crane beam top height ", "Crane span ", "Crane starting point ", "Crane running length ", "Crane class", "Crane Type", "Type of Girder", "Bridge Weight in MT", "Hoist/Trolley Weight in MT", "Number of Wheels", "Wheel Load in MT", "Wheel Base in mm"];
export const PARTICULARS = ["Structural Design", "Structural Detailing", "Structural Fabrication", "Supply & Installation of structure", "Supply & Fixing of Roofing & cladding"];

const DL = [["Design code", "AISC code"], ["Dead Load in kN/m2", "0.1"], ["Live Load in kN/m2", "0.57"], ["Collateral load kN/m2", "0"], ["Max wind speed in m/s", "44"], ["Max rainfall intensity in mm/hr.", "150"], ["Exposure category", "B"], ["Seismic zone co-efficient (III)", "0.24"], ["Maximum temperate variation", "20"]];
const DF = [["Frames Vertical deflection", "Span/150"], ["Frames Horizontal deflection", "Height/100"], ["Purlins", "Span/150"], ["Girts", "Span/120"], ["Crane beams", "Span/600"], ["Mezzanine beams", "Span/240"], ["Misc", "NA"]];
const AS = [["Hot rolled sections grade (Mpa)", "250"], ["Cold form sections grade (Mpa)", "350"], ["Primary sections grade (Mpa)", "350"], ["Building design condition", "Enclosed"], ["Minimum web thickness in mm", "4"], ["Minimum flange thickness in mm", "5"], ["Minimum flange width in mm", "125"], ["Minimum web depth in mm", "250"], ["Minimum cold form thickness in mm", "1.5"], ["Sheeting profile width & length in m", "1.22 & 7.65"], ["Connection bolts grade", "High strength bolts (ASTM A325 or equivalent)"]];
export const IDN = ["Building Description", "Standard Supplied Material", "Material Specification", "Steel Work Finish", "Completion Period", "Proposal validity", "Prices", "Assumptions & Deviations", "Force Majeure Clause"];
const SHEET = "Providing and Fixing of single Skin Senela Profile, Overall Width of 1060 mm and covered width of 1000mm, with six Crests (29mm crest height, width of 25 mm at the top of the crest and 74 mm at the base of the crest), spaced at 200 mm - crest centre to centre, and with two stiffening ribs (20mm) at the centre of each valley of the sheet, with two anti-capillary grooves (5 mm) on either side of each crest making the Trapezoidal Profile the best in the Industry in terms of appearance, strength and cost effectiveness.";

/* ---------- helpers ---------- */
export const inr = (n) => Number(n || 0).toLocaleString("en-IN");
export const fd = (s) => (s ? s.split("-").reverse().join("/") : "");
/** area (sq ft) of one price row: the typed area if the admin overrode it, else length x width */
export const rowArea = (r) => {
  if (r.area !== "" && r.area !== undefined && r.area !== null) return Math.round((Number(r.area) || 0) * 100) / 100;
  return Math.round((Number(r.length) || 0) * (Number(r.width) || 0) * 100) / 100;
};
export const rowAmount = (r) => rowArea(r) * (Number(r.rate) || 0);
const num = (n) => String(Math.round(Number(n) * 100) / 100);
export const cityTitle = (s) => String(s || "").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
const NAf = (a) => a.map((v) => String(v || "").trim() || "NA");
export const effv = (d) => ({
  Bv: NAf(d.b),
  Cv: d.cOn ? NAf(d.c) : CL.map(() => "NA"),
  Ov: d.oOn ? NAf(d.o) : OL.map(() => "NA"),
  Xv: d.xOn ? NAf(d.x) : XL.map(() => "NA"),
});
const rows = (l, v, s) => l.map((x, i) => [(s || 0) + i + 1, x, v[i]]);
const H = (...c) => ({ H: c });
const S = (t) => h("div", { className: "sh" }, t);
const W3 = [52, "56%", null], W5 = [46, null, 74, 74, 108];
const cg = (w) => h("colgroup", null, w.map((x, i) => h("col", { key: i, style: x ? { width: x } : {} })));

const Hdr = (logo) => h("div", { className: "hd" }, h("img", { src: logo, alt: "logo" }), h("div", { className: "cn" }, "SENELA INTERNATIONAL VENTURES PRIVATE LIMITED"));
const Ftr = (cov) => h("div", { className: "ft" }, h("img", { src: ISO, alt: "ISO" }),
  h("div", null, "Tel: + 91 " + (cov ? "9942466663" : "0447970026") + ", Corporate office: - No: - 3, 3A, 3rd Floor, K&T Business Tower,", h("br"),
    "Gowri Ammal 1st Street, Porur, Rajagopal Nagar, Chennai-600116", h("br"),
    "Factory: - No:-32,33&34, SIDCO Nagapattinam, Email: info@senelainternational.com", h("br"),
    "Commercial Reg.No. U23955TN2023PTC166250" + (cov ? "," : ",Paid-up Capital: INR. 1,000,000.")));
const Pg = (n, d, logo, kids, bst) => h("div", { className: "page", key: "p" + n }, Hdr(logo), h("div", { className: "bd" }, n),
  h("div", { className: "rd" }, h("span", null, "SIVPL/PEB: Ref: No:/" + d.ref), h("span", null, "Date: " + fd(d.date))),
  h("div", { className: "body", style: bst }, kids), Ftr());
const Sign = () => h("img", { src: SIG, alt: "Managing Director signature", style: { width: 230, height: 95, display: "block", margin: "2px 0" } });

/* ---------- content as small blocks, paginated by measured height ---------- */
/** OPTIONAL section (after Section 7 – Prices): editable per quotation, these are the standard lines */
export const DEFAULT_OPTIONAL = ["i)  Civil Works: RCC foundations, footings, flooring, and civil masonry works are excluded from the above scope and will be quoted separately, if required to be included in our scope.", "ii)  Roof Ventilator will be charged at Rs.7500/- per piece.", "iii)  Doors & Windows will be charged at actual.", "iv)  Transport will be extra at actual."];
export const optionalLines = (d) => (Array.isArray(d.optionalText) && d.optionalText.length ? d.optionalText : DEFAULT_OPTIONAL);

/** The content blocks of pages 3+ (shared with the Word export in buildPebDocx.js). */
export function mk(d) {
  const Bk = [];
  const add = (el, o) => Bk.push({ el: typeof el === "function" ? el : () => el, ...o });
  const sp = (n) => add(h("div", { style: { height: n || 8 } }), { sp: 1 });
  const hd = (t, sec, brk) => add(S(t), { keep: 1, sec, brk });
  const para = (t, k) => add(h("p", null, t), k ? { keep: 1 } : {});
  const list = (a) => a.forEach((t) => add(h("div", { style: { margin: "2px 0" } }, t)));
  const row = (cells, cls, keep, w) =>
    add((f, x) => h("table", { className: "t" + (f ? " first" : ""), style: x ? { height: x } : undefined }, cg(w || W3), h("tbody", null, h("tr", { className: cls }, cells))), { tb: 1, keep });
  const tbl = (rs, w) => {
    rs.forEach((r) => {
      if (typeof r === "string") row(h("td", { colSpan: 3, className: "bn" }, r), "", 1, w);
      else if (r.H) row(r.H.map((c, j) => h("td", { key: j }, c)), "hh", 1, w);
      else row(r.map((c, j) => h("td", { key: j }, c)), "", 0, w);
    });
    sp();
  };
  const { Bv, Cv, Ov, Xv } = effv(d);
  const reqs = d.reqs || [];
  const grand = reqs.reduce((a, r) => a + rowAmount(r), 0);

  hd("Section 1. BUILDING DESCRIPTION", "Building Description");
  tbl(["BUILDING DESCRIPTION", H("S.No.", "Parameter", "Details"), ...rows(BL, Bv), ...(d.cOn ? ["CANOPIES", ...rows(CL, Cv)] : [])]);
  tbl([...(d.oOn ? ["OPENINGS, SKYLIGHTS & TURBO VENTS", ...rows(OL, Ov)] : []), "DESIGN & LOADING", H("Sr no.", "Parameter", "Details"), ...DL.map((r, i) => [i + 1, ...r]), H("Sr no.", "Parameter", "Details"), ...DF.map((r, i) => [i + 1, ...r]), H("Sr no.", "Assumption/Remark", "Details"), ...AS.map((r, i) => [i + 1, ...r])]);
  if (d.xOn) tbl(["Crane 1", ...rows(XL, Xv)]);
  hd("EXCLUSIONS:"); list(["1. Roof/wall extracts fans & other exhaust systems", "2. All doors/windows, rolling shutter", "3. Masonry work & supervision.", "4. Miscellaneous steel except as specified herein.", "5. Crane Girder and Accessories"]);
  hd("Section 2. Standard Supplied Items:", "Standard Supplied Material"); para("The materials supplied by Senela are as per the Standards applicable to Senela Buildings.");
  list(["1. Anchor Bolts.", "2. Flashing and Trims", "3. Closure Strips", "4. Sealing Tape", "5. Rod Bracing", "6. Connection Bolt", "7. Sheeting Fasteners"]);
  hd("Section 3. Material Specification", "Material Specification");
  hd("A. ANCHOR BOLT"); para("The steel column strut of Pre-Engineered Building and RCC interface shall be designed as a fixed/pinned base with a minimum of 20 mm Dia anchor bolt according to the design calculation.");
  hd("B. ROOFING SHEET: GALVALUME"); para(SHEET);
  hd("C. CLADDING: COLOR COATED GALVALUME"); para(SHEET);
  hd("D. SHEETING FASTENERS"); para("The sheets will be fastened with No.14-10 x 20mm (or as per design) galvanized hex-self tapping metal screws of approved make and quality including EPDM / Neoprene washer on each crest of sheets for connecting with purlins (or as per design).");
  hd("E. FLASHING AND TRIMS:"); para("Suitable flashing shall be provided at the eaves in PPGI Sheets. Material used for manufacture of Flashing shall be same as that of wall cladding. Flashing shall be provided at the junction/termination edges of sheeting, vertical corners, barge-roof to wall cladding etc., to ensure neat finish and trims, flashing be matching to wall cladding.");
  hd("F. SEALER:"); para("Sealer should be applied as per requirement at side laps and end laps of roof panels and around self flashing windows. Sealer shall be 6 mm wide x 5 mm thick, asbestos fiber filled pressure sensitive Butyl tapes. The sealer shall be non-asphalted, non-shrinking, non-drying and non-toxic and shall have superior adhesion to metals, plastics and painted surfaces at temperatures from –51 degree Celsius to +104 degrees Celsius.");
  hd("Section 4. Steel Work Finish: (Primary & Secondary Steel):", "Steel Work Finish"); para("Primary steel shall be cleaned to specification St2. One shop primer coat of Red Oxide primer shall be applied with an average dry film Thickness of 25 microns on all red steel. Shop primer provides protection for elements while in transit and construction and is not intended to be for permanent protection. The final paint ENAMEL will be applied at site.");
  hd("Section 5. Completion Period:", "Completion Period");
  list(["3.1  Completion period is 08 -10 Weeks from the date of receipt and acceptance of the following:", "I)  Signed Contract (Any change must be noted and initialed by both parties).", "Ii)  As per payment terms.", "Iii)  Final change order.", 'iv)  Signed final "approved as noted" Approval Drawings.']);
  para("3.2 Please allow a minimum of 10 Days for Approval Drawings to be submitted. Approval drawings must be returned to our Office within 7 Days of receipt by customer. Any delay in the return of the approval drawings back to Senela may result in change in delivery commitment.");
  hd("Section 6. Proposal Validity:", "Proposal validity"); para("This proposal is valid for 15 days from the above noted date. Any extension of validity by Senela International Ventures Pvt Ltd must be in writing.");
  hd("Changes/Revisions:"); para("Any change and /or revision to the above stated scope of supply may lead to a variation in the price and the delivery period. A change must not hold payment for work completed in the original contract.");
  hd("Section 7. PRICES :Pre-Engineered Steel Building", "Prices");
  row(h("td", { colSpan: 5, className: "ctr", style: { fontSize: 14 } }, "PRE-ENGINEERED STEEL BUILDING – " + ((reqs[0] && reqs[0].title.replace(/^PRE-ENGINEERED STEEL BUILDING\s*–?\s*/i, "")) || "A TYPE")), "", 1, W5);
  row(["SL.NO", "PARTICULAR", "AREA", "RATE/SQFT", "AMOUNT(RS)"].map((x) => h("td", { key: x, style: { textAlign: "center" } }, x)), "", 1, W5);
  reqs.forEach((r, i) => {
    const sel = [...PARTICULARS.filter((_, k) => r.par?.[k]), ...(r.cus || [])];
    const dims = r.length && r.width ? " – " + num(r.length) + " X " + num(r.width) + " ft" : "";
    row([h("td", { key: 1, style: { verticalAlign: "top" } }, String(i + 1)),
      h("td", { key: 2, style: { verticalAlign: "top", paddingBottom: sel.length ? 14 : 4 } }, (r.title || "REQUIREMENT") + dims,
        sel.length ? h("div", { style: { marginTop: 14, lineHeight: 1.9 } }, sel.map((x) => h("div", { key: x }, "☑  " + x))) : null),
      h("td", { key: 3, style: { verticalAlign: "middle", textAlign: "center" } }, inr(rowArea(r)), h("br"), "SQ. FT"),
      h("td", { key: 4, style: { verticalAlign: "middle", textAlign: "center" } }, "₹" + inr(r.rate)),
      h("td", { key: 5, style: { verticalAlign: "middle", textAlign: "center" } }, "₹" + inr(rowAmount(r)) + "/-")], "", 0, W5);
  });
  if (reqs.length > 1) row([h("td", { key: 1, colSpan: 4, style: { textAlign: "right", fontWeight: 700 } }, "TOTAL (GST 18% extra)"), h("td", { key: 2, style: { textAlign: "center", fontWeight: 700 } }, "₹" + inr(grand) + "/-")], "", 0, W5);
  sp(10);
  hd("OPTIONAL");
  optionalLines(d).forEach((t) => {
    // "i)  text" -> label in its own column so wrapped lines stay aligned under the text
    const m = /^\s*((?:[ivxIVX]+|[a-zA-Z]|\d+)[.)]|•)\s+([\s\S]*)$/.exec(t);
    add(m
      ? h("div", { style: { display: "flex", margin: "3px 0", lineHeight: 1.45 } }, h("span", { style: { flex: "0 0 30px" } }, m[1]), h("span", { style: { flex: 1, textAlign: "justify" } }, m[2]))
      : h("div", { style: { margin: "3px 0", lineHeight: 1.45, textAlign: "justify" } }, t));
  });
  hd("1. Terms & Conditions:"); para("GST 18% excluding; Taxes are subjected to change as levied by the Government. If there is any change in GST Tax, Excise tariff or statutory levels imposed by the government at the time of shipment, such additional charges to be borne by the Buyer.");
  hd("2. Payment Terms:"); list(["• 10% Advance along with Work order / Signed contract.", "• 40% At the stage of approval of drawings or design report.", "• 25% Against PEB Materials in-ward at site (Before Erection).", "• 20% Against completion of Structural Erection (Before Sheeting).", "• 05% Against completion of Sheet fixing."]);
  hd("3. Bank Details");
  add(h("table", { style: { borderSpacing: "0 2px" } }, h("tbody", null, [["Beneficiary Name", "Senela International Ventures Pvt Ltd"], ["Bank Name", "ICICI Bank"], ["Account Number", "603705020036"], ["IFSC Code", "ICIC0006037"], ["Branch", "ICICI Bank Limited, 236, Velachery Main Road, Selaiyur, Chennai – 600073"]].map((r) => h("tr", { key: r[0] }, h("td", { style: { width: 130, verticalAlign: "top" } }, r[0]), h("td", null, ": " + r[1]))))));
  hd("Section 8. Assumption, Deviations & Exclusions:", "Assumptions & Deviations");
  list(["1. Items and codes which are not mentioned in this proposal are not in Senela International Scope of supply.", "2. It is the customer’s responsibility to verify that the specified loads are adequate for the building use.", "3. Electricity 3 phase supply and water to be provided free of cost at site during the erection of structures.", "4. Force Majeure Clause will be applicable.", "5. Building measurement should be taken O/O of metal sheet line only."]);
  hd("Section 9. Force Majeure Clause:", "Force Majeure Clause"); para("Standard Force Majeure Clause will be applicable.");
  para("SELLER shall not be liable for any loss or damage to BUYER for delay in delivery or non - Delivery, but not limited to war riots, civil commotion, insurrections, revolution, civil war, regulations, orders or acts of any authority directly or indirectly interfering more burdensome the production or delivery of the products, floods fires weather conditions, factory Pg shutdown or alterations, embargoes, delays in or shortage of transportation or inability to obtain labor power failure and any other circumstance or event Beyond The Control Of The Seller.");
  hd("Governing Law:"); para("This Agreement shall be construed and endorsed in accordance with and under the laws of the Republic of India. Both parties agree that the Indian Courts shall be the competent ones to hear any dispute arising out of or in connection with this Agreement. Despite the foregoing or any other future understanding or Agreement wherever it is provided for SELLER shall also have the right to take legal action and proceedings before the courts of the BUYER’s place of business or any other jurisdiction where BUYER may have property or assets.", 1);
  para("We thank you for your enquiry and look forward to receiving your valuable purchase order.", 1);
  add(h("div", { style: { marginTop: 10 } }, "For SENELA INTERNATIONAL VENTURES PVT LTD", Sign(), "Authorized Signatory"));
  return Bk;
}

function paginate(B, hs) {
  const pages = [[]], secPage = {};
  let used = 0;
  for (let i = 0; i < B.length; i++) {
    let need = hs[i], j = i;
    while (B[j].keep && j + 1 < B.length) { j++; need += hs[j]; }
    if (B[i].brk && pages[pages.length - 1].length) { pages.push([]); used = 0; }
    const cur = pages[pages.length - 1];
    if (B[i].sp && !cur.length) continue;
    if (used + need > PH && cur.length) { pages.push([]); used = 0; if (B[i].sp) continue; }
    pages[pages.length - 1].push(i); used += hs[i];
    if (B[i].sec && !(B[i].sec in secPage)) secPage[B[i].sec] = pages.length + 2;
  }
  return { pages, secPage, hs };
}

const AttachmentPg = (n, d, logo, a) => h("div", { className: "page attachment-page", key: "att-" + n }, Hdr(logo), h("div", { className: "bd" }, n),
  h("div", { className: "rd" }, h("span", null, "SIVPL/PEB: Ref: No:/" + d.ref), h("span", null, "Date: " + fd(d.date))),
  h("div", { className: "body" }, h("img", { className: "attimg", src: a.data, alt: a.name })), h("div", { className: "attlabel" }, a.name), Ftr());
function buildPages(d, lay, B, logo) {
  const pad = (n) => String(n || "").padStart(2, "0");
  const coverImg = d.cover || "";
  const cover = h("div", { className: "page", key: "cv" }, Hdr(logo), h("div", { className: "cvw" }, h("div", { className: "cvt" }, "Quotation for"),
    h("div", { className: "cvb" }, "PROPOSED PRE-ENGINEERED STEEL BUILDING", h("div", { style: { fontSize: 32, fontWeight: 700, marginTop: 6 } }, [d.project, d.loc].filter(Boolean).join(" – ").toUpperCase())),
    h("div", { className: "cvi" }, h("img", { src: coverImg }))), Ftr(true));
  const letter = Pg(1, d, logo, [h("div", { className: "ctr", key: "q", style: { margin: "0 0 22px" } }, "QUOTATION"),
    h("div", { key: "t" }, "To", h("br"), d.toName + ",",
      d.person ? [h("br", { key: "b1" }), "Kind Attn: " + d.person + ","] : null,
      d.phone ? [h("br", { key: "b2" }), "Phone: " + d.phone] : null,
      d.email ? [h("br", { key: "b3" }), "Email: " + d.email] : null,
      ...String(d.addr || "").split(/\n+/).filter(Boolean).map((ln, k) => [h("br", { key: "a" + k }), ln + (k === String(d.addr).split(/\n+/).filter(Boolean).length - 1 ? "." : ",")]),
      d.gst ? [h("br", { key: "b4" }), "GSTIN: " + d.gst + "."] : null),
    h("p", { key: "s", style: { marginTop: 22 } }, "Sub: Supply & Erection of Pre-Engineered Building (PEB) for your " + d.project.toUpperCase() + " Project" + (d.loc ? " at " + cityTitle(d.loc) : "") + " - reg"),
    h("p", { key: "a" }, "Dear Sir,"),
    h("p", { key: "b" }, "With reference to your inquiry, and subsequent discussion we had had with you, please find enclosed here with our proposal for your kind perusal."),
    h("p", { key: "c" }, "We believe that our Indexed Proposal / Offer will facilitate easy reference."),
    h("p", { key: "e" }, "In case you do require any further clarifications, please feel free to revert to the undersigned with your queries."),
    h("p", { key: "f" }, "Thanking you and assuring you of our best services at all times, we remain,"),
    h("div", { key: "v" }, "Very truly yours,", h("br"), "For Senela International Ventures Pvt. Ltd."),
    h("div", { key: "sg" }, Sign()),
    h("div", { key: "n", style: { marginTop: 16 } }, "R. Elangovan", h("br"), "9942466663")]);
  const index = Pg(2, d, logo, [h("div", { className: "ctr", key: "i", style: { textDecoration: "underline", margin: "10px 0 20px" } }, "PROPOSAL INDEX"),
    h("table", { key: "x", className: "t first", style: { height: 820, fontSize: 16 } }, cg([90, null, 110]), h("tbody", null,
      h("tr", { className: "hh", style: { height: 50 } }, ["Section", "DESCRIPTION", "PAGE"].map((x) => h("td", { key: x }, x))),
      IDN.map((n, i) => h("tr", { key: n, style: { height: Math.floor(770 / IDN.length) } }, h("td", { style: { textAlign: "center" } }, i + 1), h("td", null, n), h("td", { style: { textAlign: "center" } }, pad(lay.secPage[n]))))))]);
  const NP = lay.pages.length;
  const flow = lay.pages.map((p, k) => {
    const last = k === NP - 1, sum = p.reduce((a, bi) => a + lay.hs[bi], 0), per = Math.max(0, Math.min((874 - sum) / p.length, last ? 14 : 40));
    const kids = p.map((bi, pos) => {
      const b = B[bi], first = !(pos > 0 && B[p[pos - 1]].tb);
      return h("div", { className: "blk", key: bi, style: b.tb ? undefined : { paddingBottom: per } }, b.el(first, b.tb ? lay.hs[bi] + per : undefined));
    });
    return Pg(k + 3, d, logo, kids, undefined);
  });
  const attachments = (d.attachments || []).map((a, i) => AttachmentPg(NP + 3 + i, d, logo, a));
  return [...(coverImg ? [cover] : []), letter, index, ...flow, ...attachments];
}

/** Renders the whole quotation. `onReady(element)` fires once pagination is done and every image has loaded. */
export function PebDoc({ d, logo, zoom = 1, onReady }) {
  const B = useMemo(() => mk(d), [d]);
  const mr = useRef(null), box = useRef(null);
  const [lay, setLay] = useState(null);
  useEffect(() => {
    let dead = false;
    setLay(null);
    (async () => {
      try { await document.fonts.ready; } catch (e) { /* ignore */ }
      await new Promise((r) => setTimeout(r, 80));
      if (dead || !mr.current) return;
      setLay(paginate(B, [...mr.current.children].map((c) => c.offsetHeight)));
    })();
    return () => { dead = true; };
  }, [B]);
  useEffect(() => {
    if (!lay || !onReady || !box.current) return undefined;
    let dead = false;
    const imgs = [...box.current.querySelectorAll("img")];
    Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => {
      if (!dead) onReady(box.current);
    });
    return () => { dead = true; };
  }, [lay]); // eslint-disable-line react-hooks/exhaustive-deps
  const pg = lay ? buildPages(d, lay, B, logo) : null;
  return h("div", { className: "pq" },
    h("div", { className: "body meas", ref: mr }, B.map((b, i) => h("div", { className: "blk", key: i }, b.el(true)))),
    pg ? h("div", { ref: box, style: { zoom } }, pg) : h("div", null, "Preparing pages…"));
}
