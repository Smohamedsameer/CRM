import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteChatMessage, getChatAttachmentBlob, getChatThread, getConversations, getOtherChatThread, markChatRead,
  markOtherChatRead, retryMessage, sendChatAttachment, sendChatMessage, sendOtherChatAttachment, sendOtherChatMessage,
} from "../api/index.js";
import { sessionStorageHelper } from "../api/client.js";
import { AttachIcon, BackIcon, SendIcon, TrashIcon } from "../components/Icons.jsx";

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

const ATTACH_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png";
const ALLOWED_EXT = /\.(pdf|docx?|xlsx?|pptx?|txt|jpe?g|png)$/i;
const MAX_FILE = 10 * 1024 * 1024;
const MAX_IMAGE = 5 * 1024 * 1024;

function fileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const fileKind = (name = "") => (name.split(".").pop() || "file").slice(0, 4).toUpperCase();

/** A sent file: image preview (loaded with the login token) or a file card that opens / downloads it. */
function Attachment({ message }) {
  const isImage = (message.attachmentMime || "").startsWith("image/");
  const [src, setSrc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isImage) return undefined;
    let url = null;
    let cancelled = false;
    getChatAttachmentBlob(message.id)
      .then((blob) => { if (!cancelled) { url = URL.createObjectURL(blob); setSrc(url); } })
      .catch(() => { if (!cancelled) setErr("Could not load the image."); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [isImage, message.id]);

  async function open() {
    setBusy(true);
    setErr("");
    try {
      const blob = await getChatAttachmentBlob(message.id);
      const url = URL.createObjectURL(blob);
      if (isImage || message.attachmentMime === "application/pdf") {
        window.open(url, "_blank", "noopener");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = message.attachmentName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setErr(e.message || "Could not open the file.");
    } finally {
      setBusy(false);
    }
  }

  if (isImage) {
    return (
      <div className="chat-attach-img">
        {src ? <img src={src} alt={message.attachmentName} onClick={open} /> : <div className="chat-attach-loading">{err || "Loading image…"}</div>}
      </div>
    );
  }
  return (
    <div>
      <button type="button" className="chat-attach-card" onClick={open} disabled={busy} title="Open / download">
        <span className="chat-attach-kind">{fileKind(message.attachmentName)}</span>
        <span className="chat-attach-info">
          <span className="chat-attach-name">{message.attachmentName}</span>
          <span className="chat-attach-size">{fileSize(message.attachmentSize)}</span>
        </span>
      </button>
      {err && <div className="chat-attach-err">{err}</div>}
    </div>
  );
}

/* ---------- one open conversation ---------- */

/** One chat. Either a lead (leadId) or a number that is not in our leads (phone, shown under "Other"). */
function ChatThread({ leadId, phone, onChanged, onBack }) {
  const isOther = !leadId;
  const [thread, setThread] = useState(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [retrying, setRetrying] = useState(null);
  const [file, setFile] = useState(null);      // file chosen with the attach button, sent with the next Send
  const fileInput = useRef(null);
  const session = sessionStorageHelper.read();
  const isAdmin = session?.role === "ADMIN";
  const scrollRef = useRef(null);
  const stickRef = useRef(true); // keep the view pinned to the newest message unless the user scrolled up
  const seenInboundId = useRef(null);

  const load = useCallback(async () => {
    try {
      const t = isOther ? await getOtherChatThread(phone) : await getChatThread(leadId);
      setThread(t);
      setError("");
      // A new customer message arrived while this chat is open: mark it read so the badge clears.
      const lastIn = [...t.messages].reverse().find((m) => m.direction === "INBOUND");
      if (lastIn && lastIn.id !== seenInboundId.current) {
        seenInboundId.current = lastIn.id;
        if (isOther) await markOtherChatRead(phone); else await markChatRead(leadId);
        window.dispatchEvent(new Event("chat-unread-changed"));
        onChanged?.();
      }
    } catch (e) {
      setError(e.message || "Could not load this chat.");
    }
  }, [leadId, phone, isOther, onChanged]);

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
    if ((!body && !file) || sending) return;
    setSending(true);
    setError("");
    try {
      if (file) await (isOther ? sendOtherChatAttachment(phone, file, body) : sendChatAttachment(leadId, file, body));
      else await (isOther ? sendOtherChatMessage(phone, body) : sendChatMessage(leadId, body));
      setText("");
      setFile(null);
      stickRef.current = true;
    } catch (e) {
      setError(e.message || "Could not send the message.");
    } finally {
      await load(); // a rejected send is stored as a failed bubble, so always refresh
      onChanged?.();
      setSending(false);
    }
  }

  function pickFile(e) {
    const f = e.target.files?.[0];
    e.target.value = ""; // lets the same file be chosen again later
    if (!f) return;
    const isImg = /\.(jpe?g|png)$/i.test(f.name);
    if (!ALLOWED_EXT.test(f.name)) {
      setError("This file type cannot be sent. Allowed: PDF, Word, Excel, PowerPoint, TXT, JPG, PNG.");
      return;
    }
    if (f.size > MAX_FILE) { setError("The file is larger than 10 MB."); return; }
    if (isImg && f.size > MAX_IMAGE) { setError("WhatsApp accepts images up to 5 MB. Send it as a PDF or make it smaller."); return; }
    setError("");
    setFile(f);
  }

  async function remove(m) {
    const note = "Delete this message for everyone?\n\nIt is removed from this CRM chat for all staff. "
      + "WhatsApp cannot remove it from the customer's phone, so the customer will still see it.";
    if (!window.confirm(note)) return;
    try {
      await deleteChatMessage(m.id);
      setError("");
    } catch (e) {
      setError(e.message || "Could not delete the message.");
    } finally {
      await load();
      onChanged?.();
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
          <div className="chat-head-sub">{lead.phone} · {isOther ? "Not in your leads" : lead.leadCode}</div>
        </div>
        <span className={`chat-window ${windowOpen ? "open" : "closed"}`} title={windowOpen ? "The customer wrote in the last 24 hours: your messages go as normal chat messages." : "The customer has not written in the last 24 hours: your message is sent as an approved WhatsApp template."}>
          {windowOpen
            ? <><span className="chat-window-long">Free chat · </span>{windowText(windowClosesAt)}</>
            : <>Template mode</>}
        </span>
        {isOther ? (
          <Link
            to={`/leads/new?${new URLSearchParams({ phone: lead.phone, ...(lead.customerName.startsWith("+") ? {} : { name: lead.customerName }) })}`}
            className="btn btn-secondary btn-sm chat-viewlead"
          >Add as lead</Link>
        ) : (
          <Link to={`/leads/${lead.id}`} className="btn btn-secondary btn-sm chat-viewlead">View lead</Link>
        )}
      </div>

      <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
        {messages.length === 0 && <div className="chat-empty muted">No messages with this lead yet.</div>}
        {messages.map((m, i) => {
          const out = m.direction === "OUTBOUND";
          const failed = m.status === "FAILED";
          const deleted = m.kind === "DELETED";
          const canDelete = out && !deleted && (isAdmin || (m.sentBy && m.sentBy === session?.name));
          return (
            <div key={m.id}>
              {(i === 0 || !sameDay(messages[i - 1].at, m.at)) && (
                <div className="chat-day-wrap"><span className="chat-day">{dayLabel(m.at)}</span></div>
              )}
              <div className={`chat-row ${out ? "out" : "in"}`}>
                <div className={`chat-bubble${failed ? " failed" : ""}${deleted ? " deleted" : ""}`}>
                  {canDelete && (
                    <button type="button" className="chat-del" onClick={() => remove(m)} title="Delete for everyone" aria-label="Delete for everyone">
                      <TrashIcon />
                    </button>
                  )}
                  {m.kind === "TEMPLATE" && <div className="chat-tag">Template message</div>}
                  {m.kind === "REPLY" && m.sentBy && <div className="chat-tag">{m.sentBy}</div>}
                  {m.attachmentName && <Attachment message={m} />}
                  {(m.text || deleted) && (
                    <div className="chat-text">{deleted ? <em>🚫 {m.text}</em> : <Linkified text={m.text} />}</div>
                  )}
                  <div className="chat-meta">
                    <span>{timeLabel(m.at)}</span>
                    {out && !deleted && <Ticks status={m.status} />}
                  </div>
                  {failed && !deleted && (
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
      {file && (
        <div className="chat-staged">
          <span className="chat-attach-kind">{fileKind(file.name)}</span>
          <span className="chat-staged-name">{file.name} <small>({fileSize(file.size)})</small></span>
          <button type="button" className="chat-staged-x" onClick={() => setFile(null)} aria-label="Remove file">×</button>
        </div>
      )}
      <div className="chat-composer">
        <input ref={fileInput} type="file" accept={ATTACH_ACCEPT} onChange={pickFile} hidden />
        <button
          type="button"
          className="chat-attach-btn"
          onClick={() => fileInput.current?.click()}
          disabled={!windowOpen || sending}
          aria-label="Attach a file"
          title={windowOpen
            ? "Attach a PDF, image or document"
            : "Files can only be sent while the customer's 24-hour chat window is open (the customer must message first)"}
        >
          <AttachIcon />
        </button>
        <textarea
          rows={Math.min(5, Math.max(1, text.split("\n").length))}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={file ? "Add a caption (optional)" : "Type a message"}
          title="Enter to send, Shift+Enter for a new line"
          maxLength={file ? 1024 : windowOpen ? 4096 : 900}
        />
        <button type="button" className="chat-send" onClick={send} disabled={sending || (!text.trim() && !file)} aria-label="Send">
          <SendIcon />
        </button>
      </div>
    </>
  );
}

/* ---------- the page: conversation list + open chat ---------- */

export default function Chat() {
  const { leadId, phone } = useParams();
  const navigate = useNavigate();
  const activeId = leadId ? Number(leadId) : null;
  const activePhone = phone || null; // set when a chat from the "Other" section is open
  const hasActive = Boolean(activeId || activePhone);

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

  const leadChats = visible.filter((c) => !c.other);
  const otherChats = visible.filter((c) => c.other);

  const renderItem = (c) => {
    const key = c.other ? `o-${c.phone}` : `l-${c.leadId}`;
    const active = c.other ? c.phone === activePhone : c.leadId === activeId;
    return (
      <button
        key={key}
        type="button"
        className={`chat-item${active ? " active" : ""}${c.unread > 0 ? " has-unread" : ""}`}
        onClick={() => navigate(c.other ? `/chat/other/${c.phone}` : `/chat/${c.leadId}`)}
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
    );
  };

  return (
    <div className={`chat-shell${hasActive ? " has-active" : ""}`}>
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
          {leadChats.map(renderItem)}
          {otherChats.length > 0 && (
            <>
              <div className="chat-section" title="People who wrote to your WhatsApp number but are not in your leads">Other · not in leads</div>
              {otherChats.map(renderItem)}
            </>
          )}
        </div>
      </aside>

      <section className="chat-pane">
        {hasActive ? (
          <ChatThread key={activeId || `o-${activePhone}`} leadId={activeId} phone={activePhone} onChanged={loadConvos} onBack={() => navigate("/chat")} />
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
