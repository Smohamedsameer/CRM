import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEnquiryPrefill, submitEnquiry } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import RadioGroup from "../components/RadioGroup.jsx";
import ImageRadioGroup from "../components/ImageRadioGroup.jsx";
import CheckboxGroup from "../components/CheckboxGroup.jsx";
import PolicyFooter from "../components/PolicyFooter.jsx";
import Photo from "../components/Photo.jsx";
import PhotoChoice from "../components/PhotoChoice.jsx";
import {
  BUILDING_TYPES, CLADDING_MATERIALS, COLUMN_TYPES, END_FRAME_TYPES, SCOPE_OF_WORK_OPTIONS,
  MEASUREMENT_BASIS_OPTIONS, ROOFING_CLADDING_REQUIREMENTS, MAIN_SHED_ROOF_MATERIALS,
  SURFACE_PREPARATION_OPTIONS, PROTECTIVE_COATING_OPTIONS, YES_NO_OPTIONS,
  GUTTER_MATERIALS, DOWNPIPE_MATERIALS,
} from "../utils/constants.js";

const EMPTY = {
  // Building
  buildingType: "", buildingTypeOther: "", noOfSheds: "",
  endFrameType: "", columnType: "",
  // Dimensions (metres)
  spanWidthM: "", widthMeasurementBasis: "",
  lengthM: "", lengthMeasurementBasis: "",
  clearEaveHeightM: "", eaveHeightM: "",
  intermediateBaySpacingM: "", endBaySpacingM: "", brickWallHeightM: "", roofSlope: "",
  // Roofing & cladding
  roofingCladdingRequirement: "", mainShedRoofMaterial: "", mainShedRoofMaterialOther: "",
  roofCladdingThickness: "", roofCladdingColour: "",
  sideCladdingMaterial: "", sideCladdingThickness: "", sideCladdingColour: "",
  // Finishing
  surfacePreparation: [], protectiveCoating: "", protectiveCoatingOther: "",
  // Additional requirements
  skylightRequired: "", roofVentilatorRequired: "",
  craneRequired: "", craneType: "", craneCapacityTonnes: "", craneHeightM: "",
  // Scope
  scopeOfWork: "", scopeOfWorkLocation: "",
  // General (kept from the original enquiry form, for anything not covered above)
  requirement: "", location: "", requiredDate: "",
  specifications: "", additionalRequirements: "", remarks: "",
};

// New sections (ventilation, water-down, canopy, louver, road facilities, project period, sign-off).
// Saved together as JSON in enquiries.extra_details.
const EXTRA0 = {
  craneSize: "",
  roofVent: "", roofVentThroat: "", roofVentAch: "", roofVentQty: "",
  ridgeVent: "", ridgeVentSize: "", ridgeVentQty: "",
  eaveGutter: "", valleyGutter: "", gutterMaterial: "", gutterMaterialOther: "",
  downpipeMaterial: "", downpipeMaterialOther: "",
  canopy: "", canopySize: "", canopyHeightFfl: "",
  louver: "", louverSize: "",
  truckAccess: "", stockingPlaces: "", openingsDetails: "",
  projectPeriod: "", otherComments: "",
  givenByName: "", givenByDesignation: "", givenByAddress: "", signSeal: "",
};

