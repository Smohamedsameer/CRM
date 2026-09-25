import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteDocument, getDocumentContent, getDocuments, uploadDocument } from "../api/index.js";
import Alert from "../components/Alert.jsx";
import { ChevronDownIcon } from "../components/Icons.jsx";
import { formatDateTime } from "../utils/format.js";

/** The four sections on the page and the documents listed under each. */
const SECTIONS = [
  {
    title: "Company Documents",
    items: [
      "GST Certificate", "PAN", "MSME / Udyam Certificate", "Company Registration Certificate",
      "Trade License", "ISO Certificate", "Company Profile",
    ],
  },
  {
    title: "Construction / Project Documents",
    items: [
      "Work Order", "Purchase Order", "Agreement", "Approved Drawings", "Structural Drawings",
      "Architectural Drawings", "BOQ", "Material Specifications", "Inspection Reports",
    ],
  },
  {
    title: "Quality & Material Certificates",
    items: [
      "Material Test Certificates (MTC)", "Steel Mill Test Certificate", "Welding Certificates",
      "Paint/Coating Test Certificate", "Quality Inspection Certificate", "Product Warranty Certificates",
    ],
  },
  {
    title: "Safety Documents",
    items: [
      "Safety Certificates", "Worker Training Certificates", "Insurance Documents",
      "Safety Inspection Reports", "PPE Compliance Records",
    ],
  },
];

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx";
const TYPE_BY_EXT = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const keyOf = (category, docType) => `${category}::${docType}`;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function base64ToBlobUrl(base64, contentType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: contentType }));
}

