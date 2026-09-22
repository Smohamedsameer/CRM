import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLeads, getSummary } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { STATUSES, SUMMARY_CARDS } from "../utils/constants.js";
import { formatDate, labelize } from "../utils/format.js";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [leadsPage, setLeadsPage] = useState(null);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getSummary()
      .then((data) => !cancelled && setSummary(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError("");
    getLeads({ status, search, page })
      .then((data) => !cancelled && setLeadsPage(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [status, search, page]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  }

  function handleStatusChange(e) {
    setPage(0);
    setStatus(e.target.value);
  }

  const leads = leadsPage?.content ?? [];
  const totalPages = leadsPage?.totalPages ?? 0;

  return (
    <div className="container wide">
      <Alert>{error}</Alert>

      <div className="stat-grid">
        {SUMMARY_CARDS.map(([key, label]) => (
          <div className="stat-card" key={key}>
            <div className="num">{summary?.[key] ?? (summary ? 0 : "–")}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <form className="row filters" onSubmit={handleSearch}>
          <input
            aria-label="Search leads"
            placeholder="Search by name, phone, lead ID…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select aria-label="Filter by status" value={status} onChange={handleStatusChange}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{labelize(s)}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lead ID</th><th>Customer</th><th>Company</th><th>Phone</th>
                <th>Source</th><th>Status</th><th>Created</th><th></th>
              </tr>
            </thead>
            <tbody>
              {leadsPage === null && !error && (
                <tr><td colSpan="8" className="muted">Loading leads…</td></tr>
              )}
              {leadsPage !== null && leads.length === 0 && (
                <tr><td colSpan="8" className="muted">No leads found. Use “+ Add Lead” to create one.</td></tr>
              )}
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.leadCode}</td>
                  <td>{lead.customerName}</td>
                  <td>{lead.companyName || "-"}</td>
                  <td>{lead.phone}</td>
                  <td>{labelize(lead.source)}</td>
                  <td><StatusBadge status={lead.status} /></td>
                  <td>{formatDate(lead.createdAt)}</td>
                  <td><Link to={`/leads/${lead.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button type="button" className="btn btn-secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="muted">Page {page + 1} of {totalPages} ({leadsPage.totalElements} leads)</span>
            <button type="button" className="btn btn-secondary" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
