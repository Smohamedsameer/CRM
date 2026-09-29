/** A labeled set of checkboxes for multi-select options. `options` is [{ value, label }];
 * `values` is an array of currently-checked values. */
export default function CheckboxGroup({ legend, options, values, onChange, required }) {
  function toggle(value) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  return (
    <fieldset className="radio-group">
      <legend>{legend}{required ? " *" : ""}</legend>
      <div className="checkbox-options">
        {options.map((opt) => (
          <label key={opt.value} className="checkbox-option">
            <input
              type="checkbox"
              checked={values.includes(opt.value)}
              onChange={() => toggle(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