/** Popup that previews a document's files (PDF / image inline; Word & Excel as a download). */
function DocumentViewer({ category, docType, files, onClose, onDeleted }) {
  const [selectedId, setSelectedId] = useState(files[0]?.id ?? null);
  const [preview, setPreview] = useState(null); // { url, contentType, fileName }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!files.some((f) => f.id === selectedId)) setSelectedId(files[0]?.id ?? null);
  }, [files, selectedId]);

  useEffect(() => {
    if (selectedId == null) { setPreview(null); return undefined; }
    let url = null;
    let cancelled = false;
    setLoading(true);
    setError("");
    getDocumentContent(selectedId)
      .then((doc) => {
        if (cancelled) return;
        url = base64ToBlobUrl(doc.dataBase64, doc.contentType);
        setPreview({ url, contentType: doc.contentType, fileName: doc.fileName });
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [selectedId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleDelete(file) {
    if (!window.confirm(`Delete "${file.fileName}"? This cannot be undone.`)) return;
    try {
      await deleteDocument(file.id);
      onDeleted(file.id);
    } catch (err) {
      setError(err.message);
    }
  }

  const selected = files.find((f) => f.id === selectedId);
  const isPdf = preview?.contentType === "application/pdf";
  const isImage = preview?.contentType?.startsWith("image/");

  return (
    <div className="doc-modal-backdrop" onClick={onClose}>
      <div className="doc-modal" role="dialog" aria-modal="true" aria-label={docType} onClick={(e) => e.stopPropagation()}>
        <div className="doc-modal-header">
          <div>
            <div className="muted doc-modal-category">{category}</div>
            <h3>{docType}</h3>
          </div>
          <button type="button" className="doc-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {files.length > 1 && (
          <div className="doc-file-tabs">
            {files.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`doc-file-tab${f.id === selectedId ? " active" : ""}`}
                onClick={() => setSelectedId(f.id)}
              >
                {f.fileName}
              </button>
            ))}
          </div>
        )}

        <Alert>{error}</Alert>

        <div className="doc-preview">
          {files.length === 0 && <p className="muted">No files uploaded for this document yet.</p>}
          {loading && <p className="muted">Loading…</p>}
          {!loading && preview && isPdf && <iframe title={preview.fileName} src={preview.url} />}
          {!loading && preview && isImage && <img src={preview.url} alt={preview.fileName} />}
          {!loading && preview && !isPdf && !isImage && (
            <div className="doc-preview-fallback">
              <p>This file type can't be previewed in the browser.</p>
              <a className="btn btn-primary btn-sm" href={preview.url} download={preview.fileName}>Download {preview.fileName}</a>
            </div>
          )}
        </div>

        {selected && (
          <div className="doc-modal-footer">
            <span className="muted">
              {selected.fileName} · {formatSize(selected.sizeBytes)} · Uploaded {formatDateTime(selected.uploadedAt)}
            </span>
            <div className="table-row-actions">
              {preview && (
                <>
                  <a className="btn btn-secondary btn-sm" href={preview.url} target="_blank" rel="noreferrer">Open in new tab</a>
                  <a className="btn btn-secondary btn-sm" href={preview.url} download={preview.fileName}>Download</a>
                </>
              )}
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(selected)}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** One document row inside a section: name, upload status, View and Upload buttons. */
function DocumentRow({ category, docType, files, onView, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const contentType = TYPE_BY_EXT[ext];
    if (!contentType) { setError("Upload a PDF, JPG, PNG, WEBP, Word or Excel file."); return; }
    if (file.size > MAX_BYTES) { setError("Files must be 10 MB or smaller."); return; }
    setError("");
    setUploading(true);
    try {
      const dataBase64 = await readAsBase64(file);
      const saved = await uploadDocument({ category, docType, fileName: file.name, contentType, dataBase64 });
      onUploaded(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <li className="doc-row">
      <div className="doc-row-main">
        <span className="doc-row-name">{docType}</span>
        {files.length > 0
          ? <span className="badge success">{files.length} file{files.length > 1 ? "s" : ""}</span>
          : <span className="badge doc-badge-empty">Not uploaded</span>}
      </div>
      <div className="table-row-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled={files.length === 0} onClick={onView}>
          View
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={handleFile} />
      </div>
      {error && <div className="doc-row-error">{error}</div>}
    </li>
  );
}

/** Certificates & Documents: four collapsible sections; each document can be uploaded and viewed. */
export default function Documents() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(() => new Set([SECTIONS[0].title]));
  const [viewing, setViewing] = useState(null); // { category, docType }

  const load = useCallback(() => {
    getDocuments().then(setDocs).catch((err) => setError(err.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const byType = useMemo(() => {
    const map = new Map();
    (docs || []).forEach((d) => {
      const k = keyOf(d.category, d.docType);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(d);
    });
    return map;
  }, [docs]);

  const filesFor = (category, docType) => byType.get(keyOf(category, docType)) || [];

  function toggle(title) {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  }

  return (
    <div className="container">
      <h2>Certificates &amp; Documents</h2>
      <Alert>{error}</Alert>
      {docs === null && !error && <p className="muted">Loading…</p>}

      {SECTIONS.map((section, idx) => {
        const isOpen = open.has(section.title);
        const uploaded = section.items.filter((name) => filesFor(section.title, name).length > 0).length;
        return (
          <div key={section.title} className="card doc-section">
            <button
              type="button"
              className="doc-section-header"
              aria-expanded={isOpen}
              onClick={() => toggle(section.title)}
            >
              <span className="doc-section-title">
                <span className="doc-section-num">{idx + 1}</span>
                {section.title}
              </span>
              <span className="doc-section-meta">
                <span className="muted">{uploaded} / {section.items.length} uploaded</span>
                <span className={`doc-chevron${isOpen ? " open" : ""}`}><ChevronDownIcon /></span>
              </span>
            </button>

            {isOpen && (
              <ul className="doc-list">
                {section.items.map((name) => (
                  <DocumentRow
                    key={name}
                    category={section.title}
                    docType={name}
                    files={filesFor(section.title, name)}
                    onView={() => setViewing({ category: section.title, docType: name })}
                    onUploaded={(saved) => setDocs((list) => [saved, ...(list || [])])}
                  />
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {viewing && (
        <DocumentViewer
          category={viewing.category}
          docType={viewing.docType}
          files={filesFor(viewing.category, viewing.docType)}
          onClose={() => setViewing(null)}
          onDeleted={(id) => setDocs((list) => list.filter((d) => d.id !== id))}
        />
      )}
    </div>
  );
}
