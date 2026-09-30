import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEnquiryPrefill, submitEnquiry } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import RadioGroup from "../components/RadioGroup.jsx";
import ImageRadioGroup from "../components/ImageRadioGroup.jsx";
import ImageCheckboxGroup from "../components/ImageCheckboxGroup.jsx";
import CheckboxGroup from "../components/CheckboxGroup.jsx";
import PolicyFooter from "../components/PolicyFooter.jsx";
import {
  BUILDING_TYPES, CLADDING_MATERIALS, COLUMN_TYPES, END_FRAME_TYPES, SCOPE_OF_WORK_OPTIONS,
  MEASUREMENT_BASIS_OPTIONS, ROOFING_CLADDING_REQUIREMENTS, MAIN_SHED_ROOF_MATERIALS,
  SURFACE_PREPARATION_OPTIONS, PROTECTIVE_COATING_OPTIONS, YES_NO_OPTIONS,
  ROOF_STYLE_OPTIONS, GUTTER_TYPE_OPTIONS, GUTTER_MATERIAL_OPTIONS, DOWNTAKE_PIPE_MATERIAL_OPTIONS,
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
  roofVentilatorDiameterThroat: "", roofVentilatorAirChangePerHr: "", roofVentilatorQuantity: "",
  ridgeVentRequired: "", ridgeVentSize: "", ridgeVentQuantity: "",
  craneRequired: "", craneType: "", craneCapacityTonnes: "", craneSize: "", craneHeightM: "",
  roofStyle: "",
  // Water down system
  gutterTypes: [], gutterMaterial: "", gutterMaterialOther: "",
  downtakePipesRequired: false, downtakePipeMaterial: "", downtakePipeMaterialOther: "",
  // Canopy / louver
  canopyRequired: "", canopySizeOo: "", canopyHeightFfl: "",
  sheetMetalLouverRequired: "", sheetMetalLouverSizeOo: "",
  // Road facilities
  roadTrailerAccess: "", roadGoodsStockingDetail: "", roadShutterProvisionDetail: "",
  // Scope
  scopeOfWork: "", scopeOfWorkLocation: "",
  // General (kept from the original enquiry form, for anything not covered above)
  requirement: "", location: "", requiredDate: "", projectPeriod: "",
  specifications: "", additionalRequirements: "", remarks: "",
  // Declaration
  declarantName: "", declarantDesignation: "", declarantAddress: "", declarantSignSeal: "",
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
        intermediateBaySpacingM: form.intermediateBaySpacingM ? Number(form.intermediateBaySpacingM) : null,
        endBaySpacingM: form.endBaySpacingM ? Number(form.endBaySpacingM) : null,
        brickWallHeightM: form.brickWallHeightM ? Number(form.brickWallHeightM) : null,
        surfacePreparation: form.surfacePreparation.join(","),
        gutterTypes: form.gutterTypes.join(","),
        craneRequired: form.craneRequired === "" ? null : form.craneRequired === "yes",
        skylightRequired: form.skylightRequired === "" ? null : form.skylightRequired === "yes",
        roofVentilatorRequired: form.roofVentilatorRequired === "" ? null : form.roofVentilatorRequired === "yes",
        ridgeVentRequired: form.ridgeVentRequired === "" ? null : form.ridgeVentRequired === "yes",
        canopyRequired: form.canopyRequired === "" ? null : form.canopyRequired === "yes",
        sheetMetalLouverRequired: form.sheetMetalLouverRequired === "" ? null : form.sheetMetalLouverRequired === "yes",
        roadTrailerAccess: form.roadTrailerAccess === "" ? null : form.roadTrailerAccess === "yes",
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
            <img
              src="/diagrams/bay-spacing.png"
              alt="Diagram showing end bay spacing and bay spacing along the building length"
              style={{ width: "100%", maxWidth: 520, display: "block", margin: "0 auto 16px" }}
            />
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
            <ImageRadioGroup legend="Roof Style" name="roofStyle" options={ROOF_STYLE_OPTIONS} value={form.roofStyle} onChange={(v) => set("roofStyle", v)} />
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

            <h4>Ventilator System</h4>
            <img
              src="/diagrams/roof-ventilator.png"
              alt="Roof turbine ventilator"
              style={{ width: 140, display: "block", margin: "0 0 8px" }}
            />
            <RadioGroup legend="a) Roof Ventilator" name="roofVentilatorRequired" options={YES_NO_OPTIONS} value={form.roofVentilatorRequired} onChange={(v) => set("roofVentilatorRequired", v)} required />
            {form.roofVentilatorRequired === "yes" && (
              <div className="row">
                <div className="field">
                  <label htmlFor="roofVentilatorDiameterThroat">Diameter of Throat</label>
                  <input id="roofVentilatorDiameterThroat" name="roofVentilatorDiameterThroat" value={form.roofVentilatorDiameterThroat} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="roofVentilatorAirChangePerHr">Air Change / Hr</label>
                  <input id="roofVentilatorAirChangePerHr" name="roofVentilatorAirChangePerHr" value={form.roofVentilatorAirChangePerHr} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="roofVentilatorQuantity">Quantity (nos.)</label>
                  <input id="roofVentilatorQuantity" name="roofVentilatorQuantity" value={form.roofVentilatorQuantity} onChange={handleChange} />
                </div>
              </div>
            )}

            <img
              src="/diagrams/ridge-vent.png"
              alt="Ridge vent cross-section"
              style={{ width: 220, display: "block", margin: "12px 0 8px" }}
            />
            <RadioGroup legend="b) Ridge Vent" name="ridgeVentRequired" options={YES_NO_OPTIONS} value={form.ridgeVentRequired} onChange={(v) => set("ridgeVentRequired", v)} required />
            {form.ridgeVentRequired === "yes" && (
              <div className="row">
                <div className="field">
                  <label htmlFor="ridgeVentSize">Size</label>
                  <input id="ridgeVentSize" name="ridgeVentSize" value={form.ridgeVentSize} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="ridgeVentQuantity">Quantity (nos.)</label>
                  <input id="ridgeVentQuantity" name="ridgeVentQuantity" value={form.ridgeVentQuantity} onChange={handleChange} />
                </div>
              </div>
            )}

            <img
              src="/diagrams/crane.png"
              alt="Crane bridge and beam diagram"
              style={{ width: "100%", maxWidth: 420, display: "block", margin: "12px 0 8px" }}
            />
            <RadioGroup
              legend="Crane and Hoist"
              name="craneRequired"
              options={[{ value: "yes", label: "Applicable" }, { value: "no", label: "Not Applicable" }]}
              value={form.craneRequired}
              onChange={(v) => set("craneRequired", v)}
              required
            />
            {craneYes && (
              <div className="row">
                <div className="field">
                  <label htmlFor="craneCapacityTonnes">Capacity (tonnes)</label>
                  <input id="craneCapacityTonnes" name="craneCapacityTonnes" value={form.craneCapacityTonnes} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="craneSize">Size</label>
                  <input id="craneSize" name="craneSize" value={form.craneSize} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="craneType">Crane type</label>
                  <input id="craneType" name="craneType" value={form.craneType} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="craneHeightM">Height, floor to hook (metres)</label>
                  <input id="craneHeightM" name="craneHeightM" value={form.craneHeightM} onChange={handleChange} />
                </div>
              </div>
            )}

            <hr />
            <h3>6. Water Down System</h3>
            <ImageCheckboxGroup legend="1) Gutter Type" options={GUTTER_TYPE_OPTIONS} values={form.gutterTypes} onChange={(v) => set("gutterTypes", v)} />
            <RadioGroup legend="2) Gutter Material" name="gutterMaterial" options={GUTTER_MATERIAL_OPTIONS} value={form.gutterMaterial} onChange={(v) => set("gutterMaterial", v)} />
            {form.gutterMaterial === "OTHER" && (
              <div className="field">
                <label htmlFor="gutterMaterialOther">Please specify</label>
                <input id="gutterMaterialOther" name="gutterMaterialOther" value={form.gutterMaterialOther} onChange={handleChange} />
              </div>
            )}
            <div className="field">
              <label className="checkbox-option" style={{ fontWeight: 600 }}>
                <input type="checkbox" checked={form.downtakePipesRequired} onChange={(e) => set("downtakePipesRequired", e.target.checked)} />
                <span>Downtake Pipes required (please tick)</span>
              </label>
            </div>
            {form.downtakePipesRequired && (
              <>
                <RadioGroup legend="Downtake Pipe Material" name="downtakePipeMaterial" options={DOWNTAKE_PIPE_MATERIAL_OPTIONS} value={form.downtakePipeMaterial} onChange={(v) => set("downtakePipeMaterial", v)} />
                {form.downtakePipeMaterial === "OTHER" && (
                  <div className="field">
                    <label htmlFor="downtakePipeMaterialOther">Please specify</label>
                    <input id="downtakePipeMaterialOther" name="downtakePipeMaterialOther" value={form.downtakePipeMaterialOther} onChange={handleChange} />
                  </div>
                )}
              </>
            )}

            <hr />
            <h3>7. Canopy</h3>
            <img src="/diagrams/canopy.png" alt="Canopy diagram" style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 0 8px" }} />
            <RadioGroup legend="Canopy required (please tick)" name="canopyRequired" options={YES_NO_OPTIONS} value={form.canopyRequired} onChange={(v) => set("canopyRequired", v)} required />
            {form.canopyRequired === "yes" && (
              <div className="row">
                <div className="field">
                  <label htmlFor="canopySizeOo">Size (o/o)</label>
                  <input id="canopySizeOo" name="canopySizeOo" value={form.canopySizeOo} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="canopyHeightFfl">Height from FFL</label>
                  <input id="canopyHeightFfl" name="canopyHeightFfl" value={form.canopyHeightFfl} onChange={handleChange} />
                </div>
              </div>
            )}

            <hr />
            <h3>8. Sheet Metal Louver</h3>
            <img src="/diagrams/sheet-metal-louver.png" alt="Sheet metal louver" style={{ width: 140, display: "block", margin: "0 0 8px" }} />
            <RadioGroup legend="Sheet metal louver required (please tick)" name="sheetMetalLouverRequired" options={YES_NO_OPTIONS} value={form.sheetMetalLouverRequired} onChange={(v) => set("sheetMetalLouverRequired", v)} required />
            {form.sheetMetalLouverRequired === "yes" && (
              <div className="field">
                <label htmlFor="sheetMetalLouverSizeOo">Size (o/o)</label>
                <input id="sheetMetalLouverSizeOo" name="sheetMetalLouverSizeOo" value={form.sheetMetalLouverSizeOo} onChange={handleChange} />
              </div>
            )}

            <hr />
            <h3>9. Road Facilities</h3>
            <RadioGroup legend="Whether suitable for Trailer / Truck moving" name="roadTrailerAccess" options={YES_NO_OPTIONS} value={form.roadTrailerAccess} onChange={(v) => set("roadTrailerAccess", v)} />
            <div className="field">
              <label htmlFor="roadGoodsStockingDetail">Goods Stocking places available detail</label>
              <textarea id="roadGoodsStockingDetail" name="roadGoodsStockingDetail" value={form.roadGoodsStockingDetail} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="roadShutterProvisionDetail">Provision of rolling shutter / Sliding door / windows in Building &amp; side cladding structure (please specify the details)</label>
              <textarea id="roadShutterProvisionDetail" name="roadShutterProvisionDetail" value={form.roadShutterProvisionDetail} onChange={handleChange} />
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
            <div className="field">
              <label htmlFor="projectPeriod">Project period</label>
              <input id="projectPeriod" name="projectPeriod" value={form.projectPeriod} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="remarks">Any other detail, comments &amp; queries</label>
              <textarea id="remarks" name="remarks" value={form.remarks} onChange={handleChange} />
            </div>
            {/* <div className="field">
              <label htmlFor="specifications">Other specifications</label>
              <textarea id="specifications" name="specifications" placeholder="Insulation, gutters, canopy, road access, etc." value={form.specifications} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="additionalRequirements">Additional requirements</label>
              <textarea id="additionalRequirements" name="additionalRequirements" value={form.additionalRequirements} onChange={handleChange} />
            </div> */}

            <hr />
            <h3>Above detail given by</h3>
            <div className="row">
              <div className="field">
                <label htmlFor="declarantName">Name</label>
                <input id="declarantName" name="declarantName" value={form.declarantName} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="declarantDesignation">Designation</label>
                <input id="declarantDesignation" name="declarantDesignation" value={form.declarantDesignation} onChange={handleChange} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="declarantAddress">Address</label>
              <textarea id="declarantAddress" name="declarantAddress" value={form.declarantAddress} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="declarantSignSeal">Sign &amp; seal of company</label>
              <input id="declarantSignSeal" name="declarantSignSeal" placeholder="Type your name to sign digitally" value={form.declarantSignSeal} onChange={handleChange} />
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
