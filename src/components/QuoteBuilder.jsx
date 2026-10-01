import { useMemo, useState } from "react";
import { generateQuotation } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import { money, labelize } from "../utils/format.js";

let nextId = 1;
const newRow = (description = "", quantity = 1, unitPrice = "") => ({ id: nextId++, description, quantity, unitPrice });

/** Builds suggested line items from the customer's submitted PEB requirement, for the admin to price. */
function suggestItems(lead) {
  const e = lead.enquiry;
  const rows = [];
  const area = e?.spanWidthM && e?.lengthM ? Number(e.spanWidthM) * Number(e.lengthM) : null;

  if (e?.buildingType) {
    const type = e.buildingType === "OTHER" ? e.buildingTypeOther : labelize(e.buildingType);
    const dims = e.spanWidthM && e.lengthM ? ` (${e.spanWidthM}m x ${e.lengthM}m)` : "";
    rows.push(newRow(`PEB structure – ${type || "building"}${dims}`, area || 1, ""));
  }
  if (e?.roofCladdingMaterial) {
    const detail = [labelize(e.roofCladdingMaterial), e.roofCladdingThickness, e.roofCladdingColour].filter(Boolean).join(", ");
    rows.push(newRow(`Roof cladding – ${detail}`, area || 1, ""));
  }
  if (e?.sideCladdingMaterial) {
    const detail = [labelize(e.sideCladdingMaterial), e.sideCladdingThickness, e.sideCladdingColour].filter(Boolean).join(", ");
    rows.push(newRow(`Side cladding – ${detail}`, 1, ""));
  }
  if (e?.craneRequired) {
    const detail = [e.craneType, e.craneCapacityTonnes && `${e.craneCapacityTonnes} T`].filter(Boolean).join(", ");
    rows.push(newRow(`Crane provision${detail ? ` – ${detail}` : ""}`, 1, ""));
  }
  if (rows.length === 0 && lead.squareFeet) {
    rows.push(newRow(`Flooring / installation work (${lead.squareFeet} sq. ft.)`, lead.squareFeet, ""));
  }
  if (rows.length === 0) rows.push(newRow());
  return rows;
}

export default function QuoteBuilder({ lead, onGenerated, onCancel }) {
  const [items, setItems] = useState(() => suggestItems(lead));
  const [discount, setDiscount] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateItem(id, field, value) {
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setItems((rows) => [...rows, newRow()]);
  }
  function removeRow(id) {
    setItems((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  }

  const subtotal = useMemo(
    () => items.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0), 0),
    [items]
  );
  const discountAmt = Number(discount) || 0;
  const taxAmt = (subtotal - discountAmt) * ((Number(taxPercentage) || 0) / 100);
  const total = subtotal - discountAmt + taxAmt;

  async function handleSubmit(e) {
    e.preventDefault();
    const validItems = items.filter((r) => r.description.trim() && Number(r.unitPrice) > 0);
    if (validItems.length === 0) {
      setError("Enter a rate for at least one line item.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const quotation = await generateQuotation(lead.id, {
        items: validItems.map((r) => ({
          description: r.description.trim(),
          quantity: Number(r.quantity) || 1,
          unitPrice: Number(r.unitPrice),
        })),
        discount: discount !== "" ? Number(discount) : null,
        taxPercentage: taxPercentage !== "" ? Number(taxPercentage) : null,
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
        Review the customer's requirement below and set a rate for each item. The total is calculated automatically.
      </p>
      <Alert>{error}</Alert>

      {items.map((row) => (
        <div className="item-row" key={row.id}>
          <div className="field">
            <label>Description</label>
            <input value={row.description} onChange={(e) => updateItem(row.id, "description", e.target.value)} placeholder="e.g. Roof cladding – CCGL 0.5mm" />
          </div>
          <div className="field">
            <label>Qty</label>
            <input type="number" step="0.01" min="0" value={row.quantity} onChange={(e) => updateItem(row.id, "quantity", e.target.value)} />
          </div>
          <div className="field">
            <label>Rate (₹)</label>
            <input type="number" step="0.01" min="0" value={row.unitPrice} onChange={(e) => updateItem(row.id, "unitPrice", e.target.value)} placeholder="0.00" />
          </div>
          <div className="amount-display">{money((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0))}</div>
          <button type="button" className="remove-btn" onClick={() => removeRow(row.id)} aria-label="Remove item">×</button>
        </div>
      ))}

      <button type="button" className="btn btn-secondary" onClick={addRow}>+ Add item</button>

      <div className="row" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Discount (₹)</label>
          <input type="number" step="0.01" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field">
          <label>Tax (%)</label>
          <input type="number" step="0.01" min="0" value={taxPercentage} onChange={(e) => setTaxPercentage(e.target.value)} placeholder="e.g. 18" />
        </div>
      </div>

      <div className="quote-summary">
        <div className="row"><span className="muted">Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="row"><span className="muted">Discount</span><span>{money(discountAmt)}</span></div>
        <div className="row"><span className="muted">Tax</span><span>{money(taxAmt)}</span></div>
        <div className="row total-row"><span>Total</span><span>{money(total)}</span></div>
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
