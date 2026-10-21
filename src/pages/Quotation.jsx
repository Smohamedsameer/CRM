import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { calledToOrder, getPublicQuotation, requestQuotationChanges } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PolicyFooter from "../components/PolicyFooter.jsx";
import { money, formatDate } from "../utils/format.js";

const DEFAULT_CALL = "+919942466663"; // MD - used only if the server does not send a number

/** Customer-facing quotation page. Reached from the WhatsApp quotation message: /quotation/<token> */
export default function Quotation() {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
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

  /** Tapping "Call to confirm order": the phone opens the dialer (tel: link) and we record "Called to order" on the lead. */
  function handleCall() {
    calledToOrder(token)
      .then(() => setQuote((q) => (q && q.status !== "ORDER_CONFIRMED" ? { ...q, status: "CALLED_TO_ORDER" } : q)))
      .catch(() => { /* the call must never be blocked by a recording problem */ });
  }

  async function handleSendFeedback() {
    if (!notes.trim()) {
      setResult({ type: "error", text: "Please write your feedback first." });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      await requestQuotationChanges(token, notes.trim());
      setNotes("");
      setShowFeedback(false);
      setResult({ type: "success", text: "Thank you! Your feedback has been sent to our team. We'll get back to you shortly." });
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

  const callNumber = quote.callPhone || DEFAULT_CALL;

  return (
    <div className="container">
      <div className="card">
        <h2>Quotation {quote.quotationNumber}</h2>
        <table>
          <tbody>
            <tr><td>Name</td><td>{quote.customerName}</td></tr>
            <tr><td>Company name</td><td>{quote.companyName || "-"}</td></tr>
            <tr><td>Phone number</td><td>{quote.phone || "-"}</td></tr>
            <tr><td>Address</td><td style={{ whiteSpace: "pre-line" }}>{quote.address || "-"}</td></tr>
            <tr className="total-row"><td>Total</td><td>{money(quote.totalAmount)}</td></tr>
            <tr><td>Valid until</td><td>{quote.validUntil ? formatDate(quote.validUntil) : "-"}</td></tr>
            <tr><td>Status</td><td><StatusBadge status={quote.status} /></td></tr>
          </tbody>
        </table>

        <div className="row actions">
          <a href={`tel:${callNumber}`} className="btn btn-success" style={{ textDecoration: "none", textAlign: "center" }} onClick={handleCall}>
            Call to confirm order
          </a>
          <button type="button" className="btn btn-secondary" disabled={submitting} onClick={() => setShowFeedback((v) => !v)}>
            Feedbacks
          </button>
        </div>

        {showFeedback && (
          <div className="changes-form">
            <div className="field">
              <label htmlFor="feedbackNotes">Your feedback</label>
              <textarea id="feedbackNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary btn-block" disabled={submitting} onClick={handleSendFeedback}>
              {submitting ? "Sending…" : "Send feedback"}
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
