function CellInput({ value, onChange, invalid }) {
  return (
    <input
      className={`table-input ${invalid ? 'table-input--error' : ''}`}
      type="number"
      min="0"
      value={value}
      onChange={event => onChange(Math.max(0, Number(event.target.value) || 0))}
    />
  );
}

export default function MatrixTable({
  title,
  description,
  matrixKey,
  rows,
  cols,
  data,
  editable = false,
  onChange,
  activeProcess,
  updatedCells,
  invalidCells,
  badgeLabel = 'Matrix',
  badgeTone = 'neutral',
}) {
  const updatedCellSet = new Set(updatedCells);
  const invalidCellSet = new Set(invalidCells);

  return (
    <section className="table-card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{editable ? 'Input Matrix' : 'Derived Output'}</p>
          <h2>{title}</h2>
        </div>
        <span className={`mini-pill mini-pill--${badgeTone}`}>{badgeLabel}</span>
      </div>
      <p className="table-description">{description}</p>

      <div className="table-shell">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="matrix-table__stub">Process</th>
              {Array.from({ length: cols }, (_, columnIndex) => (
                <th key={`${matrixKey}-header-${columnIndex}`}>R{columnIndex}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, rowIndex) => {
              const isActiveRow = rowIndex === activeProcess;

              return (
                <tr
                  key={`${matrixKey}-row-${rowIndex}`}
                  className={[
                    'matrix-table__row',
                    isActiveRow ? 'matrix-table__row--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <td className="matrix-table__label">P{rowIndex}</td>
                  {Array.from({ length: cols }, (_, columnIndex) => {
                    const cellKey = `${matrixKey}-${rowIndex}-${columnIndex}`;
                    const isUpdated = updatedCellSet.has(cellKey);
                    const isInvalid = invalidCellSet.has(cellKey);

                    return (
                      <td
                        key={cellKey}
                        className={[
                          'matrix-table__cell',
                          isUpdated ? 'matrix-table__cell--updated' : '',
                          isInvalid ? 'matrix-table__cell--error' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {editable ? (
                          <CellInput
                            value={data[rowIndex][columnIndex]}
                            invalid={isInvalid}
                            onChange={value => onChange(rowIndex, columnIndex, value)}
                          />
                        ) : (
                          <span className="matrix-table__value">{data[rowIndex][columnIndex]}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
