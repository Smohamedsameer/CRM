import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEnquiryPrefill, submitEnquiry } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import RadioGroup from "../components/RadioGroup.jsx";
import OptionCards from "../components/OptionCards.jsx";
import PhotoChoice from "../components/PhotoChoice.jsx";
import PolicyFooter from "../components/PolicyFooter.jsx";
import {
  GF_BUILDING_TYPES, GF_COLUMN_TYPES, GF_END_FRAME_TYPES, GF_ROOFING_REQUIREMENTS, GF_SHEET_MATERIALS,
  GF_SURFACE_PREPARATION, GF_PROTECTIVE_COATING, GF_ROOF_VENTILATORS, GF_GUTTERS, GF_GUTTER_MATERIALS,
  GF_DOWNPIPE_MATERIALS,
} from "../utils/constants.js";

/** Everything the customer answers (the Google Form "Senela International Ventures - PEB Enquiry Form"). */
const EMPTY = {
  projectLocation: "",
  // 1. Building type
  buildingType: "", buildingTypeOther: "", columnType: "", columnTypeOther: "", endFrameType: "", endFrameTypeOther: "",
  // Building dimensions (free text: "mention mtr / ft")
  spanWidth: "", eaveHeight: "", clearEaveHeight: "", length: "",
  intermediateSpacing: "", gableBaySpacing: "", brickWallHeight: "", roofSlope: "",
  // 3. Roofing and cladding
  roofingReq: "", roofingReqOther: "", roofMaterial: "", roofMaterialOther: "", claddingMaterial: "", claddingMaterialOther: "",
  thickness: "", colour: "", surfacePrep: [], surfacePrepOther: "", coating: "", coatingOther: "",
  // 5. Crane
  craneRequired: "", craneRequiredOther: "", craneType: "", craneCapacity: "", craneHeight: "",
  // Roof ventilator / gutter (choose any)
  roofVent: [], roofVentOther: "", gutter: [], gutterOther: "", gutterMaterial: "", gutterMaterialOther: "", downpipeMaterial: "", downpipeMaterialOther: "",
  // Canopy / louver
  canopy: "", canopyOther: "", canopySize: "", canopyHeightFfl: "", louver: "", louverOther: "", louverSize: "",
  // 10. Project starting
  startDate: "",
};

/** "12 mtr" / "40 ft" / "12.5" -> metres (or null). Only used for the legacy numeric columns; the exact text is kept too. */
function toMetres(text) {
  const m = String(text || "").match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return /ft|feet|foot|'/i.test(text) ? Math.round(n * 0.3048 * 100) / 100 : n;
}
const has = (list, v) => list.includes(v);

/** length fields must look like "20 mtr" or "20 ft" (number + unit) */
const DIM_RE = /^\s*\d+(?:\.\d+)?\s*(?:mtrs?|meters?|metres?|m|ft|feet|foot)\s*$/i;
const DIM_EXAMPLE = "20 mtr / 20 ft";
const dimInvalid = (v) => String(v || "").trim() !== "" && !DIM_RE.test(v);
const DIM_FIELDS = [
  ["spanWidth", "Span / building Width"], ["length", "Length"], ["eaveHeight", "Eave Height"],
  ["clearEaveHeight", "Clear Eave Height"], ["intermediateSpacing", "Intermediate Column Spacing"],
  ["gableBaySpacing", "Gable End Bay Column Spacing"], ["brickWallHeight", "Brick Wall Height"],
  ["craneHeight", "Crane Lifting Height"], ["canopyHeightFfl", "Canopy Height from FFL"],
];

