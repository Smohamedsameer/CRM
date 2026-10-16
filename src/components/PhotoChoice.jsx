import Photo from "./Photo.jsx";

const YES_NO = [["yes", "Yes"], ["no", "No"]];

/** Picture card with a Yes / No choice (or Yes / No / Other when `withOther`). Gold border when "Yes" is
 * selected; `children` (the follow-up questions) are shown for Yes (and Other). Clicking the picture toggles Yes/No. */
export default function PhotoChoice({ name, image, title, value, onChange, children, withOther = false, required = false, error }) {
  const yes = value === "yes";
  const options = withOther ? [...YES_NO, ["other", "Other"]] : YES_NO;
  return (
    <div className={"photo-choice" + (yes ? " selected" : "") + (error ? " has-error" : "")} data-field={name}>
      <div className="photo-choice-img" onClick={() => onChange(yes ? "no" : "yes")}>
        <Photo name={image} alt={title} />
      </div>
      <div className="photo-choice-body">
        <strong>{title}{required ? " *" : ""}</strong>
        <div className="radio-options">
          {options.map(([v, l]) => (
            <label key={v} className="radio-option">
              <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} required={required} />
              <span>{l}</span>
            </label>
          ))}
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        {(yes || (withOther && value === "other")) && children}
      </div>
    </div>
  );
}
