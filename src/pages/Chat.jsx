import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getChatThread, getConversations, markChatRead, retryMessage, sendChatMessage } from "../api/index.js";
import { BackIcon, SendIcon } from "../components/Icons.jsx";

/* ---------- small helpers ---------- */

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const timeLabel = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

function listTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return timeLabel(iso);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function initials(name) {
  const parts = (name || "?").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

/** Turns http(s) links in a message into clickable links, without ever injecting raw HTML. */
function Linkified({ text }) {
  const parts = (text || "").split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
      : <span key={i}>{part}</span>
  );
}

function Ticks({ status }) {
  if (status === "FAILED") return <span className="chat-tick failed" title="Not delivered">!</span>;
  if (status === "READ") return <span className="chat-tick read" title="Read">✓✓</span>;
  if (status === "DELIVERED") return <span className="chat-tick" title="Delivered">✓✓</span>;
  if (status === "SENT") return <span className="chat-tick" title="Sent">✓</span>;
  return <span className="chat-tick" title="Sending">…</span>;
}

function windowText(closesAt) {
  const ms = new Date(closesAt).getTime() - Date.now();
  if (ms <= 0) return "Template mode";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m left`;
}

/* ---------- one open conversation ---------- */

function ChatThread({ leadId, onChanged, onBack }) {
  const [thread, setThread] = useState(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [retrying, setRetrying] = useState(null);
  const scrollRef = useRef(null);
  const stickRef = useRef(true); // keep the view pinned to the newest message unless the user scrolled up
  const seenInboundId = useRef(null);

  const load = useCallback(async () => {
    try {
      const t = await getChatThread(leadId);
      setThread(t);
      setError("");
      // A new customer message arrived while this chat is open: mark it read so the badge clears.
      const lastIn = [...t.messages].reverse().find((m) => m.direction === "INBOUND");
      if (lastIn && lastIn.id !== seenInboundId.current) {
        seenInboundId.current = lastIn.id;
        await markChatRead(leadId);
        window.dispatchEvent(new Event("chat-unread-changed"));
        onChanged?.();
      }
    } catch (e) {
      setError(e.message || "Could not load this chat.");
    }
  }, [leadId, onChanged]);

  useEffect(() => {
    load();
    const timer = setInterval(() => { if (!document.hidden) load(); }, 4000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [thread?.messages.length]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      await sendChatMessage(leadId, body);
      setText("");
      stickRef.current = true;
    } catch (e) {
      setError(e.message || "Could not send the message.");
    } finally {
      await load(); // a rejected send is stored as a failed bubble, so always refresh
      onChanged?.();
      setSending(false);
    }
  }

  async function retry(id) {
    setRetrying(id);
    try {
      await retryMessage(id);
      setError("");
    } catch (e) {
      setError(e.message || "Retry failed.");
    } finally {
      await load();
      setRetrying(null);
    }
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  if (!thread) {
    return <div className="chat-empty muted">{error || "Loading chat…"}</div>;
  }

  const { lead, messages, windowOpen, windowClosesAt } = thread;
  const customerHasWritten = messages.some((m) => m.direction === "INBOUND");

  return (
    <>
      <div className="chat-head">
        <button type="button" className="chat-back" onClick={onBack} aria-label="Back to conversations"><BackIcon /></button>
        <div className="chat-avatar">{initials(lead.customerName)}</div>
        <div className="chat-head-info">
          <div className="chat-head-name">{lead.customerName}</div>
          <div className="chat-head-sub">{lead.phone} · {lead.leadCode}</div>
        </div>
        <span className={`chat-window ${windowOpen ? "open" : "closed"}`} title={windowOpen ? "The customer wrote in the last 24 hours: your messages go as normal chat messages." : "The customer has not written in the last 24 hours: your message is sent as an approved WhatsApp template."}>
          {windowOpen
            ? <><span className="chat-window-long">Free chat · </span>{windowText(windowClosesAt)}</>
            : <>Template mode</>}
        </span>
        <Link to={`/leads/${lead.id}`} className="btn btn-secondary btn-sm chat-viewlead">View lead</Link>
      </div>

      <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
        {messages.length === 0 && <div className="chat-empty muted">No messages with this lead yet.</div>}
        {messages.map((m, i) => {
          const out = m.direction === "OUTBOUND";
          const failed = m.status === "FAILED";
          return (
            <div key={m.id}>
              {(i === 0 || !sameDay(messages[i - 1].at, m.at)) && (
                <div className="chat-day-wrap"><span className="chat-day">{dayLabel(m.at)}</span></div>
              )}
              <div className={`chat-row ${out ? "out" : "in"}`}>
                <div className={`chat-bubble${failed ? " failed" : ""}`}>
                  {m.kind === "TEMPLATE" && <div className="chat-tag">Template message</div>}
                  {m.kind === "REPLY" && m.sentBy && <div className="chat-tag">{m.sentBy}</div>}
                  <div className="chat-text"><Linkified text={m.text} /></div>
                  <div className="chat-meta">
                    <span>{timeLabel(m.at)}</span>
                    {out && <Ticks status={m.status} />}
                  </div>
                  {failed && (
                    <div className="chat-failed">
                      <span title={m.errorMessage || ""}>Not delivered{m.errorMessage ? `: ${m.errorMessage.slice(0, 140)}` : ""}</span>
                      <button type="button" className="btn btn-secondary btn-sm" disabled={retrying === m.id} onClick={() => retry(m.id)}>
                        {retrying === m.id ? "Retrying…" : "Retry"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <div className="chat-error">{error}</div>}

      {!windowOpen && (
        <div className="chat-closed-note">
          {customerHasWritten
            ? "The customer has not messaged in the last 24 hours, so your message will be sent as an approved WhatsApp template message."
            : "You can message this customer first. Your message is sent as an approved WhatsApp template message."}
        </div>
      )}
      <div className="chat-composer">
        <textarea
          rows={Math.min(5, Math.max(1, text.split("\n").length))}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message"
          title="Enter to send, Shift+Enter for a new line"
          maxLength={windowOpen ? 4096 : 900}
        />
        <button type="button" className="chat-send" onClick={send} disabled={sending || !text.trim()} aria-label="Send">
          <SendIcon />
        </button>
      </div>
    </>
  );
}

/* ---------- the page: conversation list + open chat ---------- */

export default function Chat() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const activeId = leadId ? Number(leadId) : null;

  const [convos, setConvos] = useState(null);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");

  const loadConvos = useCallback(async () => {
    try {
      setConvos(await getConversations());
      setListError("");
    } catch (e) {
      setListError(e.message || "Could not load conversations.");
    }
  }, []);

  useEffect(() => {
    loadConvos();
    const timer = setInterval(() => { if (!document.hidden) loadConvos(); }, 8000);
    return () => clearInterval(timer);
  }, [loadConvos]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!convos) return [];
    if (!q) return convos;
    return convos.filter((c) =>
      [c.customerName, c.phone, c.leadCode].some((v) => (v || "").toLowerCase().includes(q)));
  }, [convos, search]);

  return (
    <div className={`chat-shell${activeId ? " has-active" : ""}`}>
      <aside className="chat-list">
        <div className="chat-list-head">
          <h2>Chats</h2>
          <input
            className="chat-search"
            type="search"
            placeholder="Search name, phone or lead code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="chat-items">
          {listError && <div className="chat-error">{listError}</div>}
          {!convos && !listError && <div className="chat-empty muted">Loading…</div>}
          {convos && visible.length === 0 && (
            <div className="chat-empty muted">
              {search ? "No chats match your search." : "No conversations yet. They appear here once a welcome message is sent or a customer replies."}
            </div>
          )}
          {visible.map((c) => (
            <button
              key={c.leadId}
              type="button"
              className={`chat-item${c.leadId === activeId ? " active" : ""}${c.unread > 0 ? " has-unread" : ""}`}
              onClick={() => navigate(`/chat/${c.leadId}`)}
            >
              <div className="chat-avatar">{initials(c.customerName)}</div>
              <div className="chat-item-main">
                <div className="chat-item-top">
                  <span className="chat-item-name">{c.customerName}</span>
                  <span className="chat-item-time">{listTime(c.lastAt)}</span>
                </div>
                <div className="chat-item-bottom">
                  <span className="chat-item-preview">{c.lastDirection === "OUTBOUND" ? "You: " : ""}{c.lastMessage}</span>
                  {c.unread > 0 && <span className="chat-unread">{c.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-pane">
        {activeId ? (
          <ChatThread key={activeId} leadId={activeId} onChanged={loadConvos} onBack={() => navigate("/chat")} />
        ) : (
          <div className="chat-empty muted">
            <h3>WhatsApp chats</h3>
            <p>Select a lead on the left to read the messages and send a message.</p>
          </div>
        )}
      </section>
    </div>
  );
}
