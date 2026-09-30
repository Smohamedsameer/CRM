import { useState } from "react";
import BuildingIcon from "./BuildingIcons.jsx";

/**
 * A set of single-select option cards: a large picture on top, then a visible radio button and the
 * label. The magnifier button opens the picture full-size so the text inside it is readable.
 * `options` is [{ value, label }]; the picture shown for each option is looked up by `value`.
 */
export default function ImageRadioGroup({ legend, name, options, value, onChange, required }) {
  const [zoom, setZoom] = useState(null);

  return (
    <fieldset className="image-radio-group">
      <legend>{legend}{required ? " *" : ""}</legend>
      <div className="image-radio-options">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label key={opt.value} className={"image-radio-card" + (selected ? " selected" : "")}>
              <span className="image-radio-icon">
                <BuildingIcon type={opt.value} size={110} />
                <button
                  type="button"
                  className="image-zoom"
                  title="View larger"
                  aria-label={`View ${opt.label} larger`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setZoom(opt); }}
                >
                  &#x1F50D;
                </button>
              </span>
              <span className="image-radio-foot">
                <input
                  type="radio"
                  name={name}
                  value={opt.value}
                  checked={selected}
                  onChange={(e) => onChange(e.target.value)}
                  required={required}
                />
                <span className="image-radio-label">{opt.label}</span>
              </span>
            </label>
          );
        })}
      </div>

      {zoom && (
        <div className="image-lightbox" onClick={() => setZoom(null)} role="dialog" aria-modal="true">
          <div className="image-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-lightbox-close" aria-label="Close" onClick={() => setZoom(null)}>&times;</button>
            <BuildingIcon type={zoom.value} size={320} />
            <div className="image-lightbox-title">{zoom.label}</div>
          </div>
        </div>
      )}
    </fieldset>
  );
}
