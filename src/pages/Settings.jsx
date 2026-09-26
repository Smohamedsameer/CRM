import { useEffect, useState } from "react";
import {
  changePassword, getCompanySettings, getPricingSettings, updateCompanySettings, updatePricingSettings,
} from "../api/index.js";
import Alert from "../components/Alert.jsx";

const TABS = [
  { id: "company", label: "Company Profile" },
  { id: "pricing", label: "Pricing Defaults" },
  { id: "account", label: "My Account" },
];

export default function Settings() {
  const [tab, setTab] = useState("company");

  return (
    <div className="container">
      <h2>Settings</h2>
      <div className="settings-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`settings-tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "company" && <CompanyProfileTab />}
      {tab === "pricing" && <PricingDefaultsTab />}
      {tab === "account" && <MyAccountTab />}
    </div>
  );
}

function CompanyProfileTab() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCompanySettings().then(setForm).catch((err) => setError(err.message));
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await updateCompanySettings(form);
      setForm(updated);
      setSuccess("Company profile updated. New quotations and WhatsApp messages will use these details.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div className="card"><Alert>{error}</Alert>{!error && <p className="muted">Loading…</p>}</div>;

  return (
    <form className="card" onSubmit={handleSubmit}>
      <Alert>{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="field">
        <label htmlFor="name">Company name *</label>
        <input id="name" name="name" required value={form.name || ""} onChange={handleChange} />
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" value={form.phone || ""} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email || ""} onChange={handleChange} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="address">Address</label>
        <textarea id="address" name="address" value={form.address || ""} onChange={handleChange} />
      </div>
      <div className="field">
        <label htmlFor="gstNumber">GST number</label>
        <input id="gstNumber" name="gstNumber" value={form.gstNumber || ""} onChange={handleChange} />
      </div>
      <p className="muted note">Shown on quotation PDFs and in WhatsApp messages sent to customers.</p>
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function PricingDefaultsTab() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPricingSettings().then(setForm).catch((err) => setError(err.message));
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await updatePricingSettings({
        ratePerSquareFoot: Number(form.ratePerSquareFoot) || 0,
        defaultAdditionalCharges: Number(form.defaultAdditionalCharges) || 0,
        defaultDiscountPercentage: Number(form.defaultDiscountPercentage) || 0,
        defaultTaxPercentage: Number(form.defaultTaxPercentage) || 0,
      });
      setForm(updated);
      setSuccess("Pricing defaults updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div className="card"><Alert>{error}</Alert>{!error && <p className="muted">Loading…</p>}</div>;

  return (
    <form className="card" onSubmit={handleSubmit}>
      <Alert>{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="row">
        <div className="field">
          <label htmlFor="ratePerSquareFoot">Rate per sq. ft. (₹)</label>
          <input id="ratePerSquareFoot" name="ratePerSquareFoot" type="number" step="0.01" min="0"
            value={form.ratePerSquareFoot ?? ""} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="defaultAdditionalCharges">Flat additional charges (₹)</label>
          <input id="defaultAdditionalCharges" name="defaultAdditionalCharges" type="number" step="0.01" min="0"
            value={form.defaultAdditionalCharges ?? ""} onChange={handleChange} />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="defaultDiscountPercentage">Default discount (%)</label>
          <input id="defaultDiscountPercentage" name="defaultDiscountPercentage" type="number" step="0.01" min="0" max="100"
            value={form.defaultDiscountPercentage ?? ""} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="defaultTaxPercentage">Default tax / GST (%)</label>
          <input id="defaultTaxPercentage" name="defaultTaxPercentage" type="number" step="0.01" min="0" max="100"
            value={form.defaultTaxPercentage ?? ""} onChange={handleChange} />
        </div>
      </div>
      <p className="muted note">
        Used whenever a quotation line item is created without its own rate, and as the starting
        discount/tax when building a quotation.
      </p>
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function MyAccountTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.status === 401 || err.status === 403 ? "Current password is incorrect." : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Change password</h3>
      <Alert>{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="field">
        <label htmlFor="currentPassword">Current password</label>
        <input id="currentPassword" type="password" autoComplete="current-password" required
          value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="newPassword">New password</label>
        <input id="newPassword" type="password" autoComplete="new-password" required minLength={6}
          value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="confirmPassword">Confirm new password</label>
        <input id="confirmPassword" type="password" autoComplete="new-password" required minLength={6}
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
