function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  error = false,
  compact = false,
}) {
  return (
    <label className={`field ${compact ? 'field--compact' : ''}`} htmlFor={id}>
      <span className="field__label">{label}</span>
      <input
        id={id}
        className={`field__input ${error ? 'field__input--error' : ''}`}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={event => onChange(Math.max(min, Number(event.target.value) || 0))}
      />
    </label>
  );
}

export default function InputPanel({
  n,
  m,
  available,
  requestProcess,
  requestVector,
  validation,
  requestResult,
  onProcessCountChange,
  onResourceCountChange,
  onAvailableChange,
  onRequestProcessChange,
  onRequestChange,
  onRun,
  onCheckRequest,
  onReset,
}) {
  const hasValidationErrors = validation.messages.length > 0;
  const requestIsEmpty = requestVector.every(value => value === 0);

  return (
    <div className="panel-stack">
      <section className="panel-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Input Controls</p>
            <h2>System Configuration</h2>
          </div>
          <span className="mini-pill">Resizable</span>
        </div>

        <div className="field-grid">
          <NumberField
            id="process-count"
            label="Processes (n)"
            value={n}
            min={1}
            max={8}
            error={validation.configErrors.n}
            onChange={onProcessCountChange}
          />
          <NumberField
            id="resource-count"
            label="Resource Types (m)"
            value={m}
            min={1}
            max={6}
            error={validation.configErrors.m}
            onChange={onResourceCountChange}
          />
        </div>

        <p className="helper-text">
          Adjust dimensions to resize the matrices while preserving existing values where
          possible.
        </p>
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Resource Vector</p>
            <h2>Available Resources</h2>
          </div>
        </div>

        <div className="vector-grid">
          {available.map((value, resourceIndex) => (
            <NumberField
              key={`available-${resourceIndex}`}
              id={`available-${resourceIndex}`}
              label={`R${resourceIndex}`}
              value={value}
              compact
              error={validation.availableErrors.includes(resourceIndex)}
              onChange={nextValue => onAvailableChange(resourceIndex, nextValue)}
            />
          ))}
        </div>

        <p className="helper-text">
          This is the current Work vector used as the starting point for the safety check.
        </p>
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Request Validation</p>
            <h2>Resource Request</h2>
          </div>
        </div>

        <label className="field" htmlFor="request-process">
          <span className="field__label">Requesting Process</span>
          <select
            id="request-process"
            className={`field__select ${
              validation.configErrors.requestProcess ? 'field__input--error' : ''
            }`}
            value={requestProcess}
            onChange={event => onRequestProcessChange(Number(event.target.value))}
          >
            {Array.from({ length: n }, (_, processIndex) => (
              <option key={processIndex} value={processIndex}>
                P{processIndex}
              </option>
            ))}
          </select>
        </label>

        <div className="vector-grid">
          {requestVector.map((value, resourceIndex) => (
            <NumberField
              key={`request-${resourceIndex}`}
              id={`request-${resourceIndex}`}
              label={`R${resourceIndex}`}
              value={value}
              compact
              error={validation.requestErrors.includes(resourceIndex)}
              onChange={nextValue => onRequestChange(resourceIndex, nextValue)}
            />
          ))}
        </div>

        <p
          className={`inline-status ${
            requestResult
              ? requestResult.granted
                ? 'inline-status--success'
                : 'inline-status--error'
              : ''
          }`}
        >
          {requestResult
            ? requestResult.message
            : 'Enter a request vector and use Check Request to test whether it can be granted safely.'}
        </p>
      </section>

      <section className="panel-card panel-card--compact">
        <div className="action-row">
          <button
            type="button"
            className="button button--primary"
            disabled={hasValidationErrors}
            onClick={onRun}
          >
            Run Algorithm
          </button>
          <button
            type="button"
            className="button button--secondary"
            disabled={hasValidationErrors || requestIsEmpty}
            onClick={onCheckRequest}
          >
            Check Request
          </button>
          <button type="button" className="button button--ghost" onClick={onReset}>
            Reset
          </button>
        </div>

        <div className="validation-list">
          {validation.messages.length > 0 ? (
            validation.messages.map(message => (
              <p key={message} className="validation-list__item">
                {message}
              </p>
            ))
          ) : (
            <p className="validation-list__item validation-list__item--ok">
              Inputs are valid and ready for simulation.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
