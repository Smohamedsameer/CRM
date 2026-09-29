import BuildingIcon from "./BuildingIcons.jsx";

/**
 * A set of single-select option cards, each showing an icon above its label — matching the
 * company's original PEB request-form ("Type of Building", "Roofing and Cladding Requirement").
 * `options` is [{ value, label }]; the icon shown for each option is looked up by `value`.
 */
export default function ImageRadioGroup({ legend, name, options, value, onChange, required }) {
  return (
    <fieldset className="image-radio-group">
      <legend>{legend}{required ? " *" : ""}</legend>
      <div className="image-radio-options">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label key={opt.value} className={"image-radio-card" + (selected ? " selected" : "")}>
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={(e) => onChange(e.target.value)}
                required={required}
              />
              <span className="image-radio-icon"><BuildingIcon type={opt.value} /></span>
              <span className="image-radio-label">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
