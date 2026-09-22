/** A labeled set of radio buttons. `options` is [{ value, label }]. */
export default function RadioGroup({ legend, name, options, value, onChange, required }) {
  return (
    <fieldset className="radio-group">
      <legend>{legend}{required ? " *" : ""}</legend>
      <div className="radio-options">
        {options.map((opt) => (
          <label key={opt.value} className="radio-option">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange(e.target.value)}
              required={required}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
