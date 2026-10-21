import { Fragment, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  clearWhatsAppHistory, confirmOrder, getLeadDetail, getQuotationFormData, resendWelcome, retryMessage, sendQuotation, uploadQuotationPdf, viewQuotationPdf,
} from "../api/index.js";
import Alert from "../components/Alert.jsx";
import QuoteBuilder from "../components/QuoteBuilder.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import logoUrl from "../quotation/assets/logo.png";
import { TIMELINE_LABELS, TIMELINE_ORDER } from "../utils/constants.js";
import { formatDateTime, labelize, money } from "../utils/format.js";
import { gfLabel } from "../utils/constants.js";

const EXTRA_STATUSES = ["CALLED_TO_ORDER", "CHANGES_REQUESTED", "REJECTED", "CLOSED"];
/** Statuses where the quotation was already sent once, so the button says "Re-send". */
const RESENDABLE = ["SENT", "VIEWED", "CHANGES_REQUESTED"];
const MAX_PDF_MB = 15;

/** Most recent "request changes" note the customer left on this quotation, if any. */
function latestChangeRequest(quotation) {
  const responses = (quotation.customerResponses || []).filter((r) => r.responseType === "CHANGES_REQUESTED");
  if (!responses.length) return null;
  return responses.reduce((latest, r) => (new Date(r.createdAt) > new Date(latest.createdAt) ? r : latest));
}