export default function Enquiry() {
  const { token } = useParams();
  const [customer, setCustomer] = useState(null);
  const [f, setF] = useState(EMPTY);
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

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const T = (k, label, props = {}) => {
    const { dim, ...inp } = props;
    const bad = dim && dimInvalid(f[k]);
    return (
      <div className="field" key={k}>
        <label htmlFor={k}>{label}{props.required ? " *" : ""}</label>
        <input id={k} value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={dim ? "e.g. " + DIM_EXAMPLE : undefined}
          aria-invalid={bad || undefined} style={bad ? { borderColor: "#c0392b" } : undefined} {...inp} />
        {bad && <p className="field-error">Please enter a value with its unit, for example: {DIM_EXAMPLE}</p>}
      </div>
    );
  };
  const Other = (k, parent) => f[parent] === "OTHER" && T(k, "Other – please specify", { required: true });
  const one = (k) => (v) => set(k, v ? [v] : []); // single-choice question stored as a one-item list (keeps the saved format)
  const roofVentOn = f.roofVent.length > 0 && !has(f.roofVent, "NOT_REQUIRED");
  const gutterOn = f.gutter.length > 0 && !has(f.gutter, "NOT_REQUIRED");

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const badDim = DIM_FIELDS.find(([k]) => dimInvalid(f[k]));
    if (badDim) {
      document.getElementById(badDim[0])?.focus();
      return setSubmitError(`${badDim[1]}: please enter a number with its unit, for example ${DIM_EXAMPLE}.`);
    }
    if (!f.surfacePrep.length) return setSubmitError("Please choose a Surface Preparation option.");
    if (!f.roofVent.length) return setSubmitError("Please choose a Roof Ventilator option (or Not Required).");
    if (!f.gutter.length) return setSubmitError("Please choose a Gutter option (or Not Required).");
    setSubmitError("");
    setSubmitting(true);
    // everything the customer typed/picked, exactly as entered, plus the key names the older screens read
    const extra = {
      v: 2, ...f,
      roofVentilatorChoices: f.roofVent, gutterChoices: f.gutter,
      roofVent: has(f.roofVent, "TURBINE_VENTILATOR") ? "yes" : (f.roofVent.length ? "no" : ""),
      ridgeVent: has(f.roofVent, "RIDGE_VENT") ? "yes" : (f.roofVent.length ? "no" : ""),
      eaveGutter: has(f.gutter, "EAVE_GUTTER") ? "yes" : (f.gutter.length ? "no" : ""),
      valleyGutter: has(f.gutter, "VALLEY_GUTTER") ? "yes" : (f.gutter.length ? "no" : ""),
      gutterMaterial: f.gutterMaterial, gutterMaterialOther: f.gutterMaterialOther,
      downpipeMaterial: f.downpipeMaterial, downpipeMaterialOther: f.downpipeMaterialOther,
      canopy: f.canopy, louver: f.louver, projectPeriod: f.startDate,
    };
    try {
      await submitEnquiry({
        token,
        requirement: "PEB building enquiry",
        location: f.projectLocation,
        requiredDate: f.startDate ? `${f.startDate}T00:00:00` : null,
        buildingType: f.buildingType, buildingTypeOther: f.buildingTypeOther,
        endFrameType: f.endFrameType, columnType: f.columnType,
        spanWidthM: toMetres(f.spanWidth), lengthM: toMetres(f.length),
        clearEaveHeightM: toMetres(f.clearEaveHeight), eaveHeightM: toMetres(f.eaveHeight),
        intermediateBaySpacingM: toMetres(f.intermediateSpacing), endBaySpacingM: toMetres(f.gableBaySpacing),
        brickWallHeightM: toMetres(f.brickWallHeight), roofSlope: f.roofSlope,
        roofingCladdingRequirement: f.roofingReq,
        mainShedRoofMaterial: f.roofMaterial, mainShedRoofMaterialOther: f.roofMaterialOther,
        roofCladdingMaterial: f.roofMaterial, sideCladdingMaterial: f.claddingMaterial,
        roofCladdingThickness: f.thickness, sideCladdingThickness: f.thickness,
        roofCladdingColour: f.colour, sideCladdingColour: f.colour,
        surfacePreparation: f.surfacePrep.join(","),
        protectiveCoating: f.coating, protectiveCoatingOther: f.coatingOther,
        craneRequired: f.craneRequired === "" ? null : f.craneRequired === "yes",
        craneType: f.craneType, craneCapacityTonnes: f.craneCapacity, craneHeightM: f.craneHeight,
        roofVentilatorRequired: roofVentOn,
        extraDetails: JSON.stringify(extra),
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  }

  const craneYes = f.craneRequired === "yes";
  const ro = (value) => <input disabled value={value ?? ""} />;

  return (
    <div className="container enquiry-page light-theme">
      <div className="card">
        <h2>Senela International Ventures - PEB Enquiry Form</h2>
        <p className="muted">Please provide the building details below so we can prepare an accurate PEB quotation.</p>

        <Alert>{loadError}</Alert>
        <Alert type="success">{done ? "Thank you! Your enquiry has been received. We will contact you shortly." : ""}</Alert>

        {!loadError && !done && (
          <form onSubmit={handleSubmit}>
            <h3>Personal Information</h3>
            <div className="gf-prefill">
              <div className="row">
                <div className="field"><label>Person Name</label>{ro(customer?.customerName)}</div>
                <div className="field"><label>Company Name</label>{ro(customer?.companyName)}</div>
              </div>
              <div className="row">
                <div className="field"><label>Phone number</label>{ro(customer?.phone)}</div>
                <div className="field"><label>Email ID</label>{ro(customer?.email)}</div>
              </div>
              <div className="field"><label>Company Address</label><textarea disabled value={customer?.address ?? ""} style={{ minHeight: 60 }} /></div>
            </div>
            {T("projectLocation", "Project Location", { required: true })}

            <hr />
            <h3>1. Building Type</h3>
            <OptionCards legend="Type of Building" name="buildingType" options={GF_BUILDING_TYPES} value={f.buildingType}
              onChange={(v) => set("buildingType", v)} otherValue={f.buildingTypeOther} onOther={(v) => set("buildingTypeOther", v)} required />
            <RadioGroup legend="Column Type" name="columnType" options={GF_COLUMN_TYPES} value={f.columnType} onChange={(v) => set("columnType", v)} required />
            {Other("columnTypeOther", "columnType")}
            <RadioGroup legend="End Frame Type" name="endFrameType" options={GF_END_FRAME_TYPES} value={f.endFrameType} onChange={(v) => set("endFrameType", v)} required />
            {Other("endFrameTypeOther", "endFrameType")}

            <hr />
            <h3>Building Dimensions</h3>
            <img className="gf-ref" src="/diagrams/building-dimensions.png" alt="Span / building width, eave height, clear eave height and building height" />
            <div className="row">
              {T("spanWidth", "Span / building Width ( mention mtr / ft )", { dim: true, required: true })}
              {T("length", "Length ( mention mtr / ft )", { dim: true, required: true })}
            </div>
            <div className="row">
              {T("eaveHeight", "Eave Height ( mention mtr / ft )", { dim: true, required: true })}
              {T("clearEaveHeight", "Clear Eave Height ( mention mtr / ft )", { dim: true, required: false })}
            </div>

            <hr />
            <h3>Intermediate Column Spacing Lengthwise</h3>
            <img className="gf-ref" src="/diagrams/bay-width.png" alt="Intermediate column / bay spacing diagram" />
            <div className="row">
              {T("intermediateSpacing", "Intermediate Column Spacing ( mention mtr / ft )", { dim: true, required: false })}
              {T("gableBaySpacing", "Gable End Bay Column Spacing ( mention mtr / ft )", { dim: true, required: false })}
            </div>
            <div className="row">
              {T("brickWallHeight", "Brick Wall Height ( mention mtr / ft ,if not required mention 0)", { dim: true, required: true })}
              {T("roofSlope", "Roof Slope", { required: false, placeholder: "e.g. 1 in 10" })}
            </div>

            <hr />
            <h3>3. Roofing and Cladding Covering Area</h3>
            <OptionCards legend="Roofing / Cladding Requirement" name="roofingReq" options={GF_ROOFING_REQUIREMENTS} value={f.roofingReq}
              onChange={(v) => set("roofingReq", v)} otherValue={f.roofingReqOther} onOther={(v) => set("roofingReqOther", v)} required />
            <RadioGroup legend="Building Roof Material" name="roofMaterial" options={GF_SHEET_MATERIALS} value={f.roofMaterial} onChange={(v) => set("roofMaterial", v)} required />
            {Other("roofMaterialOther", "roofMaterial")}
            <RadioGroup legend="Building Cladding Material" name="claddingMaterial" options={GF_SHEET_MATERIALS} value={f.claddingMaterial} onChange={(v) => set("claddingMaterial", v)} required />
            {Other("claddingMaterialOther", "claddingMaterial")}
            <div className="row">
              {T("thickness", "Roof / Cladding Sheet Thickness (Mention mm)", { required: false })}
              {T("colour", "Roof / Cladding Sheet Colour (RAL Code)", { required: false })}
            </div>
            <RadioGroup legend="Surface Preparation" name="surfacePrep" options={GF_SURFACE_PREPARATION} value={f.surfacePrep[0] || ""} onChange={one("surfacePrep")}  />
            {has(f.surfacePrep, "OTHER") && T("surfacePrepOther", "Other – please specify", { required: true })}
            <RadioGroup legend="Protective Coating (Primer / Finishing Paint)" name="coating" options={GF_PROTECTIVE_COATING} value={f.coating} onChange={(v) => set("coating", v)}  />
            {Other("coatingOther", "coating")}

            <hr />
            <h3>5. Crane Requirements</h3>
            <PhotoChoice name="craneRequired" image="crane" title="Crane Required?" required withOther value={f.craneRequired} onChange={(v) => set("craneRequired", v)}>
              {f.craneRequired === "other" ? T("craneRequiredOther", "Please specify", { required: true }) : (
                <>
                  <div className="row">{T("craneType", "Crane Type", { required: craneYes })}{T("craneCapacity", "Crane Capacity (Tonnes)", { required: craneYes })}</div>
                  <div className="row">{T("craneHeight", "Crane Lifting Height ( mention mtr / ft )", { dim: true, required: craneYes })}</div>
                </>
              )}
            </PhotoChoice>

            <OptionCards legend="Roof Ventilator Required?" name="roofVent" options={GF_ROOF_VENTILATORS}
              value={f.roofVent[0] || ""} onChange={one("roofVent")} required />

            <OptionCards legend="Gutter Required?" name="gutter" options={GF_GUTTERS}
              value={f.gutter[0] || ""} onChange={one("gutter")} required />
            {gutterOn && (
              <>
                <RadioGroup legend="Gutter Material" name="gutterMaterial" options={GF_GUTTER_MATERIALS} value={f.gutterMaterial} onChange={(v) => set("gutterMaterial", v)}  />
                {Other("gutterMaterialOther", "gutterMaterial")}
                <RadioGroup legend="Downpipe Material" name="downpipeMaterial" options={GF_DOWNPIPE_MATERIALS} value={f.downpipeMaterial} onChange={(v) => set("downpipeMaterial", v)}  />
                {Other("downpipeMaterialOther", "downpipeMaterial")}
              </>
            )}

            <div className="photo-choice-grid">
              <PhotoChoice name="canopy" image={["slab", "slap"]} title="Canopy Required?" required withOther value={f.canopy} onChange={(v) => set("canopy", v)}>
                {f.canopy === "other" ? T("canopyOther", "Please specify", { required: true }) : (
                  <div className="row">
                    {T("canopySize", "Canopy Size ( width * length )", { required: false })}
                    {T("canopyHeightFfl", "Canopy Height from FFL ( mtr / ft )", { dim: true, required: false })}
                  </div>
                )}
              </PhotoChoice>
              <PhotoChoice name="louver" image="window" title="Louver Required? (Sheet Metal Louver)" required withOther value={f.louver} onChange={(v) => set("louver", v)}>
                {f.louver === "other" ? T("louverOther", "Please specify", { required: true }) : T("louverSize", "Louver Size ( width * length )", { required: true })}
              </PhotoChoice>
            </div>

            <hr />
            <h3>10. Project Starting Duration Status</h3>
            <div className="field" style={{ maxWidth: 280 }}>
              <label htmlFor="startDate">Project Starting Proposal Date *</label>
              <input id="startDate" type="date" required value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
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
