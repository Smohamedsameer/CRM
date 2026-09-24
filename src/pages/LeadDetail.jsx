import { Fragment, useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  clearWhatsAppHistory, confirmOrder, getLeadDetail, resendWelcome, retryMessage, sendQuotation,
} from "../api/index.js";
import Alert from "../components/Alert.jsx";
import QuoteBuilder from "../components/QuoteBuilder.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { TIMELINE_LABELS, TIMELINE_ORDER } from "../utils/constants.js";
import { formatDateTime, labelize, money } from "../utils/format.js";

const EXTRA_STATUSES = ["CHANGES_REQUESTED", "REJECTED", "CLOSED"];

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

  if (loadError) {
    return <div className="container"><Alert>{loadError}</Alert></div>;
  }
  if (!lead) {
    return <div className="container"><p className="muted">Loading lead…</p></div>;
  }

  const e = lead.enquiry;
  const enquiryRows = e
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

  return (
    <div className="container">
      <Alert>{notice?.type === "error" ? notice.text : ""}</Alert>
      <Alert type="success">{notice?.type === "success" ? notice.text : ""}</Alert>

      <div className="card">
        <h2>{lead.leadCode}</h2>
        <table>
          <tbody>
            <tr><td>Customer</td><td>{lead.customerName}</td></tr>
            <tr><td>Company</td><td>{lead.companyName || "-"}</td></tr>
            <tr><td>Phone</td><td>{lead.phone}</td></tr>
            <tr><td>Email</td><td>{lead.email || "-"}</td></tr>
            <tr><td>Square feet</td><td>{lead.squareFeet || "-"}</td></tr>
            <tr><td>Source</td><td>{labelize(lead.source)}</td></tr>
            <tr><td>Status</td><td><StatusBadge status={lead.status} /></td></tr>
          </tbody>
        </table>

        <div className="row actions">
          <button type="button" className="btn btn-secondary" disabled={!!busy}
            onClick={() => run("welcome", () => resendWelcome(lead.id), "Welcome message re-sent.")}>
            {busy === "welcome" ? "Sending…" : "Resend welcome message"}
          </button>
          <button type="button" className="btn btn-primary" disabled={!!busy}
            onClick={() => setShowQuoteBuilder((v) => !v)}>
            {showQuoteBuilder ? "Close quotation builder" : "Build quotation"}
          </button>
          {lead.status === "ACCEPTED" && (
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
            onGenerated={() => {
              setShowQuoteBuilder(false);
              setNotice({ type: "success", text: "Quotation generated. Send it to the customer from the Quotations list below." });
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
                          {q.status === "GENERATED" && (
                            <button type="button" className="btn btn-secondary" disabled={!!busy}
                              onClick={() => run(`send-${q.id}`, () => sendQuotation(q.id), "Quotation sent via WhatsApp.")}>
                              {busy === `send-${q.id}` ? "Sending…" : "Send via WhatsApp"}
                            </button>
                          )}
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
                  <tr key={m.id}>
                    <td>{labelize(m.type)}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
