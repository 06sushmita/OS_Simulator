export default function NumInput({ val, onChange, min = 0, max = 99, width = 50 }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={val}
      style={{ width }}
      onChange={e => onChange(Math.max(min, parseInt(e.target.value) || 0))}
    />
  );
}
