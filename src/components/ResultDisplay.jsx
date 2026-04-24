import WFGCanvas from './WFGCanvas';

export default function ResultDisplay({ result, n, m }) {
  if (!result) return null;
  const { deadlocked, seq, log, wfg } = result;
  const hasDeadlock = deadlocked.length > 0;

  return (
    <div className="card">
      {/* ── Status banner ── */}
      <div className="row mb14">
        <span className={`badge ${hasDeadlock ? 'badge-red' : 'badge-green'}`}>
          {hasDeadlock ? 'Deadlock Detected' : 'No Deadlock — System is Safe'}
        </span>
        {hasDeadlock && (
          <span style={{ fontSize: 13 }}>
            Stuck:&nbsp;
            {deadlocked.map(p => (
              <span key={p} className="chip chip-red">P{p}</span>
            ))}
          </span>
        )}
      </div>

      {seq.length > 0 && (
        <div className="row mb14">
          <span className="muted">Completed:</span>
          {seq.map(p => (
            <span key={p} className="chip chip-teal">P{p}</span>
          ))}
        </div>
      )}

      <hr className="divider" />

      {/* ── Detection log + WFG side by side ── */}
      <div className="row gap20" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Log */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2>Detection log</h2>
          <div className="log-list">
            {log.map((entry, i) => (
              <div key={i} className="log-row">
                <span className="log-step">{i + 1}</span>
                <span className={`log-${entry.type}`}>{entry.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WFG */}
        <div>
          <h2>Wait-for graph</h2>
          <WFGCanvas n={n} edges={wfg} deadlocked={deadlocked} />
          <div className="row" style={{ marginTop: 8, gap: 12, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: 'var(--red-50)', border: '1.5px solid var(--red-400)',
                display: 'inline-block'
              }} />
              <span className="muted">deadlocked</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: 'var(--teal-50)', border: '1px solid var(--teal-400)',
                display: 'inline-block'
              }} />
              <span className="muted">running</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Need / allocation summary table ── */}
      {hasDeadlock && (
        <>
          <hr className="divider" />
          <h2>Deadlocked process requests</h2>
          <table>
            <thead>
              <tr>
                <th style={{ border: 'none', background: 'transparent' }} />
                {Array.from({ length: m }, (_, j) => <th key={j}>R{j}</th>)}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deadlocked.map(p => (
                <tr key={p}>
                  <td className="td-label">P{p}</td>
                  {result.rawRequest[p].map((v, j) => (
                    <td key={j} className="td-highlight">{v}</td>
                  ))}
                  <td>
                    <span className="badge badge-red" style={{ fontSize: 11, padding: '1px 7px' }}>
                      blocked
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
