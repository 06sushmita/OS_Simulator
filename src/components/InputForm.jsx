import NumInput from './NumInput';
import MatrixInput from './MatrixInput';
import { PRESETS } from '../deadlockEngine';

export default function InputForm({
  n, m, alloc, request, avail,
  setN, setM, setAlloc, setRequest, setAvail,
  onDetect, onReset, onLoadPreset,
  errors, deadlocked,
}) {
  const setAllocCell   = (i, j, v) => { const a = alloc.map(r => [...r]);   a[i][j] = v; setAlloc(a); };
  const setRequestCell = (i, j, v) => { const a = request.map(r => [...r]); a[i][j] = v; setRequest(a); };
  const setAvailItem   = (j, v)    => { const a = [...avail]; a[j] = v; setAvail(a); };

  return (
    <div className="card">
      {/* ── Top bar: config + presets ── */}
      <div
        className="row mb14"
        style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div className="col gap8">
          <h2 style={{ marginBottom: 0 }}>System configuration</h2>
          <div className="row gap14">
            <div className="row gap8">
              <span className="muted">Processes (n)</span>
              <NumInput val={n} min={1} max={8} onChange={v => onLoadPreset(null, v, m)} />
            </div>
            <div className="row gap8">
              <span className="muted">Resource types (m)</span>
              <NumInput val={m} min={1} max={6} onChange={v => onLoadPreset(null, n, v)} />
            </div>
          </div>
        </div>

        <div className="col gap8" style={{ alignItems: 'flex-end' }}>
          <h2 style={{ marginBottom: 0 }}>Load preset</h2>
          <div className="row gap8">
            {Object.entries(PRESETS).map(([key, pr]) => (
              <button key={key} className="btn btn-preset" onClick={() => onLoadPreset(key)}>
                {pr.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Matrices ── */}
      <div className="row gap20 mb14" style={{ alignItems: 'flex-start' }}>
        <MatrixInput
          label="Allocation matrix"
          rows={n} cols={m}
          data={alloc}
          onChange={setAllocCell}
        />
        <MatrixInput
          label="Request matrix"
          rows={n} cols={m}
          data={request}
          onChange={setRequestCell}
          highlightRows={deadlocked}
        />
      </div>

      {/* ── Available ── */}
      <div className="mb14">
        <h2>Available resources</h2>
        <div className="row gap8">
          {Array.from({ length: m }, (_, j) => (
            <div key={j} className="col" style={{ alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>R{j}</span>
              <NumInput val={avail[j]} onChange={v => setAvailItem(j, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Validation errors ── */}
      {errors.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {errors.map((err, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--red-400)' }}>
              Error: {err}
            </div>
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="row gap8">
        <button className="btn btn-detect" onClick={onDetect}>
          Detect Deadlock
        </button>
        <button className="btn btn-reset" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
