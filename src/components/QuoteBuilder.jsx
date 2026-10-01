import { useMemo, useState } from "react";
import { generateQuotation } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import { money } from "../utils/format.js";

const SQFT_PER_SQM = 10.7639104;

/** Area in sq ft = length x width (metres, from the customer's form) converted to sq ft. */
function autoArea(lead) {
  const e = lead.enquiry;
  if (e?.spanWidthM && e?.lengthM) return Math.round(Number(e.spanWidthM) * Number(e.lengthM) * SQFT_PER_SQM);
  return lead.squareFeet ? Math.round(Number(lead.squareFeet)) : 0;
}

/**
 * Admin step: the area is calculated from the customer's form (length x width), the admin types only the
 * rate per sq ft. Everything else in the quotation (Section 1 tables, crane, openings) is filled from the form.
 */
export default function QuoteBuilder({ lead, onGenerated, onCancel }) {
  const e = lead.enquiry;
  const computed = useMemo(() => autoArea(lead), [lead]);
  const [area, setArea] = useState(String(computed || ""));
  const [rate, setRate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amount = (Number(area) || 0) * (Number(rate) || 0);
  const hasDims = e?.spanWidthM && e?.lengthM;

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!(Number(area) > 0)) { setError("Area is missing - enter the area in sq ft."); return; }
    if (!(Number(rate) > 0)) { setError("Enter the rate per sq ft."); return; }
    setError("");
    setSubmitting(true);
    try {
      const quotation = await generateQuotation(lead.id, {
        ratePerSqft: Number(rate),
        areaSqft: Number(area),
      });
      onGenerated(quotation);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form className="quote-builder" onSubmit={handleSubmit}>
      <p className="muted">
        The building details come from the customer's form. Set the rate per sq ft - the amount is calculated for you.
      </p>
      <Alert>{error}</Alert>

      <div className="quote-summary" style={{ marginBottom: 16 }}>
        <div className="row"><span className="muted">Length</span><span>{e?.lengthM ? `${e.lengthM} m` : "-"}</span></div>
        <div className="row"><span className="muted">Width</span><span>{e?.spanWidthM ? `${e.spanWidthM} m` : "-"}</span></div>
        <div className="row">
          <span className="muted">Area (length x width)</span>
          <span>{hasDims ? `${Number(computed).toLocaleString("en-IN")} sq ft` : "Not available from form"}</span>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="qb-area">Area (sq ft)</label>
          <input id="qb-area" type="number" step="1" min="0" value={area} onChange={(ev) => setArea(ev.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="qb-rate">Rate per sq ft (₹) *</label>
          <input id="qb-rate" type="number" step="0.01" min="0" autoFocus value={rate}
            onChange={(ev) => setRate(ev.target.value)} placeholder="e.g. 485" />
        </div>
      </div>

      <div className="quote-summary">
        <div className="row total-row"><span>Amount</span><span>{money(amount)}/-</span></div>
        <p className="muted note">GST is stated as extra in the quotation's terms.</p>
      </div>

      <div className="row actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Generating…" : "Generate quotation"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
      </div>
    </form>
  );
}
