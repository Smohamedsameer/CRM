import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/index.js";
import { formatDateTime } from "../utils/format.js";

const POLL_MS = 30000;

/** Bell icon in the navbar: shows an unread badge and a dropdown, fed by new enquiry
 * submissions and customer "request changes" events (see NotificationController on the backend). */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const refreshCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res?.unreadCount ?? 0);
    } catch {
      // Silently ignore; the bell just won't update this cycle.
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications(0, 20);
      setItems(res?.content ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  }

  async function handleItemClick(n) {
    if (!n.read) {
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, read: true } : it)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markNotificationRead(n.id);
      } catch {
        // Non-fatal; count will resync on next poll.
      }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((it) => ({ ...it, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      // Non-fatal; count will resync on next poll.
    }
  }

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={toggleOpen}
        aria-label="Notifications"
        title="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" className="link-btn notif-mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading && <div className="notif-empty muted">Loading…</div>}
            {!loading && items.length === 0 && (
              <div className="notif-empty muted">No notifications yet.</div>
            )}
            {!loading &&
              items.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={`notif-item${n.read ? "" : " unread"}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className="notif-item-title">{n.title}</div>
                  {n.message && <div className="notif-item-message">{n.message}</div>}
                  <div className="notif-item-time muted">{formatDateTime(n.createdAt)}</div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3a5 5 0 0 0-5 5v3.2c0 .6-.2 1.2-.6 1.7L5 15h14l-1.4-2.1c-.4-.5-.6-1.1-.6-1.7V8a5 5 0 0 0-5-5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
