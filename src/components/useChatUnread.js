import { useEffect, useState } from "react";
import { getChatUnreadCount } from "../api/index.js";

/**
 * Number of unread customer WhatsApp messages, for the sidebar badge. Polls every 15 s while the tab is
 * visible, and refreshes immediately when the Chat screen marks a conversation as read.
 */
export default function useChatUnread() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () => {
      if (document.hidden) return;
      getChatUnreadCount()
        .then((r) => alive && setCount(r?.count ?? 0))
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 15000);
    window.addEventListener("chat-unread-changed", load);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("chat-unread-changed", load);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  return count;
}
