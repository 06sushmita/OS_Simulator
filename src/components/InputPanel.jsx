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

function GuideStep({ index, title, copy }) {
  return (
    <div className="guide-step">
      <span className="guide-step__index">{index}</span>
      <div>
        <p className="guide-step__title">{title}</p>
        <p className="guide-step__copy">{copy}</p>
      </div>
    </div>
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
      <section className="panel-card panel-card--input">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Input Workspace</p>
            <h2>Simulation Controls</h2>
          </div>
          <span className="mini-pill mini-pill--input">Editable</span>
        </div>

        <div className="guide-stack">
          <GuideStep
            index="1"
            title="Set the size of the system"
            copy="Choose how many processes and resource types your example should contain."
          />
          <GuideStep
            index="2"
            title="Fill the matrices and vectors"
            copy="Allocation and Max are your inputs. Available and Request define the current snapshot."
          />
          <GuideStep
            index="3"
            title="Run the narrated simulation"
            copy="The simulator will explain every check in order, including blocked processes."
          />
        </div>
      </section>

      <section className="panel-card panel-card--input">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Configuration</p>
            <h2>System Dimensions</h2>
          </div>
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
          Resizing keeps existing values where possible, so you can iterate on examples quickly.
        </p>
      </section>

      <section className="panel-card panel-card--input">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Input Vector</p>
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
          This vector becomes the initial Work value when the safety simulation begins.
        </p>
      </section>

      <section className="panel-card panel-card--input">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Input Vector</p>
            <h2>Request Check</h2>
          </div>
          <span className="mini-pill">Optional</span>
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
            : 'Use this section to test whether a new request can be granted without breaking safety.'}
        </p>
      </section>

      <section className="panel-card panel-card--compact panel-card--input">
        <div className="action-row">
          <button
            type="button"
            className="button button--primary"
            disabled={hasValidationErrors}
            onClick={onRun}
          >
            Run Simulation
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
            Load Demo
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
              Inputs are valid and ready for a step-by-step simulation.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