function Timeline({ status }) {
  const idx = TIMELINE_ORDER.indexOf(status);
  return (
    <ul className="timeline">
      {TIMELINE_ORDER.map((s, i) => (
        <li key={s} className={idx >= 0 && i <= idx ? "done" : ""}>{TIMELINE_LABELS[s]}</li>
      ))}
      {EXTRA_STATUSES.includes(status) && <li className="done">Current status: {labelize(status)}</li>}
    </ul>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null); // { type: "success" | "error", text }
  const [busy, setBusy] = useState("");
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [expandedQuotationId, setExpandedQuotationId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLead(await getLeadDetail(id));
      setLoadError("");
    } catch {
      setLoadError("Could not load this lead.");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function run(key, action, okText) {
    setBusy(key);
    setNotice(null);
    try {
      await action();
      setNotice({ type: "success", text: okText });
      await load();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy("");
    }
  }

  /** The employee fixed the alignment in Word, saved it as PDF and picked it here: it replaces the quotation's PDF. */
  function handlePdfPicked(q, event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (/\.docx?$/i.test(file.name)) {
      setNotice({ type: "error", text: "Please save the Word file as PDF first (File → Save As → PDF), then upload the PDF." });
      return;
    }
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      setNotice({ type: "error", text: "Please choose a PDF file." });
      return;
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      setNotice({ type: "error", text: `The PDF is larger than ${MAX_PDF_MB} MB. Reduce its size and try again.` });
      return;
    }
    run(`upload-${q.id}`, () => uploadQuotationPdf(q.id, file),
      `PDF for ${q.quotationNumber} replaced. Click “View” to check it, then “Send via WhatsApp”.`);
  }

  /** Builds the editable Word version from the details saved when the quotation was generated. */
  function handleDownloadWord(q) {
    run(`word-${q.id}`, async () => {
      const data = await getQuotationFormData(q.id);
      if (!data) {
        throw new Error("The details of this quotation were not saved (it was generated before this option existed). Generate the quotation again to get a Word file.");
      }
      const { buildPebDocx, downloadBlob } = await import("../quotation/buildPebDocx.js");
      downloadBlob(await buildPebDocx(data, logoUrl), `${q.quotationNumber.replace(/\//g, "-")}.docx`);
    }, "Word file downloaded. Fix the alignment, save it as PDF, then click “Upload PDF”.");
  }

  function handleSend(q) {
    const again = RESENDABLE.includes(q.status);
    if (again && !window.confirm(`Send ${q.quotationNumber} to the customer on WhatsApp again?`)) return;
    run(`send-${q.id}`, () => sendQuotation(q.id), again ? "Quotation sent again via WhatsApp." : "Quotation sent via WhatsApp.");
  }

  if (loadError) {
    return <div className="container wide"><Alert>{loadError}</Alert></div>;
  }
  if (!lead) {
    return <div className="container wide"><p className="muted">Loading lead…</p></div>;
  }

  const e = lead.enquiry;
  const baseRows = e
    ? [
        ["Building type", e.buildingType === "OTHER" ? e.buildingTypeOther : labelize(e.buildingType)],
        ["No. of sheds", e.noOfSheds],
        ["End frame", labelize(e.endFrameType)],
        ["Column", labelize(e.columnType)],
        ["Span / Width", e.spanWidthM ? `${e.spanWidthM} m` : null],
        ["Length", e.lengthM ? `${e.lengthM} m` : null],
        ["Clear eave height", e.clearEaveHeightM ? `${e.clearEaveHeightM} m` : null],
        ["Eave height", e.eaveHeightM ? `${e.eaveHeightM} m` : null],
        ["Roof cladding", [labelize(e.roofCladdingMaterial), e.roofCladdingThickness, e.roofCladdingColour].filter(Boolean).join(", ")],
        ["Side cladding", [labelize(e.sideCladdingMaterial), e.sideCladdingThickness, e.sideCladdingColour].filter(Boolean).join(", ")],
        ["Crane / hoist", e.craneRequired ? [e.craneType, e.craneCapacityTonnes && `${e.craneCapacityTonnes} T`, e.craneHeightM && `${e.craneHeightM} m`].filter(Boolean).join(", ") || "Yes" : "Not applicable"],
        ["Scope of work", [labelize(e.scopeOfWork), e.scopeOfWorkLocation].filter(Boolean).join(" — ")],
        ["Requirement", e.requirement],
        ["Location", e.location],
        ["Specifications", e.specifications],
        ["Additional requirements", e.additionalRequirements],
        ["Remarks", e.remarks],
      ].filter(([, value]) => value)
    : [];

  let extra = {};
  try { extra = e?.extraDetails ? JSON.parse(e.extraDetails) : {}; } catch { extra = {}; }
  const yn = (v, parts = []) => (v === "yes" ? (parts.filter(Boolean).join(", ") || "Yes") : v === "no" ? "No" : null);
  const extraRows = [
    ["Crane size", extra.craneSize],
    ["Roof ventilator", yn(extra.roofVent, [extra.roofVentThroat && `throat ${extra.roofVentThroat}`, extra.roofVentAch && `${extra.roofVentAch} air change/hr`, extra.roofVentQty && `${extra.roofVentQty} nos`])],
    ["Ridge vent", yn(extra.ridgeVent, [extra.ridgeVentSize && `size ${extra.ridgeVentSize}`, extra.ridgeVentQty && `${extra.ridgeVentQty} nos`])],
    ["Eave gutter", yn(extra.eaveGutter)],
    ["Valley gutter", yn(extra.valleyGutter)],
    ["Gutter material", extra.gutterMaterial === "OTHER" ? extra.gutterMaterialOther : labelize(extra.gutterMaterial)],
    ["Downtake pipes", extra.downpipeMaterial === "OTHER" ? extra.downpipeMaterialOther : extra.downpipeMaterial],
    ["Canopy", yn(extra.canopy, [extra.canopySize && `size ${extra.canopySize}`, extra.canopyHeightFfl && `height from FFL ${extra.canopyHeightFfl}`])],
    ["Sheet metal louver", yn(extra.louver, [extra.louverSize && `size ${extra.louverSize}`])],
    ["Trailer / truck access", yn(extra.truckAccess)],
    ["Goods stocking places", extra.stockingPlaces],
    ["Shutter / door / window details", extra.openingsDetails],
    ["Project period", extra.projectPeriod],
    ["Other comments & queries", extra.otherComments],
    ["Details given by", [extra.givenByName, extra.givenByDesignation, extra.givenByAddress].filter(Boolean).join(" — ")],
  ].filter(([, value]) => value);
  // rows for the Google-form style enquiry (answers kept exactly as the customer typed them)
  const pick = (v, other) => (v === "OTHER" ? other : gfLabel(v));
  const list = (arr, other) => (arr || []).map((v) => pick(v, other)).filter(Boolean).join(", ");
  const v2Rows = extra.v === 2 ? [
    ["Project location", extra.projectLocation],
    ["Type of building", pick(extra.buildingType, extra.buildingTypeOther)],
    ["Column type", pick(extra.columnType, extra.columnTypeOther)],
    ["End frame type", pick(extra.endFrameType, extra.endFrameTypeOther)],
    ["Span / building width", extra.spanWidth],
    ["Length", extra.length],
    ["Eave height", extra.eaveHeight],
    ["Clear eave height", extra.clearEaveHeight],
    ["Intermediate column spacing", extra.intermediateSpacing],
    ["Gable end bay column spacing", extra.gableBaySpacing],
    ["Brick wall height", extra.brickWallHeight],
    ["Roof slope", extra.roofSlope],
    ["Roofing / cladding requirement", pick(extra.roofingReq, extra.roofingReqOther)],
    ["Roof material", pick(extra.roofMaterial, extra.roofMaterialOther)],
    ["Cladding material", pick(extra.claddingMaterial, extra.claddingMaterialOther)],
    ["Sheet thickness (mm)", extra.thickness],
    ["Sheet colour (RAL)", extra.colour],
    ["Surface preparation", list(extra.surfacePrep, extra.surfacePrepOther)],
    ["Protective coating", pick(extra.coating, extra.coatingOther)],
    ["Crane required", extra.craneRequired === "yes" ? [extra.craneType, extra.craneCapacity && `${extra.craneCapacity} T`, extra.craneHeight && `lifting height ${extra.craneHeight}`].filter(Boolean).join(", ") || "Yes" : extra.craneRequired === "no" ? "No" : extra.craneRequiredOther],
    ["Roof ventilator", list(extra.roofVentilatorChoices, extra.roofVentOther)],
    ["Gutter", list(extra.gutterChoices, extra.gutterOther)],
    ["Gutter material", pick(extra.gutterMaterial, extra.gutterMaterialOther)],
    ["Downpipe material", pick(extra.downpipeMaterial, extra.downpipeMaterialOther)],
    ["Canopy", extra.canopy === "yes" ? [extra.canopySize && `size ${extra.canopySize}`, extra.canopyHeightFfl && `height from FFL ${extra.canopyHeightFfl}`].filter(Boolean).join(", ") || "Yes" : extra.canopy === "no" ? "No" : extra.canopyOther],
    ["Louver", extra.louver === "yes" ? (extra.louverSize ? `size ${extra.louverSize}` : "Yes") : extra.louver === "no" ? "No" : extra.louverOther],
    ["Project starting proposal date", extra.startDate],
  ].filter(([, value]) => value) : [];
  const enquiryRows = extra.v === 2 ? v2Rows : [...baseRows, ...extraRows];

  return (
    <div className="container wide">
      <Alert>{notice?.type === "error" ? notice.text : ""}</Alert>
      <Alert type="success">{notice?.type === "success" ? notice.text : ""}</Alert>

      <div className="card">
        <h2>{lead.leadCode}</h2>
        <table>
          <tbody>
            <tr><td>Customer</td><td>{lead.customerName}</td></tr>
            <tr><td>Company</td><td>{lead.companyName || "-"}</td></tr>
            <tr><td>Project name</td><td>{lead.projectName || "-"}</td></tr>
            <tr><td>Address</td><td style={{ whiteSpace: "pre-line" }}>{lead.address || "-"}</td></tr>
            <tr><td>Phone</td><td>{lead.phone}</td></tr>
            <tr><td>Email</td><td>{lead.email || "-"}</td></tr>
            <tr><td>Square feet</td><td>{lead.squareFeet || "-"}</td></tr>
            <tr><td>Source</td><td>{labelize(lead.source)}</td></tr>
            <tr><td>Status</td><td><StatusBadge status={lead.status} /></td></tr>
          </tbody>
        </table>

        <div className="row actions">
          <Link to={`/chat/${lead.id}`} className="btn btn-secondary" style={{ textDecoration: "none", textAlign: "center" }}>
            Open chat
          </Link>
          <button type="button" className="btn btn-secondary" disabled={!!busy}
            onClick={() => run("welcome", () => resendWelcome(lead.id), "Welcome message re-sent.")}>
            {busy === "welcome" ? "Sending…" : "Resend welcome message"}
          </button>
          <button type="button" className="btn btn-primary" disabled={!!busy}
            onClick={() => setShowQuoteBuilder((v) => !v)}>
            {showQuoteBuilder ? "Close quotation builder" : "Build quotation"}
          </button>
          {(lead.status === "ACCEPTED" || lead.status === "CALLED_TO_ORDER") && (
            <button type="button" className="btn btn-success" disabled={!!busy}
              onClick={() => run("order", () => confirmOrder(lead.id), "Order confirmed.")}>
              {busy === "order" ? "Confirming…" : "Confirm order"}
            </button>
          )}
        </div>
      </div>

      {showQuoteBuilder && (
        <div className="card">
          <h3>Build quotation</h3>
          <QuoteBuilder
            lead={lead}
            onCancel={() => setShowQuoteBuilder(false)}
            onGenerated={(_q, text, type = "success") => {
              setShowQuoteBuilder(false);
              setNotice({ type, text: text || "Quotation generated. Send it to the customer from the Quotations list below." });
              load();
            }}
          />
        </div>
      )}

      <div className="card">
        <h3>Timeline</h3>
        <Timeline status={lead.status} />
      </div>

      {lead.enquiry && (
        <div className="card">
          <h3>Enquiry details</h3>
          <table>
            <tbody>
              {enquiryRows.map(([label, value]) => (
                <tr key={label}><td>{label}</td><td>{value || "-"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lead.quotations?.length > 0 && (
        <div className="card">
          <h3>Quotations</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Number</th><th>Total</th><th>Status</th><th>Valid until</th><th></th></tr>
              </thead>
              <tbody>
                {lead.quotations.map((q) => {
                  const changeRequest = q.status === "CHANGES_REQUESTED" ? latestChangeRequest(q) : null;
                  const isExpanded = expandedQuotationId === q.id;
                  return (
                    <Fragment key={q.id}>
                      <tr>
                        <td>{q.quotationNumber}</td>
                        <td>{money(q.totalAmount)}</td>
                        <td>
                          {changeRequest ? (
                            <button
                              type="button"
                              className="status-badge-btn"
                              title="Click to view the changes the customer requested"
                              onClick={() => setExpandedQuotationId(isExpanded ? null : q.id)}
                            >
                              <StatusBadge status={q.status} />
                            </button>
                          ) : (
                            <StatusBadge status={q.status} />
                          )}
                        </td>
                        <td>{q.validUntil || "-"}</td>
                        <td>
                          <div className="table-row-actions">
                            <button type="button" className="btn btn-secondary btn-sm" disabled={!!busy}
                              onClick={() => run(`pdf-${q.id}`, () => viewQuotationPdf(q.id), null)}>
                              {busy === `pdf-${q.id}` ? "Opening…" : "View"}
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" disabled={!!busy} onClick={() => handleDownloadWord(q)}>
                              {busy === `word-${q.id}` ? "Preparing…" : "Download Word"}
                            </button>
                            {q.status !== "ACCEPTED" && (
                              <label className={`btn btn-secondary btn-sm${busy ? " disabled" : ""}`} style={{ cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}
                                title="Upload the PDF you edited in Word - it replaces the generated PDF">
                                {busy === `upload-${q.id}` ? "Uploading…" : "Upload PDF"}
                                <input type="file" accept="application/pdf,.pdf" hidden disabled={!!busy} onChange={(ev) => handlePdfPicked(q, ev)} />
                              </label>
                            )}
                            {(q.status === "GENERATED" || RESENDABLE.includes(q.status)) && (
                              <button type="button" className="btn btn-secondary btn-sm" disabled={!!busy} onClick={() => handleSend(q)}>
                                {busy === `send-${q.id}` ? "Sending…" : "Send via WhatsApp"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && changeRequest && (
                        <tr className="change-request-row">
                          <td colSpan={5}>
                            <strong>Customer requested changes:</strong>
                            <p>{changeRequest.changeRequestNotes || "No additional notes were provided."}</p>
                            <span className="muted">{formatDateTime(changeRequest.createdAt)}</span>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lead.whatsAppMessages?.length > 0 && (
        <div className="card">
          <div className="card-header-row">
            <h3>WhatsApp messages</h3>
            <button
              type="button"
              className="btn btn-danger"
              disabled={!!busy}
              onClick={() => {
                if (window.confirm("Clear all WhatsApp message history for this lead? This can't be undone.")) {
                  run("clear-history", () => clearWhatsAppHistory(lead.id), "WhatsApp message history cleared.");
                }
              }}
            >
              {busy === "clear-history" ? "Clearing…" : "Clear history"}
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Type</th><th>Status</th><th>Sent at</th><th></th></tr>
              </thead>
              <tbody>
                {lead.whatsAppMessages.map((m) => (
                  <Fragment key={m.id}>
                    <tr>
                      <td>{m.direction === "INBOUND" ? "Customer reply" : m.body ? "Chat reply" : labelize(m.type)}</td>
                      <td><StatusBadge status={m.deliveryStatus} /></td>
                      <td>{formatDateTime(m.sentAt)}</td>
                      <td>
                        {m.deliveryStatus === "FAILED" && (
                          <button type="button" className="btn btn-secondary" disabled={!!busy}
                            onClick={() => run(`retry-${m.id}`, () => retryMessage(m.id), "Message resent.")}>
                            {busy === `retry-${m.id}` ? "Retrying…" : "Retry"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {m.deliveryStatus === "FAILED" && m.errorMessage && (
                      <tr className="change-request-row">
                        <td colSpan={4}><p>{m.errorMessage}</p></td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
