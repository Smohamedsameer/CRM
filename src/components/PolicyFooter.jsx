import { Link } from "react-router-dom";

/** Small footer link shown on customer-facing pages (enquiry, quotation). */
export default function PolicyFooter() {
  return (
    <p className="policy-footer muted">
      <Link to="/privacy-policy">Privacy Policy</Link>
    </p>
  );
}
