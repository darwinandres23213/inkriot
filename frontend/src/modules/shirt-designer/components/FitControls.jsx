import { BODY_MODELS, SHIRT_SIZES } from '../helpers/fitOptions.js';

function FitOptions({ legend, name, options, value, onChange }) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="designer-fit-options">
        {options.map((option) => (
          <label key={option}>
            <input type="radio" name={name} value={option} checked={option === value}
              onChange={() => onChange(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function FitControls({ fit, onChange }) {
  return (
    <div className="designer-fit">
      <FitOptions legend="Modelo" name="shirt-model" options={BODY_MODELS} value={fit.model}
        onChange={(model) => onChange({ ...fit, model })} />
      <FitOptions legend="Talla" name="shirt-size" options={SHIRT_SIZES} value={fit.size}
        onChange={(size) => onChange({ ...fit, size })} />
    </div>
  );
}
