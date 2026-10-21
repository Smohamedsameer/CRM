/* Word (.docx) version of the PEB quotation.
 *
 * It reuses the SAME content blocks as the PDF (mk() in PebDoc.jsx), so the wording, tables and prices are
 * identical. The page layout is normal flowing Word content (real tables, paragraphs, header and footer),
 * so alignment can be fixed in Word and the result saved as PDF and uploaded back to the quotation.
 *
 * The "docx" library is loaded on demand so it does not slow down the rest of the app.
 */
import React from "react";
import { mk, IDN, fd, cityTitle } from "./PebDoc.jsx";
import SIG from "./assets/signature.jpg";
import ISO from "./assets/iso.jpg";

const h = React.createElement;
const PX = 15; // 1 CSS px = 15 twips
const PAGE = { width: 11906, height: 16838 }; // A4
const MARGIN = { top: 2350, bottom: 1500, left: 600, right: 600, header: 300, footer: 200 };
const CONTENT_W = PAGE.width - MARGIN.left - MARGIN.right;
const NAVY = "1F4E79";
const BASE = { size: 20 }; // 10 pt body text

/* ------------------------------------------------------------------ element helpers */
const isEl = (n) => n && typeof n === "object" && !Array.isArray(n) && "type" in n && "props" in n;
function flat(children) {
  const out = [];
  const walk = (c) => {
    if (c === null || c === undefined || c === false || c === true) return;
    if (Array.isArray(c)) c.forEach(walk);
    else out.push(c);
  };
  walk(children);
  return out;
}
const kids = (el, type) => flat(el.props.children).filter((c) => isEl(c) && c.type === type);
const classes = (el) => String((el.props && el.props.className) || "").split(/\s+/);

function collectImages(node, set) {
  flat(node).forEach((c) => {
    if (!isEl(c)) return;
    if (c.type === "img" && c.props.src) set.add(c.props.src);
    collectImages(c.props.children, set);
  });
}

/* ------------------------------------------------------------------ images */
async function loadBytes(src) {
  if (src.startsWith("data:")) {
    const bin = atob(src.slice(src.indexOf(",") + 1));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  const res = await fetch(src);
  return new Uint8Array(await res.arrayBuffer());
}

/** Detects PNG / JPEG and reads the pixel size from the file header. Returns null for anything else (e.g. WEBP). */
function sniff(b) {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return { type: "png", w: dv.getUint32(16), h: dv.getUint32(20) };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { type: "jpg", h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
      }
      i += 2 + ((b[i + 2] << 8) | b[i + 3]);
    }
  }
  return null;
}

/** Browser only: redraws a picture as a (smaller) JPEG. Used for uploaded pictures, which may be WEBP or huge. */
async function reencode(src) {
  const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
  const k = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const g = c.getContext("2d");
  g.fillStyle = "#fff";
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.9));
  return new Uint8Array(await blob.arrayBuffer());
}

async function loadImage(src, userPicture) {
  let data = await loadBytes(src);
  let info = sniff(data);
  if (typeof document !== "undefined" && (userPicture || !info)) {
    try { data = await reencode(src); info = sniff(data); } catch { /* keep the original bytes */ }
  }
  if (!info) throw new Error("A picture in the quotation is in a format Word cannot use (use JPG or PNG).");
  return { data, ...info };
}

