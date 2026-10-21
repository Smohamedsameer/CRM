import { request, apiUrl, openAuthedPdf, sessionStorageHelper } from "./client.js";

// ---- Employee (JWT) ----------------------------------------------------
export const login = (email, password) =>
  request("/api/auth/login", { method: "POST", body: { email, password } });

export const getSummary = () => request("/api/dashboard/summary", { auth: true });
export const getAnalytics = () => request("/api/dashboard/analytics", { auth: true });

export function getLeads({ status, search, page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  return request(`/api/leads?${params.toString()}`, { auth: true });
}

/** Permanently deletes a lead with its enquiry, quotations, order and WhatsApp history. */
export const deleteLead = (id) => request(`/api/leads/${id}`, { method: "DELETE", auth: true });
export const createLead = (payload) => request("/api/leads", { method: "POST", body: payload, auth: true });
export const getLeadDetail = (id) => request(`/api/leads/${id}/detail`, { auth: true });
export const resendWelcome = (id) => request(`/api/leads/${id}/resend-welcome`, { method: "POST", auth: true });
/** payload: { items: [{ description, quantity, unitPrice }], discount?, taxPercentage? } */
export const generateQuotation = (leadId, payload = {}) =>
  request(`/api/quotations/generate/${leadId}`, { method: "POST", body: payload, auth: true });
/** Saves the quotation-builder details so the Word version can be downloaded later from the Quotations list. */
export const saveQuotationFormData = (id, data) => request(`/api/quotations/${id}/form-data`, { method: "PUT", body: data, auth: true });
/** Returns the saved details, or null when none were saved (quotation made before this feature existed). */
export async function getQuotationFormData(id) {
  try {
    return await request(`/api/quotations/${id}/form-data`, { auth: true });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}
/** Replaces the quotation's stored PDF: the PEB PDF built in the browser, or a PDF edited in Word and uploaded by the employee. */
export async function uploadQuotationPdf(id, blob) {
  const session = sessionStorageHelper.read();
  const res = await fetch(apiUrl(`/api/quotations/${id}/pdf`), {
    method: "POST",
    headers: { "Content-Type": "application/pdf", ...(session ? { Authorization: `Bearer ${session.token}` } : {}) },
    body: blob,
  });
  if (!res.ok) {
    let msg = "";
    try { msg = (await res.json()).message || ""; } catch { /* no JSON body */ }
    throw new Error(res.status === 401 ? "Session expired - please sign in again." : msg || "Could not save the quotation PDF (" + res.status + ").");
  }
  return res.json();
}
export const sendQuotation = (id) => request(`/api/quotations/${id}/send`, { method: "POST", auth: true });
/** Opens a sent (or generated) quotation's PDF in a new tab, for admin review - works for any status. */
export const viewQuotationPdf = (id) => openAuthedPdf(`/api/quotations/${id}/pdf`);
export const retryMessage = (id) => request(`/api/whatsapp-messages/${id}/retry`, { method: "POST", auth: true });
export const clearWhatsAppHistory = (leadId) =>
  request(`/api/whatsapp-messages/lead/${leadId}`, { method: "DELETE", auth: true });
export const confirmOrder = (leadId) => request(`/api/orders/confirm/${leadId}`, { method: "POST", auth: true });

// ---- Chat (WhatsApp conversations per lead) -----------------------------
export const getConversations = () => request("/api/chat/conversations", { auth: true });
export const getChatUnreadCount = () => request("/api/chat/unread-count", { auth: true });
export const getChatThread = (leadId) => request(`/api/chat/leads/${leadId}`, { auth: true });
export const markChatRead = (leadId) => request(`/api/chat/leads/${leadId}/read`, { method: "POST", auth: true });
export const sendChatMessage = (leadId, text) =>
  request(`/api/chat/leads/${leadId}/messages`, { method: "POST", body: { text }, auth: true });

// ---- Notifications (bell in navbar) -------------------------------------
export const getNotifications = (page = 0, size = 20) =>
  request(`/api/notifications?page=${page}&size=${size}`, { auth: true });
export const getUnreadNotificationCount = () => request("/api/notifications/unread-count", { auth: true });
export const markNotificationRead = (id) => request(`/api/notifications/${id}/read`, { method: "POST", auth: true });
export const markAllNotificationsRead = () => request("/api/notifications/read-all", { method: "POST", auth: true });

// ---- Client requests (customer "request changes" notes, with admin reply) ----
export const getClientRequests = () => request("/api/client-requests", { auth: true });
export const replyToClientRequest = (id, message) =>
  request(`/api/client-requests/${id}/reply`, { method: "POST", body: { message }, auth: true });

// ---- Certificates & Documents ----------------------------------------
export const getDocuments = () => request("/api/documents", { auth: true });
/** payload: { category, docType, fileName, contentType, dataBase64 } */
export const uploadDocument = (payload) => request("/api/documents", { method: "POST", body: payload, auth: true });
export const getDocumentContent = (id) => request(`/api/documents/${id}/content`, { auth: true });
export const deleteDocument = (id) => request(`/api/documents/${id}`, { method: "DELETE", auth: true });

// ---- Settings ----------------------------------------------------------
export const getCompanySettings = () => request("/api/settings/company", { auth: true });
export const updateCompanySettings = (payload) =>
  request("/api/settings/company", { method: "PUT", body: payload, auth: true });
export const getPricingSettings = () => request("/api/settings/pricing", { auth: true });
export const updatePricingSettings = (payload) =>
  request("/api/settings/pricing", { method: "PUT", body: payload, auth: true });
export const changePassword = (currentPassword, newPassword) =>
  request("/api/settings/change-password", { method: "POST", body: { currentPassword, newPassword }, auth: true });

// ---- Customer (secure token in the link, no login) ---------------------
export const getEnquiryPrefill = (token) => request(`/api/public/enquiry/${token}`);
export const submitEnquiry = (payload) => request("/api/public/enquiry", { method: "POST", body: payload });
export const getPublicQuotation = (token) => request(`/api/public/quotations/${token}`);
export const acceptQuotation = (token) => request(`/api/public/quotations/${token}/accept`, { method: "POST" });
export const requestQuotationChanges = (token, notes) =>
  request(`/api/public/quotations/${token}/request-changes`, { method: "POST", body: { notes } });
/** Customer tapped "Call to confirm order": the lead is marked "Called to order" in the dashboard. */
export const calledToOrder = (token) => request(`/api/public/quotations/${token}/called-to-order`, { method: "POST" });
