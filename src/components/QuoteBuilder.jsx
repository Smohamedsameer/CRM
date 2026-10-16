import { useEffect, useMemo, useState } from "react";
import { generateQuotation, getPricingSettings, saveQuotationFormData, uploadQuotationPdf } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import { money } from "../utils/format.js";
import { PebDoc, PARTICULARS, DEFAULT_OPTIONAL, rowArea, rowAmount, inr } from "../quotation/PebDoc.jsx";
import { buildPebPdf } from "../quotation/buildPebPdf.js";
import { defaultsFromLead, newRow } from "../quotation/pebDefaults.js";
import logoUrl from "../quotation/assets/logo.png";

const todayIso = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; };
const readFile = (f) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0 14px" };

function Field({ label, value, onChange, placeholder, options, type = "text", disabled, id, hint, step }) {
  const list = options ? `${id}-list` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} step={step} list={list} value={value} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      {hint && <small className="muted">{hint}</small>}
      {options && <datalist id={list}>{options.map((o) => <option key={o} value={o} />)}</datalist>}
    </div>
  );
}

/** One serial-numbered requirement in Section 7: the admin types Length x Width, the area is calculated, and the rate is entered. */
function PriceRow({ r, no, onChange, onRemove, canRemove }) {
  const set = (k, v) => onChange({ ...r, [k]: v });
  const auto = (Number(r.length) || 0) * (Number(r.width) || 0);
  const area = rowArea(r);
  const [cus, setCus] = useState("");
  return (
    <div className="price-row">
      <div className="price-row-head">
        <span className="price-no">{no}</span>
        <input aria-label={`Requirement ${no} title`} className="price-title" value={r.title} onChange={(e) => set("title", e.target.value)} placeholder="Requirement (e.g. CANOPY)" />
        {canRemove && <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>}
      </div>
      {r.hint && <p className="muted price-hint">From the customer's form: {r.hint}</p>}
      <div className="price-grid">
        <Field id={`len-${r.id}`} label="Length (ft)" type="number" step="any" value={r.length} onChange={(v) => set("length", v)} placeholder="84" />
        <Field id={`wid-${r.id}`} label="Width (ft)" type="number" step="any" value={r.width} onChange={(v) => set("width", v)} placeholder="38" />
        <Field id={`area-${r.id}`} label={`Area (sq ft)${r.area === "" ? " – auto L × W" : ""}`} type="number" step="any"
          value={r.area === "" ? (auto ? String(Math.round(auto * 100) / 100) : "") : r.area} onChange={(v) => set("area", v)} placeholder="auto" />
        <Field id={`rate-${r.id}`} label="Rate per sq ft (₹)" type="number" step="any" value={r.rate} onChange={(v) => set("rate", v)} placeholder="554" />
        <div className="field"><label>Amount (₹)</label><div className="price-amount">{money(rowAmount(r))}</div></div>
      </div>
      {r.area !== "" && <button type="button" className="link-btn" onClick={() => set("area", "")}>↺ Use Length × Width for the area</button>}
      <details className="price-particulars">
        <summary>Particulars printed under this item ({PARTICULARS.filter((_, i) => r.par[i]).length + r.cus.length} selected)</summary>
        <div className="checkbox-options" style={{ marginTop: 8 }}>
          {PARTICULARS.map((p, i) => (
            <label key={p} className="checkbox-option"><input type="checkbox" checked={!!r.par[i]} onChange={() => set("par", r.par.map((v, j) => (j === i ? !v : v)))} /><span>{p}</span></label>
          ))}
          {r.cus.map((p) => (
            <label key={p} className="checkbox-option"><input type="checkbox" checked onChange={() => set("cus", r.cus.filter((x) => x !== p))} /><span>{p}</span></label>
          ))}
        </div>
        <div className="row" style={{ marginTop: 8, alignItems: "end" }}>
          <Field id={`cus-${r.id}`} label="Add another particular" value={cus} onChange={setCus} placeholder="e.g. Mezzanine floor" />
          <div className="field" style={{ flex: "0 0 auto" }}>
            <button type="button" className="btn btn-secondary" onClick={() => { const v = cus.trim(); if (v && !r.cus.includes(v)) set("cus", [...r.cus, v]); setCus(""); }}>+ Add</button>
          </div>
        </div>
      </details>
    </div>
  );
}

export default function QuoteBuilder({ lead, onGenerated, onCancel }) {
  const [d, setD] = useState(() => ({ ...defaultsFromLead(lead), date: todayIso() }));
  const [optText, setOptText] = useState(DEFAULT_OPTIONAL.join("\n")); // OPTIONAL section, one item per line
  const [uploads, setUploads] = useState([]);     // extra images -> one new page each, after the last page
  const [snap, setSnap] = useState(null);         // preview snapshot
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const setAt = (k, i, v) => setD((x) => ({ ...x, [k]: x[k].map((y, j) => (j === i ? v : y)) }));
  const setRow = (id, row) => setD((x) => ({ ...x, reqs: x.reqs.map((r) => (r.id === id ? row : r)) }));

  // default rate per sq ft from Settings -> Pricing: pre-fills the first requirement only (editable)
  useEffect(() => {
    getPricingSettings().then((p) => {
      if (!p?.ratePerSquareFoot) return;
      setD((x) => ({ ...x, reqs: x.reqs.map((r, i) => (i === 0 && !r.rate ? { ...r, rate: String(Number(p.ratePerSquareFoot)) } : r)) }));
    }).catch(() => {});
  }, []);

  const total = d.reqs.reduce((a, r) => a + rowAmount(r), 0);

  const assemble = (extra = {}) => ({
    ...d, date: d.date || todayIso(),
    optionalText: optText.split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
    refs: [], attachments: uploads, ...extra, // no reference-image pages in the PDF
  });

  async function addUploads(e) {
    const files = [...(e.target.files || [])];
    const added = await Promise.all(files.map(async (f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name.replace(/\.[^.]+$/, ""), data: await readFile(f) })));
    setUploads((u) => [...u, ...added]);
    e.target.value = "";
  }

  async function setCover(e) {
    const f = e.target.files?.[0];
    if (f) set("cover", await readFile(f));
    e.target.value = "";
  }

  function validate() {
    if (!d.toName.trim()) return "Enter the customer / company name.";
    if (!d.reqs.length) return "Add at least one requirement in Section 7.";
    for (let i = 0; i < d.reqs.length; i++) {
      const r = d.reqs[i];
      if (!r.title.trim()) return `Serial no ${i + 1}: enter the requirement name (or remove the row).`;
      if (!rowArea(r)) return `Serial no ${i + 1} (${r.title}): enter Length × Width (or the area).`;
      if (!(Number(r.rate) > 0)) return `Serial no ${i + 1} (${r.title}): enter the rate per sq ft.`;
    }
    return "";
  }

  /** Creates the quotation, builds + stores its PDF, and remembers the details (for "Download Word" later). */
  async function build() {
    const problem = validate();
    if (problem) return setError(problem);
    setError("");
    setSubmitting(true);
    let q = null;
    try {
      setStage("Creating quotation…");
      q = await generateQuotation(lead.id, {
        items: d.reqs.map((r) => ({
          description: `${r.title}${r.length && r.width ? ` – ${r.length} X ${r.width} ft` : ""}`,
          quantity: rowArea(r), unitPrice: Number(r.rate),
        })),
        discount: 0,
        taxPercentage: 0, // the quotation states "GST 18% excluding"
      });
      setStage("Preparing the PEB quotation PDF (this takes a few seconds)…");
      const blob = await buildPebPdf(assemble({ ref: d.ref.trim() || q.quotationNumber }), logoUrl);
      setStage("Saving the PDF…");
      await uploadQuotationPdf(q.id, blob);
      let wordNote = "";
      try {
        setStage("Saving the quotation details…");
        await saveQuotationFormData(q.id, assemble({ ref: d.ref.trim() || q.quotationNumber }));
      } catch {
        wordNote = " (The details for “Download Word” could not be saved.)";
      }
      onGenerated(q, `Quotation ${q.quotationNumber} generated. In the Quotations list below you can View it, Download Word, Upload PDF and Send via WhatsApp.${wordNote}`, wordNote ? "error" : "success");
    } catch (err) {
      setSubmitting(false);
      setStage("");
      setError(q
        ? `Quotation ${q.quotationNumber} was created, but the PEB PDF could not be prepared (${err.message}). A basic PDF is attached instead – close this form and check the Quotations list.`
        : err.message);
    }
  }

  const previewData = useMemo(() => snap, [snap]);

  return (
    <form className="quote-builder" onSubmit={(e) => { e.preventDefault(); build(); }}>
      <p className="muted">
        Enter the ref no, date, cover image and the Section 7 prices. The <strong>To</strong> address comes from the lead, and the building / requirement details come from the customer's form – they are filled into the quotation automatically.
      </p>
      <Alert>{error}</Alert>

      <div className="pq-group">
        <h4>Quotation addressed to (from the lead)</h4>
        <p style={{ margin: 0 }}>
          <strong>{d.toName || "—"}</strong>
          {d.person && d.person !== d.toName ? <> – Kind Attn: {d.person}</> : null}
          <br />
          <span className="muted">{[d.phone, d.email].filter(Boolean).join(" · ") || "No phone / email on the lead"}</span>
          {d.addr && (<><br /><span className="muted">{d.addr}</span></>)}
          {d.project && (<><br /><span className="muted">Project name (cover &amp; subject): {d.project}</span></>)}
          {d.loc && (<><br /><span className="muted">Project location: {d.loc}</span></>)}
        </p>
      </div>

      <div className="pq-group">
        <h4>Quotation details</h4>
        <div style={grid}>
          <Field id="qref" label="Ref no" value={d.ref} onChange={(v) => set("ref", v)} placeholder="Leave empty to use the auto quotation number" />
          <Field id="qdate" label="Date" type="date" value={d.date} onChange={(v) => set("date", v)} />
        </div>
        <div className="row" style={{ alignItems: "center" }}>
          <div className="field">
            <label htmlFor="cover">Cover image (optional – no image means no cover page)</label>
            <input id="cover" type="file" accept="image/*" onChange={setCover} />
          </div>
          {d.cover && (
            <div className="field" style={{ flex: "0 0 auto", display: "flex", gap: 10, alignItems: "center" }}>
              <img src={d.cover} alt="Cover preview" style={{ height: 56, borderRadius: 6, border: "1px solid var(--border)" }} />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => set("cover", "")}>Remove cover</button>
            </div>
          )}
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="attach">Attachments (optional – each image is added as a new page after the last page)</label>
          <input id="attach" type="file" accept="image/*" multiple onChange={addUploads} />
        </div>
        {uploads.map((u, i) => (
          <div key={u.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <img src={u.data} alt={u.name} style={{ height: 44, borderRadius: 6, border: "1px solid var(--border)" }} />
            <input value={u.name} style={{ flex: 1 }} aria-label="Caption"
              onChange={(e) => setUploads((l) => l.map((x) => (x.id === u.id ? { ...x, name: e.target.value } : x)))} />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setUploads((l) => l.filter((x) => x.id !== u.id))}>Remove</button>
          </div>
        ))}
      </div>

      <div className="pq-group">
        <h4>Section 7 – Prices (enter manually)</h4>
        <p className="muted" style={{ marginTop: 0 }}>
          Serial numbers are taken from the customer's requirements. For each one enter Length × Width (ft); the area is calculated, then enter the rate. Remove a row if it is not being quoted, or add your own.
        </p>
        {d.reqs.map((r, i) => (
          <PriceRow key={r.id} r={r} no={i + 1} onChange={(row) => setRow(r.id, row)} canRemove={d.reqs.length > 1}
            onRemove={() => set("reqs", d.reqs.filter((x) => x.id !== r.id))} />
        ))}
        <button type="button" className="btn btn-secondary" style={{ marginBottom: 14 }}
          onClick={() => set("reqs", [...d.reqs, newRow({ title: "PRE-ENGINEERED STEEL BUILDING", par: PARTICULARS.map(() => true) })])}>
          + Add requirement (serial no {d.reqs.length + 1})
        </button>
      </div>

      <div className="pq-group">
        <h4>OPTIONAL section (Quotation Page 6)</h4>
        <p className="muted" style={{ marginTop: 0 }}>
          Printed in the quotation right after Section 7 – Prices, and in the downloaded PDF. One item per line (start a line with i) ii) iii) … to number it). Leave it empty to use the standard lines.
        </p>
        <textarea rows={7} value={optText} onChange={(e) => setOptText(e.target.value)}
          style={{ width: "100%", minHeight: 150, boxSizing: "border-box", padding: 12, font: "inherit" }} aria-label="OPTIONAL section content" />
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setOptText(DEFAULT_OPTIONAL.join("\n"))}>
          Reset to standard lines
        </button>
      </div>

      <div className="quote-summary">
        {d.reqs.map((r, i) => (
          <div className="row" key={r.id}><span className="muted">{i + 1}. {r.title || "—"} ({inr(rowArea(r))} sq ft × ₹{inr(r.rate)})</span><span>{money(rowAmount(r))}</span></div>
        ))}
        <div className="row total-row"><span>Total (GST 18% extra)</span><span>{money(total)}</span></div>
      </div>

      {submitting && <p className="muted" role="status">{stage}</p>}
      <div className="row actions">
        <button type="button" className="btn btn-secondary" onClick={() => setSnap(assemble({ ref: d.ref.trim() || "(preview)" }))} disabled={submitting}>{previewData ? "Refresh preview" : "Preview"}</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Please wait…" : "Generate quotation"}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
      </div>

      {previewData && (
        <div className="pq-preview">
          <PebDoc d={previewData} logo={logoUrl} zoom={0.62} />
        </div>
      )}
    </form>
  );
}
