export function money(value) {
  return value === undefined || value === null || value === "" ? "-" : "₹" + Number(value).toLocaleString("en-IN");
}

export const formatDate = (v) => (v ? new Date(v).toLocaleDateString() : "-");
export const formatDateTime = (v) => (v ? new Date(v).toLocaleString() : "-");

/** NEW_LEAD -> "New Lead" */
export function labelize(value) {
  if (!value) return "-";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
