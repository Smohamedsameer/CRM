/** A labeled set of radio buttons. `options` is [{ value, label }]. */
export default function RadioGroup({ legend, name, options, value, onChange, required, error }) {
  return (
    <fieldset className={"radio-group" + (error ? " has-error" : "")} data-field={name} aria-invalid={error ? true : undefined}>
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
      {error && <p className="field-error" role="alert">{error}</p>}
    </fieldset>
  );
}
