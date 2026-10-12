import { useState } from "react";
import Photo from "./Photo.jsx";

/**
 * Google-Form style "choice with pictures". Each option is a card: picture on top, a radio (single)
 * or checkbox (multi) and the label. Pictures are fixed per option:
 *   option.src   -> exact URL (e.g. /building-types/clear-span.jpeg)
 *   option.photo -> file name(s) in /public/diagrams
 * Options with neither (e.g. "Others", "Not Required") render as a compact text card.
 * Choosing "OTHER" reveals a text box (onOther / otherValue).
 */
export default function OptionCards({ legend, name, options, value, onChange, multi = false, required, otherValue = "", onOther, exclusive, hint }) {
  const [zoom, setZoom] = useState(null);
  const picked = multi ? (value || []) : [value];
  const isOn = (v) => picked.includes(v);

  function choose(v) {
    if (!multi) return onChange(v);
    let next = isOn(v) ? picked.filter((x) => x !== v) : [...picked, v];
    // "Not Required" cancels the other choices, and any other choice cancels "Not Required"
    if (exclusive && v === exclusive && !isOn(v)) next = [v];
    else if (exclusive && v !== exclusive) next = next.filter((x) => x !== exclusive);
    onChange(next);
  }
  const Pic = ({ o }) => (o.src
    ? <img src={o.src} alt={o.label} className="image-radio-photo" />
    : <Photo name={o.photo} alt={o.label} className="image-radio-photo" />);
  const hasPic = (o) => !!(o.src || o.photo);
  const needOther = picked.includes("OTHER");

  return (
    <fieldset className="image-radio-group">
      <legend>{legend}{required ? " *" : ""}</legend>
      {hint && <p className="muted" style={{ marginTop: -4 }}>{hint}</p>}
      <div className="image-radio-options">
        {options.map((o) => (
          <div key={o.value} className={"image-radio-wrap" + (!hasPic(o) && o.value === "NOT_REQUIRED" ? " compact" : "")}>
            <label className={"image-radio-card" + (isOn(o.value) ? " selected" : "") + (hasPic(o) ? "" : " no-pic")}>
              {hasPic(o) && <span className="image-radio-icon"><Pic o={o} /></span>}
              <span className="image-radio-foot">
                <input type={multi ? "checkbox" : "radio"} name={name} value={o.value} checked={isOn(o.value)}
                  onChange={() => choose(o.value)} required={required && !multi} />
                <span className="image-radio-label">{o.label}</span>
              </span>
            </label>
            {/* outside the <label>, so clicking the card selects it and only the magnifier zooms */}
            {hasPic(o) && (
              <button type="button" className="image-zoom" title="View larger" aria-label={`View ${o.label} larger`} onClick={() => setZoom(o)}>&#x1F50D;</button>
            )}
          </div>
        ))}
      </div>
      {needOther && onOther && (
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor={`${name}-other`}>Other – please specify</label>
          <input id={`${name}-other`} value={otherValue} onChange={(e) => onOther(e.target.value)} required />
        </div>
      )}
      {zoom && (
        <div className="image-lightbox" onClick={() => setZoom(null)} role="dialog" aria-modal="true">
          <div className="image-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-lightbox-close" aria-label="Close" onClick={() => setZoom(null)}>&times;</button>
            <Pic o={zoom} />
            <div className="image-lightbox-title">{zoom.label}</div>
          </div>
        </div>
      )}
    </fieldset>
  );
}
