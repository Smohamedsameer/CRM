import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEnquiryPrefill, submitEnquiry } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import RadioGroup from "../components/RadioGroup.jsx";
import PolicyFooter from "../components/PolicyFooter.jsx";
import {
  BUILDING_TYPES, CLADDING_MATERIALS, COLUMN_TYPES, END_FRAME_TYPES, SCOPE_OF_WORK_OPTIONS,
} from "../utils/constants.js";

const EMPTY = {
  // Building
  buildingType: "", buildingTypeOther: "", noOfSheds: "",
  endFrameType: "", columnType: "",
  // Dimensions (metres)
  spanWidthM: "", lengthM: "", clearEaveHeightM: "", eaveHeightM: "",
  // Cladding
  roofCladdingMaterial: "", roofCladdingThickness: "", roofCladdingColour: "",
  sideCladdingMaterial: "", sideCladdingThickness: "", sideCladdingColour: "",
  // Crane
  craneRequired: "", craneType: "", craneCapacityTonnes: "", craneHeightM: "",
  // Scope
  scopeOfWork: "", scopeOfWorkLocation: "",
  // General (kept from the original enquiry form, for anything not covered above)
  requirement: "", location: "", requiredDate: "",
  specifications: "", additionalRequirements: "", remarks: "",
};

