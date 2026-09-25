import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { acceptQuotation, getPublicQuotation, quotationPdfUrl, requestQuotationChanges } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PolicyFooter from "../components/PolicyFooter.jsx";
import { money } from "../utils/format.js";

const FINAL_STATUSES = ["ACCEPTED", "CHANGES_REQUESTED", "REJECTED", "EXPIRED"];

/** Customer-facing quotation page. Reached from the WhatsApp quotation message: /quotation/<token> */
export default function Quotation() {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showChanges, setShowChanges] = useState(false);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null); // { type, text }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPublicQuotation(token)
      .then((data) => !cancelled && setQuote(data))
      .catch((err) => !cancelled && setLoadError(err.message || "This quotation link is invalid or has expired."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [token]);

  async function handleAccept() {
    setSubmitting(true);
    setResult(null);
    try {
      await acceptQuotation(token);
      setQuote((q) => ({ ...q, status: "ACCEPTED" }));
      setResult({ type: "success", text: "Thank you! You've accepted the quotation. Our team will contact you shortly." });
    } catch (err) {
      setResult({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitChanges() {
    if (!notes.trim()) {
      setResult({ type: "error", text: "Please describe what you'd like to change." });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      await requestQuotationChanges(token, notes.trim());
      setQuote((q) => ({ ...q, status: "CHANGES_REQUESTED" }));
      setShowChanges(false);
      setResult({ type: "success", text: "Your request has been sent to our team. We'll get back to you shortly." });
    } catch (err) {
      setResult({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="container"><div className="card"><p className="muted">Loading your quotation…</p></div></div>;
  }
  if (loadError || !quote) {
    return <div className="container"><div className="card"><Alert>{loadError || "Unable to load your quotation right now."}</Alert></div></div>;
  }

  const canRespond = !FINAL_STATUSES.includes(quote.status);

  return (
    <div className="container">
      <div className="card">
        <h2>Quotation {quote.quotationNumber}</h2>
        <table>
          <tbody>
            <tr><td>Customer</td><td>{quote.customerName}</td></tr>
            <tr><td>Company</td><td>{quote.companyName || "-"}</td></tr>
            <tr><td>Subtotal</td><td>{money(quote.subtotal)}</td></tr>
            <tr><td>Discount</td><td>{money(quote.discount)}</td></tr>
            <tr><td>Tax</td><td>{money(quote.tax)}</td></tr>
            <tr className="total-row"><td>Total amount</td><td>{money(quote.totalAmount)}</td></tr>
            <tr><td>Valid until</td><td>{quote.validUntil || "-"}</td></tr>
            <tr><td>Status</td><td><StatusBadge status={quote.status} /></td></tr>
          </tbody>
        </table>

        <p className="pdf-link">
          <a href={quotationPdfUrl(token)} target="_blank" rel="noreferrer">Download PDF quotation</a>
        </p>

        {canRespond && (
          <div className="row actions">
            <button type="button" className="btn btn-success" disabled={submitting} onClick={handleAccept}>
              Accept quotation
            </button>
            <button type="button" className="btn btn-danger" disabled={submitting} onClick={() => setShowChanges(true)}>
              Request changes
            </button>
          </div>
        )}

        {canRespond && showChanges && (
          <div className="changes-form">
            <div className="field">
              <label htmlFor="changeNotes">What would you like to change?</label>
              <textarea id="changeNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary btn-block" disabled={submitting} onClick={handleSubmitChanges}>
              {submitting ? "Sending…" : "Send request"}
            </button>
          </div>
        )}

        <div className="result">
          <Alert type={result?.type}>{result?.text}</Alert>
        </div>
      </div>
      <PolicyFooter />
    </div>
  );
}