/** Customer-facing enquiry form, matching the company's PEB request form. Reached via /enquiry/:token */
export default function Enquiry() {
  const { token } = useParams();
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [x, setX0] = useState(EXTRA0);
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

  function setX(field, value) {
    setX0((p) => ({ ...p, [field]: value }));
  }

  // text input bound to the extra-details state
  const T = (k, label, props = {}) => (
    <div className="field" key={k}>
      <label htmlFor={k}>{label}</label>
      <input id={k} value={x[k]} onChange={(e) => setX(k, e.target.value)} {...props} />
    </div>
  );
  const TA = (k, label) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <textarea id={k} value={x[k]} onChange={(e) => setX(k, e.target.value)} />
    </div>
  );

  function handleSeal(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 300 * 1024) { setSubmitError("Sign & seal image must be under 300 KB."); return; }
    const r = new FileReader();
    r.onload = () => setX("signSeal", r.result);
    r.readAsDataURL(f);
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
        requirement: form.requirement || "PEB building enquiry",
        extraDetails: JSON.stringify(x),
        spanWidthM: form.spanWidthM ? Number(form.spanWidthM) : null,
        lengthM: form.lengthM ? Number(form.lengthM) : null,
        clearEaveHeightM: form.clearEaveHeightM ? Number(form.clearEaveHeightM) : null,
        eaveHeightM: form.eaveHeightM ? Number(form.eaveHeightM) : null,
        intermediateBaySpacingM: form.intermediateBaySpacingM ? Number(form.intermediateBaySpacingM) : null,
        endBaySpacingM: form.endBaySpacingM ? Number(form.endBaySpacingM) : null,
        brickWallHeightM: form.brickWallHeightM ? Number(form.brickWallHeightM) : null,
        surfacePreparation: form.surfacePreparation.join(","),
        craneRequired: form.craneRequired === "" ? null : form.craneRequired === "yes",
        skylightRequired: form.skylightRequired === "" ? null : form.skylightRequired === "yes",
        roofVentilatorRequired: x.roofVent === "yes" || x.ridgeVent === "yes" ? true : (x.roofVent || x.ridgeVent ? false : null),
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
            <h3>1. Building Type and Configuration</h3>
            <ImageRadioGroup legend="Type of Building" name="buildingType" options={BUILDING_TYPES} value={form.buildingType} onChange={(v) => set("buildingType", v)} required />
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
            <RadioGroup legend="Type of End Frame" name="endFrameType" options={END_FRAME_TYPES} value={form.endFrameType} onChange={(v) => set("endFrameType", v)} required />
            <RadioGroup legend="Column Type" name="columnType" options={COLUMN_TYPES} value={form.columnType} onChange={(v) => set("columnType", v)} />

            <hr />
            <h3>2. Building Dimensions</h3>
            <img
              src="/diagrams/building-dimensions.png"
              alt="Diagram showing span/building width, eave height, clear eave height and building height"
              style={{ width: "100%", maxWidth: 520, display: "block", margin: "0 auto 16px" }}
            />
            <div className="row">
              <div className="field">
                <label htmlFor="spanWidthM">Span / Width (metres)</label>
                <input id="spanWidthM" name="spanWidthM" type="number" step="0.01" min="0" value={form.spanWidthM} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="lengthM">Building Length (metres)</label>
                <input id="lengthM" name="lengthM" type="number" step="0.01" min="0" value={form.lengthM} onChange={handleChange} />
              </div>
            </div>
            <RadioGroup legend="Width Measurement Basis" name="widthMeasurementBasis" options={MEASUREMENT_BASIS_OPTIONS} value={form.widthMeasurementBasis} onChange={(v) => set("widthMeasurementBasis", v)} />
            <RadioGroup legend="Length Measurement Basis" name="lengthMeasurementBasis" options={MEASUREMENT_BASIS_OPTIONS} value={form.lengthMeasurementBasis} onChange={(v) => set("lengthMeasurementBasis", v)} />
            <div className="row">
              <div className="field">
                <label htmlFor="clearEaveHeightM">Clear Eave Height (metres)</label>
                <input id="clearEaveHeightM" name="clearEaveHeightM" type="number" step="0.01" min="0" value={form.clearEaveHeightM} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="eaveHeightM">Eave Height (metres)</label>
                <input id="eaveHeightM" name="eaveHeightM" type="number" step="0.01" min="0" value={form.eaveHeightM} onChange={handleChange} />
              </div>
            </div>
            <div className="diagram-img">
              <Photo name={["bay-width", "bay", "bay-image"]} alt="Bay width / bay spacing diagram" />
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="intermediateBaySpacingM">Intermediate Bay Spacing (metres)</label>
                <input id="intermediateBaySpacingM" name="intermediateBaySpacingM" type="number" step="0.01" min="0" value={form.intermediateBaySpacingM} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="endBaySpacingM">End Bay Spacing (metres)</label>
                <input id="endBaySpacingM" name="endBaySpacingM" type="number" step="0.01" min="0" value={form.endBaySpacingM} onChange={handleChange} />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="brickWallHeightM">Brick Wall Height (metres)</label>
                <input id="brickWallHeightM" name="brickWallHeightM" type="number" step="0.01" min="0" value={form.brickWallHeightM} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="roofSlope">Roof Slope</label>
                <input id="roofSlope" name="roofSlope" placeholder="e.g. 1 in 10" value={form.roofSlope} onChange={handleChange} />
              </div>
            </div>

            <hr />
            <h3>3. Roofing and Cladding</h3>
            <ImageRadioGroup legend="Roofing and Side Cladding Requirement" name="roofingCladdingRequirement" options={ROOFING_CLADDING_REQUIREMENTS} value={form.roofingCladdingRequirement} onChange={(v) => set("roofingCladdingRequirement", v)} required />
            <RadioGroup legend="Main Shed Roof Material" name="mainShedRoofMaterial" options={MAIN_SHED_ROOF_MATERIALS} value={form.mainShedRoofMaterial} onChange={(v) => set("mainShedRoofMaterial", v)} required />
            {form.mainShedRoofMaterial === "OTHER" && (
              <div className="field">
                <label htmlFor="mainShedRoofMaterialOther">Please specify</label>
                <input id="mainShedRoofMaterialOther" name="mainShedRoofMaterialOther" value={form.mainShedRoofMaterialOther} onChange={handleChange} />
              </div>
            )}
            <div className="row">
              <div className="field">
                <label htmlFor="roofCladdingThickness">Roof Cladding Thickness</label>
                <input id="roofCladdingThickness" name="roofCladdingThickness" value={form.roofCladdingThickness} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="roofCladdingColour">Roof Cladding Colour</label>
                <input id="roofCladdingColour" name="roofCladdingColour" value={form.roofCladdingColour} onChange={handleChange} />
              </div>
            </div>
            <RadioGroup legend="Side Cladding Material" name="sideCladdingMaterial" options={CLADDING_MATERIALS} value={form.sideCladdingMaterial} onChange={(v) => set("sideCladdingMaterial", v)} />
            <div className="row">
              <div className="field">
                <label htmlFor="sideCladdingThickness">Side Cladding Thickness</label>
                <input id="sideCladdingThickness" name="sideCladdingThickness" value={form.sideCladdingThickness} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="sideCladdingColour">Side Cladding Colour</label>
                <input id="sideCladdingColour" name="sideCladdingColour" value={form.sideCladdingColour} onChange={handleChange} />
              </div>
            </div>

            <hr />
            <h3>4. Finishing Requirements</h3>
            <CheckboxGroup legend="Surface Preparation" options={SURFACE_PREPARATION_OPTIONS} values={form.surfacePreparation} onChange={(v) => set("surfacePreparation", v)} required />
            <RadioGroup legend="Protective Coating" name="protectiveCoating" options={PROTECTIVE_COATING_OPTIONS} value={form.protectiveCoating} onChange={(v) => set("protectiveCoating", v)} required />
            {form.protectiveCoating === "OTHER" && (
              <div className="field">
                <label htmlFor="protectiveCoatingOther">Please specify</label>
                <input id="protectiveCoatingOther" name="protectiveCoatingOther" value={form.protectiveCoatingOther} onChange={handleChange} />
              </div>
            )}

            <hr />
            <h3>5. Additional Requirements</h3>
            <RadioGroup legend="Skylight Required" name="skylightRequired" options={YES_NO_OPTIONS} value={form.skylightRequired} onChange={(v) => set("skylightRequired", v)} required />
            <PhotoChoice name="craneRequired" image="crane" title="Crane and Hoist" value={form.craneRequired} onChange={(v) => set("craneRequired", v)}>
              <div className="row">
                <div className="field">
                  <label htmlFor="craneCapacityTonnes">Capacity (tonnes)</label>
                  <input id="craneCapacityTonnes" name="craneCapacityTonnes" value={form.craneCapacityTonnes} onChange={handleChange} />
                </div>
                {T("craneSize", "Size")}
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="craneType">Crane type</label>
                  <input id="craneType" name="craneType" value={form.craneType} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="craneHeightM">Height, floor to hook (metres)</label>
                  <input id="craneHeightM" name="craneHeightM" value={form.craneHeightM} onChange={handleChange} />
                </div>
              </div>
            </PhotoChoice>

            <hr />
            <h3>6. Ventilation System</h3>
            <div className="photo-choice-grid">
              <PhotoChoice name="roofVent" image="wind1" title="a) Roof ventilator" value={x.roofVent} onChange={(v) => setX("roofVent", v)}>
                {T("roofVentThroat", "Diameter of throat")}
                {T("roofVentAch", "Air change / Hr")}
                {T("roofVentQty", "Quantity (nos)", { type: "number", min: 0 })}
              </PhotoChoice>
              <PhotoChoice name="ridgeVent" image="wind2" title="b) Ridge vent" value={x.ridgeVent} onChange={(v) => setX("ridgeVent", v)}>
                {T("ridgeVentSize", "Size")}
                {T("ridgeVentQty", "Quantity (nos)", { type: "number", min: 0 })}
              </PhotoChoice>
            </div>

            <hr />
            <h3>7. Water Down System</h3>
            <p className="muted">1) Gutter</p>
            <div className="photo-choice-grid">
              <PhotoChoice name="eaveGutter" image="gutter1" title="a) Eave gutter" value={x.eaveGutter} onChange={(v) => setX("eaveGutter", v)} />
              <PhotoChoice name="valleyGutter" image="gutter2" title="b) Valley gutter" value={x.valleyGutter} onChange={(v) => setX("valleyGutter", v)} />
            </div>
            <RadioGroup legend="2) Material" name="gutterMaterial" options={GUTTER_MATERIALS} value={x.gutterMaterial} onChange={(v) => setX("gutterMaterial", v)} />
            {x.gutterMaterial === "OTHER" && T("gutterMaterialOther", "Others – specify")}
            <RadioGroup legend="3) Downtake pipes – material (please tick)" name="downpipeMaterial" options={DOWNPIPE_MATERIALS} value={x.downpipeMaterial} onChange={(v) => setX("downpipeMaterial", v)} />
            {x.downpipeMaterial === "OTHER" && T("downpipeMaterialOther", "Others – specify")}

            <hr />
            <h3>8. Canopy</h3>
            <PhotoChoice name="canopy" image={["slab", "slap"]} title="Canopy (please tick)" value={x.canopy} onChange={(v) => setX("canopy", v)}>
              <div className="row">
                {T("canopySize", "Size (o/o)")}
                {T("canopyHeightFfl", "Height from FFL")}
              </div>
            </PhotoChoice>

            <hr />
            <h3>9. Sheet Metal Louver</h3>
            <PhotoChoice name="louver" image="window" title="Sheet metal louver (please tick)" value={x.louver} onChange={(v) => setX("louver", v)}>
              {T("louverSize", "Size (o/o)")}
            </PhotoChoice>

            <hr />
            <h3>10. Road Facilities</h3>
            <RadioGroup legend="Whether suitable for Trailer / Truck moving" name="truckAccess" options={YES_NO_OPTIONS} value={x.truckAccess} onChange={(v) => setX("truckAccess", v)} />
            {TA("stockingPlaces", "Goods stocking places available – details")}
            {TA("openingsDetails", "Provision of rolling shutter / sliding door / windows in building & side cladding structure (please specify the details)")}

            <hr />
            <h3>11. Project Period</h3>
            {T("projectPeriod", "Project period")}
            {TA("otherComments", "Any other detail, comments & queries")}

            <hr />
            <h3>12. Above details given by</h3>
            <div className="row">
              {T("givenByName", "Name")}
              {T("givenByDesignation", "Designation")}
            </div>
            {TA("givenByAddress", "Address")}
            <div className="field">
              <label htmlFor="signSeal">Sign & seal of company (image, optional)</label>
              <input id="signSeal" type="file" accept="image/*" onChange={handleSeal} />
              {x.signSeal && <img src={x.signSeal} alt="Sign and seal" style={{ maxHeight: 80, marginTop: 6 }} />}
            </div>

            <hr />
            {/* <h3>6. Scope of work</h3>
            <RadioGroup legend="You require us to quote for" name="scopeOfWork" options={SCOPE_OF_WORK_OPTIONS} value={form.scopeOfWork} onChange={(v) => set("scopeOfWork", v)} required />
            {(form.scopeOfWork === "SUPPLY_AT_SITE" || form.scopeOfWork === "OTHER") && (
              <div className="field">
                <label htmlFor="scopeOfWorkLocation">{form.scopeOfWork === "OTHER" ? "Please specify" : "Site location"}</label>
                <input id="scopeOfWorkLocation" name="scopeOfWorkLocation" value={form.scopeOfWorkLocation} onChange={handleChange} />
              </div>
            )}

            <hr />
            <h3>7. Anything else</h3>
            <div className="field">
              <label htmlFor="requirement">Requirement / purpose of building *</label>
              <textarea id="requirement" name="requirement" required placeholder="Describe what you need" value={form.requirement} onChange={handleChange} />
            </div> */}
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
            {/* <div className="field">
              <label htmlFor="specifications">Other specifications</label>
              <textarea id="specifications" name="specifications" placeholder="Insulation, gutters, canopy, road access, etc." value={form.specifications} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="additionalRequirements">Additional requirements</label>
              <textarea id="additionalRequirements" name="additionalRequirements" value={form.additionalRequirements} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="remarks">Remarks</label>
              <textarea id="remarks" name="remarks" value={form.remarks} onChange={handleChange} />
            </div> */}

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
