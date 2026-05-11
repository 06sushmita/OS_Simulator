import NumInput from './NumInput';

export default function MatrixInput({ label, rows, cols, data, onChange, highlightRows = [] }) {
  return (
    <div className="mb10">
      <h2>{label}</h2>
      <table>
        <thead>
          <tr>
            <th style={{ border: 'none', background: 'transparent', width: 32 }} />
            {Array.from({ length: cols }, (_, j) => (
              <th key={j}>R{j}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              <td className="td-label">P{i}</td>
              {Array.from({ length: cols }, (_, j) => (
                <td
                  key={j}
                  className={highlightRows.includes(i) ? 'td-highlight' : ''}
                  style={{ padding: '3px 4px' }}
                >
                  <NumInput val={data[i][j]} onChange={v => onChange(i, j, v)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
