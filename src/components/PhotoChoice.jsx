import Photo from "./Photo.jsx";

/** Picture card with a Yes / No choice. Gold border when "Yes" is selected; `children` (the follow-up
 * questions) are shown only when Yes. Clicking the picture toggles Yes/No. */
export default function PhotoChoice({ name, image, title, value, onChange, children }) {
  const yes = value === "yes";
  return (
    <div className={"photo-choice" + (yes ? " selected" : "")}>
      <div className="photo-choice-img" onClick={() => onChange(yes ? "no" : "yes")}>
        <Photo name={image} alt={title} />
      </div>
      <div className="photo-choice-body">
        <strong>{title}</strong>
        <div className="radio-options">
          {[["yes", "Yes"], ["no", "No"]].map(([v, l]) => (
            <label key={v} className="radio-option">
              <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
              <span>{l}</span>
            </label>
          ))}
        </div>
        {yes && children}
      </div>
    </div>
  );
}