/* ------------------------------------------------------------------ the builder */
export async function buildPebDocx(d, logo) {
  const docx = await import("docx");
  const {
    AlignmentType, BorderStyle, Bookmark, Document, Footer, Header, HeightRule, ImageRun, LineRuleType, PageNumber, PageReference,
    Packer, Paragraph, ShadingType, Table, TableCell, TableLayoutType, TableRow, TabStopType, TextRun, VerticalAlign, WidthType, UnderlineType,
  } = docx;

  /* ---- what has to be drawn ---- */
  const Sign = () => h("img", { src: SIG, alt: "signature", style: { width: 230, height: 95, display: "block", margin: "2px 0" } });
  const blocks = mk(d);
  const flowEls = blocks.map((b) => b.el(true));
  const cityPart = d.loc ? " at " + cityTitle(d.loc) : "";
  const addrLines = String(d.addr || "").split(/\n+/).filter(Boolean);
  const letterEls = [
    h("div", { className: "ctr", style: { margin: "0 0 22px" } }, "QUOTATION"),
    h("div", null, "To", h("br"), d.toName + ",",
      d.person ? [h("br", { key: "b1" }), "Kind Attn: " + d.person + ","] : null,
      d.phone ? [h("br", { key: "b2" }), "Phone: " + d.phone] : null,
      d.email ? [h("br", { key: "b3" }), "Email: " + d.email] : null,
      ...addrLines.map((ln, k) => [h("br", { key: "a" + k }), ln + (k === addrLines.length - 1 ? "." : ",")]),
      d.gst ? [h("br", { key: "b4" }), "GSTIN: " + d.gst + "."] : null),
    h("p", { style: { marginTop: 22 } }, "Sub: Supply & Erection of Pre-Engineered Building (PEB) for your " + String(d.project || "").toUpperCase() + " Project" + cityPart + " - reg"),
    h("p", null, "Dear Sir,"),
    h("p", null, "With reference to your enquiry, and subsequent discussion we had with you, please find enclosed here with our proposal for your kind perusal."),
    h("p", null, "We believe that our Indexed Proposal / Offer will facilitate easy reference."),
    h("p", null, "In case you do require any further clarifications, please feel free to revert to the undersigned with your queries."),
    h("p", null, "Thanking you and assuring you of our best services at all times, we remain,"),
    h("div", null, "Very truly yours,", h("br"), "For Senela International Ventures Pvt. Ltd."),
    h("div", null, Sign()),
    h("div", { style: { marginTop: 16 } }, "R. Elangovan", h("br"), "9942466663"),
  ];

  /* ---- load every picture once ---- */
  const staticSrc = new Set([logo, ISO]);
  collectImages([flowEls, letterEls], staticSrc);
  const userSrc = new Set([...(d.cover ? [d.cover] : []), ...(d.attachments || []).map((a) => a.data)]);
  const imgs = new Map();
  await Promise.all([
    ...[...staticSrc].map(async (s) => imgs.set(s, await loadImage(s, false))),
    ...[...userSrc].map(async (s) => imgs.set(s, await loadImage(s, true))),
  ]);

  const imageRun = (src, w, hgt) => {
    const im = imgs.get(src);
    const width = w || Math.min(im.w, 400);
    const height = hgt || Math.round((width * im.h) / im.w);
    return new ImageRun({ type: im.type, data: im.data, transformation: { width, height } });
  };
  /** Picture that must fit inside maxW x maxH (px), keeping its proportions. */
  const fitted = (src, maxW, maxH) => {
    const im = imgs.get(src);
    const k = Math.min(maxW / im.w, maxH / im.h, 1);
    return imageRun(src, Math.round(im.w * k), Math.round(im.h * k));
  };

  /* ---- styles ---- */
  const ALIGN = { center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED, left: AlignmentType.LEFT };
  const run = (text, st) => new TextRun({
    text, font: "Calibri", size: st.size || BASE.size, bold: st.bold || undefined, italics: st.italics || undefined, color: st.color,
    underline: st.underline ? { type: UnderlineType.SINGLE } : undefined,
    shading: st.fill ? { type: ShadingType.CLEAR, fill: st.fill, color: "auto" } : undefined,
  });
  const styleOf = (el, base) => {
    const p = el.props || {}, s = p.style || {}, cls = classes(el);
    const st = { ...base };
    if (el.type === "b" || el.type === "strong") st.bold = true;
    if (el.type === "i" || el.type === "em") st.italics = true;
    if (s.fontWeight && Number(s.fontWeight) >= 600) st.bold = true;
    if (typeof s.fontSize === "number") st.size = Math.round(s.fontSize * 1.5);
    if (s.textDecoration === "underline") st.underline = true;
    if (cls.includes("ctr") || s.textAlign === "center") st.align = "center";
    else if (s.textAlign === "right") st.align = "right";
    else if (s.textAlign === "justify") st.align = "justify";
    if (cls.includes("sh")) { st.fill = "FFFF00"; st.size = 22; }
    return st;
  };
  /** CSS margin -> [top, bottom] px */
  const marginsOf = (el) => {
    const s = (el.props && el.props.style) || {};
    let top = 0, bottom = 0;
    if (typeof s.margin === "string") {
      const v = s.margin.split(/\s+/).map((x) => parseFloat(x) || 0);
      top = v[0]; bottom = v.length === 1 ? v[0] : v.length === 2 ? v[0] : v[2];
    }
    if (typeof s.marginTop === "number") top = s.marginTop;
    if (typeof s.marginBottom === "number") bottom = s.marginBottom;
    if (el.type === "p" && !s.margin && s.marginTop === undefined) { top = 6; bottom = 6; }
    if (classes(el).includes("sh")) { top = 10; bottom = 6; }
    return [top, bottom];
  };

  /* ---- element tree -> paragraph descriptors / tables ---- */
  const inline = (el, st) => {
    const s2 = styleOf(el, st);
    const out = [];
    flat(el.props.children).forEach((c) => {
      if (typeof c === "string" || typeof c === "number") out.push(run(String(c), s2));
      else if (isEl(c)) {
        if (c.type === "br") out.push(new TextRun({ break: 1 }));
        else if (c.type === "img") out.push(imageRun(c.props.src, c.props.style?.width, c.props.style?.height));
        else out.push(...inline(c, s2));
      }
    });
    return out;
  };

  function toBlocks(nodes, st) {
    const out = [];
    let buf = [];
    const flush = () => { if (buf.length) { out.push({ p: true, items: buf, align: st.align }); buf = []; } };
    flat(nodes).forEach((n) => {
      if (typeof n === "string" || typeof n === "number") { buf.push(run(String(n), st)); return; }
      if (!isEl(n)) return;
      const t = n.type, s = n.props.style || {};
      if (t === "br") { buf.push(new TextRun({ break: 1 })); return; }
      if (t === "img") {
        const r = imageRun(n.props.src, s.width, s.height);
        if (s.display === "block") { flush(); out.push({ p: true, items: [r], align: st.align }); } else buf.push(r);
        return;
      }
      if (t === "span" || t === "b" || t === "strong" || t === "i" || t === "em") { buf.push(...inline(n, st)); return; }
      if (t === "table") { flush(); out.push({ table: buildTable([n]) }); return; }
      if (t === "div" || t === "p") { flush(); out.push(...blockEl(n, st)); }
    });
    flush();
    return out;
  }

  function blockEl(el, st) {
    const s = el.props.style || {};
    const st2 = styleOf(el, st);
    const [mt, mb] = marginsOf(el);
    const line = typeof s.lineHeight === "number" ? Math.round(s.lineHeight * 240) : el.type === "p" ? 348 : undefined;
    const children = flat(el.props.children);

    // empty spacer block
    if (!children.length) {
      return typeof s.height === "number" ? [{ p: true, items: [], exact: Math.max(20, s.height * PX) }] : [];
    }
    // "i)  text" row: label in its own column so wrapped lines stay aligned under the text
    if (s.display === "flex" && children.length === 2 && children.every((c) => isEl(c) && c.type === "span")) {
      const label = inline(children[0], st2), text = inline(children[1], st2);
      return [{ p: true, items: [...label, new TextRun({ text: "\t" }), ...text], align: "justify", before: mt * 7, after: mb * 7, line: 348, indent: { left: 450, hanging: 450 }, tabs: [450] }];
    }
    const res = toBlocks(children, st2);
    const paras = res.filter((r) => r.p);
    if (paras.length) {
      paras.forEach((r) => { if (line && !r.line) r.line = line; });
      const f = res.find((r) => r.p), l = [...res].reverse().find((r) => r.p);
      f.before = (f.before || 0) + mt * 7; // halved: Word adds both margins, CSS collapses them
      l.after = (l.after || 0) + mb * 7;
    }
    return res;
  }

  /* ---- tables: the PDF stores every table row as its own <table>; consecutive ones become ONE Word table ---- */
  const tableSig = (t) => JSON.stringify(kids(t, "colgroup").map((g) => kids(g, "col").map((c) => (c.props.style || {}).width ?? null)));
  const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  function buildTable(els) {
    const bordered = classes(els[0]).includes("t");
    const trs = [];
    els.forEach((t) => kids(t, "tbody").forEach((tb) => kids(tb, "tr").forEach((tr) => trs.push(tr))));
    const nCols = Math.max(...trs.map((tr) => kids(tr, "td").reduce((a, td) => a + (td.props.colSpan || 1), 0)));
    const group = kids(els[0], "colgroup")[0];
    let spec = group ? kids(group, "col").map((c) => (c.props.style || {}).width ?? null) : [];
    if (!spec.length) spec = nCols === 2 ? ["30%", null] : Array(nCols).fill(null);
    let fixed = 0, nulls = 0;
    const widths = spec.map((w) => {
      if (typeof w === "number") { fixed += w * PX; return w * PX; }
      if (typeof w === "string" && w.endsWith("%")) { const v = Math.round((parseFloat(w) / 100) * CONTENT_W); fixed += v; return v; }
      nulls++; return null;
    }).map((w) => (w === null ? Math.floor((CONTENT_W - fixed) / nulls) : w));
    const total = widths.reduce((a, b) => a + b, 0);

    const rows = trs.map((tr) => {
      const header = classes(tr).includes("hh");
      let col = 0;
      const cells = kids(tr, "td").map((td) => {
        const span = td.props.colSpan || 1;
        const w = widths.slice(col, col + span).reduce((a, b) => a + b, 0);
        col += span;
        const s = td.props.style || {};
        const head = header || classes(td).includes("bn");
        let st = styleOf(td, { size: bordered ? 18 : 20 });
        if (head) st = { ...st, bold: true, color: "FFFFFF", align: "center" };
        const paras = materialize(toBlocks(td.props.children, st));
        return new TableCell({
          width: { size: w, type: WidthType.DXA },
          columnSpan: span > 1 ? span : undefined,
          verticalAlign: s.verticalAlign === "top" ? VerticalAlign.TOP : VerticalAlign.CENTER,
          shading: head ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined,
          margins: { top: 30, bottom: 30, left: 90, right: 90 },
          borders: bordered ? borders : noBorders,
          children: paras.length ? paras : [new Paragraph({ children: [] })],
        });
      });
      return new TableRow({ children: cells, cantSplit: true });
    });
    return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows });
  }

  function materialize(list, opts = {}) {
    return list.map((r, i) => {
      if (r.table) return r.table;
      const items = i === 0 && opts.bookmark && r.items.length ? [new Bookmark({ id: opts.bookmark, children: r.items })] : r.items;
      return new Paragraph({
        children: items,
        alignment: ALIGN[r.align || "left"],
        spacing: {
          before: Math.round(r.before || 0), after: Math.round(r.after || 0),
          line: r.exact || r.line, lineRule: r.exact ? LineRuleType.EXACT : r.line ? LineRuleType.AUTO : undefined,
        },
        indent: r.indent,
        tabStops: r.tabs ? r.tabs.map((position) => ({ type: TabStopType.LEFT, position })) : undefined,
        keepNext: opts.keepNext || undefined,
        pageBreakBefore: (i === 0 && opts.pageBreakBefore) || undefined,
      });
    });
  }

  /* ---- header / footer (same look as the PDF) ---- */
  const logoIm = imgs.get(logo);
  const isoIm = imgs.get(ISO);
  const cellNoBorder = { borders: noBorders };
  const header = (withRef) => new Header({
    children: [
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [1300, CONTENT_W - 1300], layout: TableLayoutType.FIXED,
        borders: { top: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder, bottom: { style: BorderStyle.SINGLE, size: 12, color: "8A6D2B" } },
        rows: [new TableRow({ children: [
          new TableCell({ ...cellNoBorder, width: { size: 1300, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [imageRun(logo, Math.round((64 * logoIm.w) / logoIm.h), 64)] })] }),
          new TableCell({ ...cellNoBorder, width: { size: CONTENT_W - 1300, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: "SENELA INTERNATIONAL VENTURES PRIVATE LIMITED", font: "Calibri", size: 30, color: "A5713A", characterSpacing: 15 })] })] }),
        ] })],
      }),
      ...(withRef ? [
        new Paragraph({ spacing: { before: 60, after: 40 }, children: [new TextRun({ children: [" ", PageNumber.CURRENT, " "], font: "Calibri", size: 22, color: "FFFFFF", shading: { type: ShadingType.CLEAR, fill: "E0B878", color: "auto" } })] }),
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
          children: [run("SIVPL/PEB: Ref: No:/" + d.ref, BASE), new TextRun({ text: "\t" }), run("Date: " + fd(d.date), BASE)],
        }),
      ] : [new Paragraph({ children: [] })]),
    ],
  });
  const footer = (cover) => new Footer({
    children: [new Table({
      width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [2100, CONTENT_W - 2100], layout: TableLayoutType.FIXED,
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
      rows: [new TableRow({ children: [
        new TableCell({ ...cellNoBorder, width: { size: 2100, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ children: [imageRun(ISO, Math.round((56 * isoIm.w) / isoIm.h), 56)] })] }),
        new TableCell({ ...cellNoBorder, width: { size: CONTENT_W - 2100, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ children: [
            "Tel: + 91 " + (cover ? "9942466663" : "0447970026") + ", Corporate office: - No: - 3, 3A, 3rd Floor, K&T Business Tower,",
            "Gowri Ammal 1st Street, Porur, Rajagopal Nagar, Chennai-600116",
            "Factory: - No:-32,33&34, SIDCO Nagapattinam, Email: info@senelainternational.com",
            "Commercial Reg.No. U23955TN2023PTC166250" + (cover ? "," : ",Paid-up Capital: INR. 1,000,000."),
          ].map((t, i) => new TextRun({ text: t, font: "Calibri", size: 18, break: i ? 1 : undefined })) })] }),
      ] })],
    })],
  });

  /* ---- section content ---- */
  const sectionProps = (start) => ({ page: { size: { width: PAGE.width, height: PAGE.height }, margin: MARGIN, pageNumbers: start ? { start } : undefined } });
  const sections = [];

  if (d.cover) {
    const banner = (text, fill, size, spacing) => new Paragraph({
      alignment: AlignmentType.CENTER, spacing,
      shading: { type: ShadingType.CLEAR, fill, color: "auto" },
      children: [new TextRun({ text, font: "Arial", bold: size > 60, color: "FFFFFF", size, characterSpacing: size > 60 ? 0 : 15 })],
    });
    sections.push({
      properties: sectionProps(), headers: { default: header(false) }, footers: { default: footer(true) },
      children: [
        banner("Quotation for", "4D95DB", 80, { before: 0, after: 0, line: 1500, lineRule: LineRuleType.EXACT }),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 },
          shading: { type: ShadingType.CLEAR, fill: "0D2B55", color: "auto" },
          children: [
            new TextRun({ text: "PROPOSED PRE-ENGINEERED STEEL BUILDING", font: "Arial", color: "FFFFFF", size: 39, characterSpacing: 15, break: 0 }),
            new TextRun({ text: [d.project, d.loc].filter(Boolean).join(" – ").toUpperCase(), font: "Arial", bold: true, color: "FFFFFF", size: 48, break: 1 }),
          ],
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [fitted(d.cover, 700, 560)] }),
      ],
    });
  }

  const main = [];
  main.push(...materialize(toBlocks(letterEls, BASE)));

  // index page (page numbers are Word fields: they are filled in when the file is opened)
  const idxW = [1350, CONTENT_W - 1350 - 1650, 1650];
  const idxCell = (i, children, head) => new TableCell({
    width: { size: idxW[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, borders,
    shading: head ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined, margins: { left: 90, right: 90 }, children,
  });
  const idxP = (text, align, head) => new Paragraph({ alignment: align, children: [new TextRun({ text, font: "Calibri", size: 24, bold: head || undefined, color: head ? "FFFFFF" : undefined })] });
  main.push(new Paragraph({
    pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { before: 150, after: 300 },
    children: [new TextRun({ text: "PROPOSAL INDEX", font: "Calibri", size: 20, underline: { type: UnderlineType.SINGLE } })],
  }));
  main.push(new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: idxW, layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ height: { value: 750, rule: HeightRule.ATLEAST }, children: [
        idxCell(0, [idxP("Section", AlignmentType.CENTER, true)], true), idxCell(1, [idxP("DESCRIPTION", AlignmentType.CENTER, true)], true), idxCell(2, [idxP("PAGE", AlignmentType.CENTER, true)], true)] }),
      ...IDN.map((name, i) => new TableRow({ height: { value: 1250, rule: HeightRule.ATLEAST }, cantSplit: true, children: [
        idxCell(0, [idxP(String(i + 1), AlignmentType.CENTER)]),
        idxCell(1, [idxP(name, AlignmentType.LEFT)]),
        idxCell(2, [new Paragraph({ alignment: AlignmentType.CENTER, children: [new PageReference("sec" + i)] })]),
      ] })),
    ],
  }));

  // pages 3+ : the same blocks as the PDF
  let group = [];
  let firstFlow = true;
  const flushGroup = () => { if (group.length) { main.push(buildTable(group)); group = []; } };
  blocks.forEach((b, i) => {
    const el = flowEls[i];
    if (isEl(el) && el.type === "table") {
      if (classes(el)[0] === "t") {
        if (group.length && tableSig(group[0]) !== tableSig(el)) flushGroup();
        group.push(el);
      } else { flushGroup(); main.push(buildTable([el])); }
      return;
    }
    flushGroup();
    const list = toBlocks([el], BASE);
    const opts = { keepNext: !!b.keep, pageBreakBefore: firstFlow, bookmark: b.sec ? "sec" + IDN.indexOf(b.sec) : undefined };
    main.push(...materialize(list, opts));
    firstFlow = false;
  });
  flushGroup();

  // extra pictures: one page each
  (d.attachments || []).forEach((a) => {
    main.push(new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 }, children: [fitted(a.data, 700, 740)] }));
    main.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: a.name || "", font: "Calibri", size: 20, bold: true, color: "647084" })] }));
  });

  sections.push({ properties: sectionProps(1), headers: { default: header(true) }, footers: { default: footer(false) }, children: main });

  const doc = new Document({
    creator: "Senela International Ventures Pvt Ltd",
    title: "Quotation " + (d.ref || ""),
    features: { updateFields: true },
    styles: { default: { document: { run: { font: "Calibri", size: BASE.size } } } },
    sections,
  });
  return Packer.toBlob(doc);
}

/** Saves a Blob as a file download in the browser. */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
