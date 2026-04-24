// ─── Deadlock Detection (Resource-Allocation Graph algorithm) ───────────────

export function detectDeadlock(n, m, alloc, request, avail) {
  const work = [...avail];
  // A process is initially "finished" only if it holds NO resources
  const finish = alloc.map(row => row.every(v => v === 0));
  const log = [];
  const seq = [];

  log.push({ type: 'info', text: `Initial Work = [${work.join(', ')}]` });
  log.push({
    type: 'info',
    text: `Finish = [${finish.map((f, i) => `P${i}:${f ? 'T' : 'F'}`).join(', ')}]`,
  });

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < n; i++) {
      if (!finish[i] && request[i].every((v, j) => v <= work[j])) {
        log.push({
          type: 'ok',
          text: `P${i}: Request [${request[i].join(', ')}] ≤ Work [${work.join(', ')}] → can proceed`,
        });
        for (let j = 0; j < m; j++) work[j] += alloc[i][j];
        finish[i] = true;
        seq.push(i);
        log.push({ type: 'ok', text: `P${i} completes. Work → [${work.join(', ')}]` });
        changed = true;
      }
    }
  }

  const deadlocked = finish.map((f, i) => (!f ? i : -1)).filter(i => i >= 0);
  if (deadlocked.length === 0) {
    log.push({ type: 'ok', text: 'All processes completed. No deadlock detected.' });
  } else {
    log.push({
      type: 'dead',
      text: `Deadlock detected! Stuck processes: ${deadlocked.map(i => `P${i}`).join(', ')}`,
    });
  }

  const wfg = buildWFG(n, alloc, request);
  return { deadlocked, seq, log, finish, wfg };
}

// ─── Build Wait-For Graph edges ──────────────────────────────────────────────

export function buildWFG(n, alloc, request) {
  const edges = [];
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < n; k++) {
      if (i === k) continue;
      for (let j = 0; j < alloc[0].length; j++) {
        if (request[i][j] > 0 && alloc[k][j] > 0) {
          if (!edges.find(ed => ed.from === i && ed.to === k))
            edges.push({ from: i, to: k });
          break;
        }
      }
    }
  }
  return edges;
}

// ─── Recovery: Process Termination ──────────────────────────────────────────

export function recoverByTermination(n, m, alloc, request, avail, deadlocked, priority) {
  const steps = [];
  const curAlloc = alloc.map(r => [...r]);
  let curAvail = [...avail];
  let remaining = [...deadlocked];

  const order =
    priority === 'priority'
      ? [...remaining]
      : [...remaining].sort(
          (a, b) =>
            curAlloc[a].reduce((s, v) => s + v, 0) -
            curAlloc[b].reduce((s, v) => s + v, 0)
        );

  for (const p of order) {
    curAvail = curAvail.map((v, j) => v + curAlloc[p][j]);
    steps.push({ proc: p, freed: [...curAlloc[p]], availAfter: [...curAvail] });
    curAlloc[p] = curAlloc[p].map(() => 0);
    remaining = remaining.filter(x => x !== p);

    const res = detectDeadlock(n, m, curAlloc, request, curAvail);
    if (res.deadlocked.length === 0) {
      steps.push({ proc: -1, freed: null, availAfter: curAvail, resolved: true });
      break;
    }
  }
  return steps;
}

// ─── Recovery: Resource Preemption ──────────────────────────────────────────

export function recoverByPreemption(n, m, alloc, request, avail, deadlocked) {
  const steps = [];
  const curAlloc = alloc.map(r => [...r]);
  let curAvail = [...avail];
  let remaining = [...deadlocked];

  while (remaining.length > 0) {
    // Choose victim: process in deadlock holding most resources
    const victim = remaining.reduce((best, p) => {
      const cost = curAlloc[p].reduce((s, v) => s + v, 0);
      return best === -1 || cost > curAlloc[best].reduce((s, v) => s + v, 0)
        ? p
        : best;
    }, -1);

    // Preempt only what a blocked process needs
    const needy = remaining.find(p => p !== victim) ?? remaining[0];
    const preempted = curAlloc[victim].map((v, j) => Math.min(v, request[needy][j]));
    curAvail = curAvail.map((v, j) => v + preempted[j]);
    curAlloc[victim] = curAlloc[victim].map((v, j) => v - preempted[j]);

    steps.push({
      proc: victim,
      preempted: [...preempted],
      availAfter: [...curAvail],
      victim: true,
    });

    const res = detectDeadlock(n, m, curAlloc, request, curAvail);
    remaining = res.deadlocked;
    if (remaining.length === 0)
      steps.push({ proc: -1, freed: null, availAfter: curAvail, resolved: true });
  }
  return steps;
}

// ─── Validation ─────────────────────────────────────────────────────────────

export function validate(n, m, alloc, request, avail) {
  const errors = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (alloc[i][j] < 0) errors.push(`Alloc[P${i}][R${j}] cannot be negative`);
      if (request[i][j] < 0) errors.push(`Request[P${i}][R${j}] cannot be negative`);
    }
  }
  avail.forEach((v, j) => { if (v < 0) errors.push(`Available[R${j}] cannot be negative`); });
  return errors;
}

// ─── Preset scenarios ────────────────────────────────────────────────────────

export const PRESETS = {
  deadlock: {
    label: 'Classic deadlock (4 processes)',
    n: 4,
    m: 3,
    alloc:   [[0,1,0],[2,0,0],[3,0,3],[2,1,1]],
    request: [[0,0,0],[2,0,2],[0,0,0],[1,0,0]],
    avail:   [0, 0, 0],
  },
  nodeadlock: {
    label: 'No deadlock (3 processes)',
    n: 3,
    m: 2,
    alloc:   [[1,0],[0,1],[0,0]],
    request: [[0,1],[1,0],[0,0]],
    avail:   [1, 1],
  },
  cycle: {
    label: 'Circular wait (3 processes)',
    n: 3,
    m: 3,
    alloc:   [[1,0,0],[0,1,0],[0,0,1]],
    request: [[0,1,0],[0,0,1],[1,0,0]],
    avail:   [0, 0, 0],
  },
};
