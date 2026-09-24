import { request, apiUrl } from "./client.js";

// ---- Employee (JWT) ----------------------------------------------------
export const login = (email, password) =>
  request("/api/auth/login", { method: "POST", body: { email, password } });

export const getSummary = () => request("/api/dashboard/summary", { auth: true });

export function getLeads({ status, search, page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  return request(`/api/leads?${params.toString()}`, { auth: true });
}

export const createLead = (payload) => request("/api/leads", { method: "POST", body: payload, auth: true });
export const getLeadDetail = (id) => request(`/api/leads/${id}/detail`, { auth: true });
export const resendWelcome = (id) => request(`/api/leads/${id}/resend-welcome`, { method: "POST", auth: true });
/** payload: { items: [{ description, quantity, unitPrice }], discount?, taxPercentage? } */
export const generateQuotation = (leadId, payload = {}) =>
  request(`/api/quotations/generate/${leadId}`, { method: "POST", body: payload, auth: true });
export const sendQuotation = (id) => request(`/api/quotations/${id}/send`, { method: "POST", auth: true });
export const retryMessage = (id) => request(`/api/whatsapp-messages/${id}/retry`, { method: "POST", auth: true });
export const clearWhatsAppHistory = (leadId) =>
  request(`/api/whatsapp-messages/lead/${leadId}`, { method: "DELETE", auth: true });
export const confirmOrder = (leadId) => request(`/api/orders/confirm/${leadId}`, { method: "POST", auth: true });

// ---- Notifications (bell in navbar) -------------------------------------
export const getNotifications = (page = 0, size = 20) =>
  request(`/api/notifications?page=${page}&size=${size}`, { auth: true });
export const getUnreadNotificationCount = () => request("/api/notifications/unread-count", { auth: true });
export const markNotificationRead = (id) => request(`/api/notifications/${id}/read`, { method: "POST", auth: true });
export const markAllNotificationsRead = () => request("/api/notifications/read-all", { method: "POST", auth: true });

// ---- Customer (secure token in the link, no login) ---------------------
export const getEnquiryPrefill = (token) => request(`/api/public/enquiry/${token}`);
export const submitEnquiry = (payload) => request("/api/public/enquiry", { method: "POST", body: payload });
export const getPublicQuotation = (token) => request(`/api/public/quotations/${token}`);
export const acceptQuotation = (token) => request(`/api/public/quotations/${token}/accept`, { method: "POST" });
export const requestQuotationChanges = (token, notes) =>
  request(`/api/public/quotations/${token}/request-changes`, { method: "POST", body: { notes } });
export const quotationPdfUrl = (token) => apiUrl(`/api/public/quotations/${token}/pdf`);
