import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import { formatDateTime } from "../utils/format.js";

const PAGE_SIZE = 20;

/** Full notification history: every enquiry submission and "request changes" event, read or not. */
export default function Notifications() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = useCallback(() => {
    getNotifications(page, PAGE_SIZE)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function handleMarkAllRead() {
    setData((d) => (d ? { ...d, content: d.content.map((n) => ({ ...n, read: true })) } : d));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleItemClick(n) {
    if (!n.read) {
      setData((d) => ({ ...d, content: d.content.map((it) => (it.id === n.id ? { ...it, read: true } : it)) }));
      try {
        await markNotificationRead(n.id);
      } catch {
        // Non-fatal - the page just won't reflect it until reload.
      }
    }
    if (n.link) navigate(n.link);
  }

  const items = data?.content ?? [];
  const unreadCount = items.filter((n) => !n.read).length;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="container wide">
      <div className="card">
        <div className="card-header-row">
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
              Mark all read
            </button>
          )}
        </div>
        <Alert>{error}</Alert>

        {data === null && !error && <p className="muted">Loading…</p>}
        {data !== null && items.length === 0 && <p className="muted">No notifications yet.</p>}

        <ul className="notif-page-list">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" className={`notif-page-item${n.read ? "" : " unread"}`} onClick={() => handleItemClick(n)}>
                {!n.read && <span className="notif-dot" aria-label="Unread" />}
                <span className="notif-page-body">
                  <span className="notif-page-title">{n.title}</span>
                  {n.message && <span className="notif-page-message">{n.message}</span>}
                  <span className="notif-page-time muted">{formatDateTime(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="pagination">
            <button type="button" className="btn btn-secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="muted">Page {page + 1} of {totalPages}</span>
            <button type="button" className="btn btn-secondary" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