/** Customer-facing enquiry form, matching the company's PEB request form. Reached via /enquiry/:token */
export default function Enquiry() {
  const { token } = useParams();
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getEnquiryPrefill(token)
      .then((data) => !cancelled && setCustomer(data))
      .catch((err) => !cancelled && setLoadError(err.message || "This enquiry link is invalid or has expired."));
    return () => { cancelled = true; };
  }, [token]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleChange(e) {
    set(e.target.name, e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      await submitEnquiry({
        token,
        ...form,
        spanWidthM: form.spanWidthM ? Number(form.spanWidthM) : null,
        lengthM: form.lengthM ? Number(form.lengthM) : null,
        clearEaveHeightM: form.clearEaveHeightM ? Number(form.clearEaveHeightM) : null,
        eaveHeightM: form.eaveHeightM ? Number(form.eaveHeightM) : null,
        craneRequired: form.craneRequired === "" ? null : form.craneRequired === "yes",
        requiredDate: form.requiredDate ? `${form.requiredDate}T00:00:00` : null,
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  }

  const craneYes = form.craneRequired === "yes";

  return (
    <div className="container">
      <div className="card">
        <h2>Request form for PEB</h2>
        <p className="muted">A few details about your building so we can prepare an accurate quotation.</p>

        <Alert>{loadError}</Alert>
        <Alert type="success">
          {done ? "Thank you! Your enquiry has been received. We'll send your quotation on WhatsApp shortly." : ""}
        </Alert>

        {!loadError && !done && (
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="field">
                <label htmlFor="c-name">Name</label>
                <input id="c-name" disabled value={customer?.customerName ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="c-company">Company</label>
                <input id="c-company" disabled value={customer?.companyName ?? ""} />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="c-phone">Phone</label>
                <input id="c-phone" disabled value={customer?.phone ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="c-email">Email</label>
                <input id="c-email" disabled value={customer?.email ?? ""} />
              </div>
            </div>

            <hr />
            <h3>1. Type of building</h3>
            <RadioGroup legend="Type of building" name="buildingType" options={BUILDING_TYPES} value={form.buildingType} onChange={(v) => set("buildingType", v)} required />
            {form.buildingType === "OTHER" && (
              <div className="field">
                <label htmlFor="buildingTypeOther">Please specify</label>
                <input id="buildingTypeOther" name="buildingTypeOther" value={form.buildingTypeOther} onChange={handleChange} />
              </div>
            )}
            <div className="field">
              <label htmlFor="noOfSheds">No. of sheds</label>
              <input id="noOfSheds" name="noOfSheds" value={form.noOfSheds} onChange={handleChange} />
            </div>

            <hr />
            <h3>2. Frame &amp; column</h3>
            <RadioGroup legend="Type of end frames" name="endFrameType" options={END_FRAME_TYPES} value={form.endFrameType} onChange={(v) => set("endFrameType", v)} />
            <RadioGroup legend="Column" name="columnType" options={COLUMN_TYPES} value={form.columnType} onChange={(v) => set("columnType", v)} />

            <hr />
            <h3>3. Building dimensions (main shed)</h3>
            <div className="row">
              <div className="field">
                <label htmlFor="spanWidthM">Span / Width (metres)</label>
                <input id="spanWidthM" name="spanWidthM" type="number" step="0.01" min="0" value={form.spanWidthM} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="lengthM">Length (metres)</label>
                <input id="lengthM" name="lengthM" type="number" step="0.01" min="0" value={form.lengthM} onChange={handleChange} />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="clearEaveHeightM">Clear eave height (metres)</label>
                <input id="clearEaveHeightM" name="clearEaveHeightM" type="number" step="0.01" min="0" value={form.clearEaveHeightM} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="eaveHeightM">Eave height (metres)</label>
                <input id="eaveHeightM" name="eaveHeightM" type="number" step="0.01" min="0" value={form.eaveHeightM} onChange={handleChange} />
              </div>
            </div>

            <hr />
            <h3>4. Roof cladding (main shed)</h3>
            <RadioGroup legend="Material" name="roofCladdingMaterial" options={CLADDING_MATERIALS} value={form.roofCladdingMaterial} onChange={(v) => set("roofCladdingMaterial", v)} />
            <div className="row">
              <div className="field">
                <label htmlFor="roofCladdingThickness">Thickness</label>
                <input id="roofCladdingThickness" name="roofCladdingThickness" value={form.roofCladdingThickness} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="roofCladdingColour">Colour</label>
                <input id="roofCladdingColour" name="roofCladdingColour" value={form.roofCladdingColour} onChange={handleChange} />
              </div>
            </div>

            <h3>5. Side cladding</h3>
            <RadioGroup legend="Material" name="sideCladdingMaterial" options={CLADDING_MATERIALS} value={form.sideCladdingMaterial} onChange={(v) => set("sideCladdingMaterial", v)} />
            <div className="row">
              <div className="field">
                <label htmlFor="sideCladdingThickness">Thickness</label>
                <input id="sideCladdingThickness" name="sideCladdingThickness" value={form.sideCladdingThickness} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="sideCladdingColour">Colour</label>
                <input id="sideCladdingColour" name="sideCladdingColour" value={form.sideCladdingColour} onChange={handleChange} />
              </div>
            </div>

            <hr />
            <h3>6. Provision of crane &amp; hoist</h3>
            <RadioGroup
              legend="Applicable?"
              name="craneRequired"
              options={[{ value: "yes", label: "Applicable" }, { value: "no", label: "Not applicable" }]}
              value={form.craneRequired}
              onChange={(v) => set("craneRequired", v)}
            />
            {craneYes && (
              <div className="row">
                <div className="field">
                  <label htmlFor="craneType">Crane type</label>
                  <input id="craneType" name="craneType" value={form.craneType} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="craneCapacityTonnes">Capacity (tonnes)</label>
                  <input id="craneCapacityTonnes" name="craneCapacityTonnes" value={form.craneCapacityTonnes} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="craneHeightM">Height, floor to hook (metres)</label>
                  <input id="craneHeightM" name="craneHeightM" value={form.craneHeightM} onChange={handleChange} />
                </div>
              </div>
            )}

            <hr />
            <h3>7. Scope of work</h3>
            <RadioGroup legend="You require us to quote for" name="scopeOfWork" options={SCOPE_OF_WORK_OPTIONS} value={form.scopeOfWork} onChange={(v) => set("scopeOfWork", v)} required />
            {(form.scopeOfWork === "SUPPLY_AT_SITE" || form.scopeOfWork === "OTHER") && (
              <div className="field">
                <label htmlFor="scopeOfWorkLocation">{form.scopeOfWork === "OTHER" ? "Please specify" : "Site location"}</label>
                <input id="scopeOfWorkLocation" name="scopeOfWorkLocation" value={form.scopeOfWorkLocation} onChange={handleChange} />
              </div>
            )}

            <hr />
            <h3>8. Anything else</h3>
            <div className="field">
              <label htmlFor="requirement">Requirement / purpose of building *</label>
              <textarea id="requirement" name="requirement" required placeholder="Describe what you need" value={form.requirement} onChange={handleChange} />
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="location">Site location</label>
                <input id="location" name="location" value={form.location} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="requiredDate">Offer required by</label>
                <input id="requiredDate" name="requiredDate" type="date" value={form.requiredDate} onChange={handleChange} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="specifications">Other specifications</label>
              <textarea id="specifications" name="specifications" placeholder="Skylight, insulation, ventilation, gutters, canopy, road access, etc." value={form.specifications} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="additionalRequirements">Additional requirements</label>
              <textarea id="additionalRequirements" name="additionalRequirements" value={form.additionalRequirements} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="remarks">Remarks</label>
              <textarea id="remarks" name="remarks" value={form.remarks} onChange={handleChange} />
            </div>

            <Alert>{submitError}</Alert>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !customer}>
              {submitting ? "Submitting…" : "Submit enquiry"}
            </button>
          </form>
        )}
      </div>
      <PolicyFooter />
    </div>
  );
}
