import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLead } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import { SOURCES } from "../utils/constants.js";

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  customerName: "", companyName: "", phone: "", email: "",
  squareFeet: "", estimatedAmount: "", source: "META_AD",
  address: "", pincode: "", gstNumber: "", projectName: "", quotationDate: today(),
};

/** Shrinks a chosen photo to max 1600px JPEG so the lead request stays small. Resolves to a data URL. */
function readCoverImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a valid image."));
      img.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AddLead() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [cover, setCover] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCover(await readCoverImage(file));
      setError("");
    } catch (err) {
      setCover("");
      setError(err.message);
    }
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
        address: form.address.trim() || null,
        pincode: form.pincode.trim() || null,
        gstNumber: form.gstNumber.trim().toUpperCase() || null,
        projectName: form.projectName.trim() || null,
        quotationDate: form.quotationDate || null,
        coverImage: cover || null,
      });
      setSuccess(`Lead ${lead.leadCode} saved. The WhatsApp welcome message is on its way.`);
      setForm({ ...EMPTY, quotationDate: today() });
      setCover("");
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

          <div className="field">
            <label htmlFor="address">Address (shown in the quotation "To" block)</label>
            <textarea id="address" name="address" rows={3} placeholder={"Street / area,\nCity,\nState"} value={form.address} onChange={handleChange} />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="pincode">Pincode</label>
              <input id="pincode" name="pincode" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" title="6-digit pincode"
                value={form.pincode} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="gstNumber">GST number</label>
              <input id="gstNumber" name="gstNumber" maxLength={15} pattern="[0-9A-Za-z]{15}" title="15-character GSTIN"
                style={{ textTransform: "uppercase" }} value={form.gstNumber} onChange={handleChange} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="projectName">Project name (cover page & subject)</label>
              <input id="projectName" name="projectName" placeholder="e.g. SRI AYYAPPA GLASS HOUSE - KARUR" value={form.projectName} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="quotationDate">Quotation date</label>
              <input id="quotationDate" name="quotationDate" type="date" value={form.quotationDate} onChange={handleChange} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="coverImage">Cover image (quotation first page)</label>
            <input id="coverImage" type="file" accept="image/*" onChange={handleCover} />
            {cover && (
              <img src={cover} alt="Cover preview" style={{ marginTop: 10, maxHeight: 140, borderRadius: 10, border: "1px solid var(--border)" }} />
            )}
            <p className="muted note">Leave empty to use the standard Senela building photo.</p>
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
