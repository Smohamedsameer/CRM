import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClientRequests, replyToClientRequest } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import { formatDateTime } from "../utils/format.js";

/** One request in the list: shows the customer's note, and an admin reply box that sends over WhatsApp. */
function RequestCard({ item, onReplied }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!draft.trim()) {
      setError("Type a reply before sending.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const updated = await replyToClientRequest(item.id, draft.trim());
      onReplied(updated);
      setDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card client-request-card">
      <div className="card-header-row">
        <div>
          <strong>{item.leadCode}</strong> — {item.customerName}
          {item.companyName && <span className="muted"> ({item.companyName})</span>}
        </div>
        <span className={`badge${item.repliedAt ? " success" : ""}`}>
          {item.repliedAt ? "Replied" : "Pending"}
        </span>
      </div>

      <p className="muted" style={{ marginBottom: 4 }}>
        Quotation {item.quotationNumber} · {formatDateTime(item.createdAt)} ·{" "}
        <Link to={`/leads/${item.leadId}`}>View lead</Link>
      </p>

      <p className="client-request-notes">{item.changeRequestNotes || "No additional notes were provided."}</p>

      {item.repliedAt && (
        <div className="client-request-reply-sent">
          <strong>Your reply (sent {formatDateTime(item.repliedAt)}):</strong>
          <p>{item.adminReply}</p>
        </div>
      )}

      <Alert>{error}</Alert>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor={`reply-${item.id}`}>{item.repliedAt ? "Send another reply" : "Reply to customer"}</label>
        <textarea
          id={`reply-${item.id}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message to send on WhatsApp…"
        />
      </div>
      <button type="button" className="btn btn-primary" disabled={sending} onClick={handleSend}>
        {sending ? "Sending…" : "Send via WhatsApp"}
      </button>
    </div>
  );
}

/** Every customer "request changes" note across all leads, with a reply box wired to WhatsApp. */
export default function ClientRequests() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getClientRequests().then(setItems).catch((err) => setError(err.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleReplied(updated) {
    setItems((list) => list.map((it) => (it.id === updated.id ? updated : it)));
  }

  return (
    <div className="container">
      <h2>Client Request</h2>
      <Alert>{error}</Alert>

      {items === null && !error && <p className="muted">Loading…</p>}
      {items !== null && items.length === 0 && (
        <div className="card"><p className="muted">No change requests from customers yet.</p></div>
      )}

      {items?.map((item) => (
        <RequestCard key={item.id} item={item} onReplied={handleReplied} />
      ))}
    </div>
  );
}
