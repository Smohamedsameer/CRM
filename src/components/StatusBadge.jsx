import { labelize } from "../utils/format.js";
import { toneFor } from "../utils/constants.js";

export default function StatusBadge({ status }) {
  return <span className={`badge ${toneFor(status)}`.trim()}>{labelize(status)}</span>;
}
