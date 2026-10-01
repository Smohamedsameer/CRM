import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLead } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import { SOURCES } from "../utils/constants.js";

const EMPTY = {
  customerName: "", companyName: "", phone: "", email: "",
  squareFeet: "", estimatedAmount: "", source: "META_AD",
};

export default function AddLead() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return; // a second click would create a duplicate lead and a second WhatsApp message
    setError("");
    setSaving(true);
    try {
      const lead = await createLead({
        customerName: form.customerName.trim(),
        companyName: form.companyName.trim() || null,
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        squareFeet: form.squareFeet ? Number(form.squareFeet) : null,
        estimatedAmount: form.estimatedAmount ? Number(form.estimatedAmount) : null,
        source: form.source,
      });
      setSuccess(`Lead ${lead.leadCode} saved. The WhatsApp welcome message is on its way.`);
      setForm(EMPTY);
      timer.current = setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Add lead</h2>
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="field">
              <label htmlFor="customerName">Customer name *</label>
              <input id="customerName" name="customerName" required value={form.customerName} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="companyName">Company name</label>
              <input id="companyName" name="companyName" value={form.companyName} onChange={handleChange} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="phone">Phone number *</label>
              <input
                id="phone" name="phone" required placeholder="+91XXXXXXXXXX"
                pattern="\+?[0-9]{7,15}" title="Digits only, with an optional leading +. No spaces."
                value={form.phone} onChange={handleChange}
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="squareFeet">Square feet</label>
              <input id="squareFeet" name="squareFeet" type="number" step="0.01" min="0" value={form.squareFeet} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="estimatedAmount">Estimated amount (₹)</label>
              <input id="estimatedAmount" name="estimatedAmount" type="number" step="0.01" min="0" value={form.estimatedAmount} onChange={handleChange} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="source">Source *</label>
            <select id="source" name="source" required value={form.source} onChange={handleChange}>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? "Saving…" : "Save lead"}
          </button>
          <p className="muted note">
            Saving sends the customer a WhatsApp welcome message with their enquiry form link.
          </p>
        </form>
      </div>
    </div>
  );
}
