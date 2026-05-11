import { useState } from 'react';
import { recoverByTermination, recoverByPreemption } from '../deadlockEngine';

export default function RecoveryPanel({ result, n, m, alloc, request, avail }) {
  const [method, setMethod]     = useState('terminate');
  const [priority, setPriority] = useState('leastWork');
  const [steps, setSteps]       = useState(null);
  const [ran, setRan]           = useState(false);

  if (!result || result.deadlocked.length === 0) return null;

  const run = () => {
    const s =
      method === 'terminate'
        ? recoverByTermination(n, m, alloc, request, avail, result.deadlocked, priority)
        : recoverByPreemption(n, m, alloc, request, avail, result.deadlocked);
    setSteps(s);
    setRan(true);
  };

  return (
    <div className="card">
      <h2>Recovery</h2>

      <div className="row mb14 gap14">
        {/* Method selector */}
        <div className="row gap8">
          <span className="muted">Method</span>
          <select value={method} onChange={e => { setMethod(e.target.value); setRan(false); }}>
            <option value="terminate">Process termination</option>
            <option value="preempt">Resource preemption</option>
          </select>
        </div>

        {/* Order selector (termination only) */}
        {method === 'terminate' && (
          <div className="row gap8">
            <span className="muted">Order</span>
            <select value={priority} onChange={e => { setPriority(e.target.value); setRan(false); }}>
              <option value="leastWork">Least resources held first</option>
              <option value="priority">Process order (P0 first)</option>
            </select>
          </div>
        )}

        <button className="btn btn-recover" onClick={run}>Run Recovery</button>
      </div>

      {/* Method description */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '0.5px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        fontSize: 12,
        color: 'var(--text-muted)',
        marginBottom: 12,
      }}>
        {method === 'terminate'
          ? 'Termination: abort deadlocked processes one by one (releasing their resources) until the system reaches a safe state.'
          : 'Preemption: forcibly reclaim resources from a victim process and reallocate them to unblock the cycle.'}
      </div>

      {/* Steps */}
      {ran && steps && (
        <>
          <h2>{method === 'terminate' ? 'Termination steps' : 'Preemption steps'}</h2>
          <div className="log-list">
            {steps.map((s, i) =>
              s.resolved ? (
                <div key={i} className="log-row">
                  <span className="log-step" />
                  <span className="log-ok">
                    Deadlock resolved — system is now in a safe state.
                  </span>
                </div>
              ) : method === 'terminate' ? (
                <div key={i} className="log-row">
                  <span className="log-step">{i + 1}</span>
                  <span>
                    <span className="log-warn">Terminate P{s.proc}</span>
                    <span className="muted" style={{ marginLeft: 8 }}>
                      freed [{s.freed.join(', ')}] → available now [{s.availAfter.join(', ')}]
                    </span>
                  </span>
                </div>
              ) : (
                <div key={i} className="log-row">
                  <span className="log-step">{i + 1}</span>
                  <span>
                    <span className="log-warn">Preempt from P{s.proc}</span>
                    <span className="muted" style={{ marginLeft: 8 }}>
                      reclaimed [{s.preempted.join(', ')}] → available now [{s.availAfter.join(', ')}]
                    </span>
                  </span>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
