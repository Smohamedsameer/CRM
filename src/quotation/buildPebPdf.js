import React from "react";
import { createRoot } from "react-dom/client";
import { PebDoc } from "./PebDoc.jsx";

/**
 * Renders the full PEB quotation off-screen and returns it as a PDF Blob (A4, one image per page).
 * html2canvas / jsPDF are loaded on demand so they do not slow down the rest of the app.
 */
export async function buildPebPdf(d, logo) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const host = document.createElement("div");
  host.id = "pq-export";
  host.className = "pq-host";
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const box = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("The quotation layout took too long to prepare.")), 30000);
      root.render(React.createElement(PebDoc, { d, logo, onReady: (el) => { clearTimeout(timer); resolve(el); } }));
    });
    const pages = [...box.querySelectorAll(".page")];
    const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2, useCORS: true, backgroundColor: "#fff", scrollX: 0, scrollY: 0, logging: false,
        onclone: (cd) => {
          const e = cd.getElementById("pq-export");
          if (e) e.style.left = "0";
          // keep reference / attachment pictures exactly inside their frame (html2canvas stretches object-fit images)
          cd.querySelectorAll(".attachment-page img.attimg, .attachment-page .refcell img").forEach((img) => {
            if (!img.naturalWidth || !img.naturalHeight) return;
            const wrap = img.parentElement;
            const cs = getComputedStyle(wrap);
            const bw = wrap.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
            let bh = wrap.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
            if (img.classList.contains("refcap")) return;
            if (wrap.classList.contains("refcell")) bh -= 30; // room for the caption
            const r = img.naturalWidth / img.naturalHeight;
            let w = bw, hh = w / r;
            if (hh > bh) { hh = bh; w = hh * r; }
            img.style.cssText += `;width:${Math.round(w)}px;height:${Math.round(hh)}px;object-fit:fill;max-width:none;max-height:none;flex:none;align-self:center`;
          });
        },
      });
      if (i) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.93), "JPEG", 0, 0, 595.28, 841.89);
    }
    return pdf.output("blob");
  } finally {
    root.unmount();
    host.remove();
  }
}
