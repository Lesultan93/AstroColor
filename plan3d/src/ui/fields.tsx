import { useEffect, useState } from 'react';

const show = (v: number, digits: number) => v.toFixed(digits).replace('.', ',');

/** Champ numérique acceptant la virgule décimale ; valide sur Entrée ou perte de focus. */
export function NumberField({
  label,
  value,
  onChange,
  unit = 'm',
  digits = 2,
  min,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  digits?: number;
  min?: number;
  step?: number;
}) {
  const [text, setText] = useState(show(value, digits));
  useEffect(() => setText(show(value, digits)), [value, digits]);

  const commit = () => {
    const v = Number(text.replace(',', '.').trim());
    if (!Number.isFinite(v) || (min !== undefined && v < min)) {
      setText(show(value, digits));
      return;
    }
    if (Math.abs(v - value) > 1e-9) onChange(v);
  };

  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-unit">
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              const next = value + (e.key === 'ArrowUp' ? step : -step);
              if (min === undefined || next >= min) onChange(Math.round(next * 1000) / 1000);
            }
          }}
        />
        {unit && <em>{unit}</em>}
      </span>
    </label>
  );
}

export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== value && onChange(text)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
