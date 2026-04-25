export const BANKER_DEMO = {
  n: 5,
  m: 3,
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  maximum: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
  available: [3, 3, 2],
  requestProcess: 1,
  requestVector: [1, 0, 2],
};

export function cloneMatrix(matrix) {
  return matrix.map(row => [...row]);
}

export function createMatrix(rows, cols, source) {
  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => source?.[rowIndex]?.[colIndex] ?? 0)
  );
}

export function calculateNeed(maximum, allocation) {
  return maximum.map((row, rowIndex) =>
    row.map((value, colIndex) => Math.max(0, value - allocation[rowIndex][colIndex]))
  );
}

function formatFinish(finish) {
  return finish.map((done, processIndex) => `P${processIndex}:${done ? 'T' : 'F'}`).join('  ');
}

function buildResourceChecks(needRow, work) {
  return needRow.map((needValue, resourceIndex) => ({
    resourceIndex,
    need: needValue,
    work: work[resourceIndex],
    satisfied: needValue <= work[resourceIndex],
    shortfall: Math.max(0, needValue - work[resourceIndex]),
  }));
}

function buildExecutionExplanation(processIndex, resourceChecks, release) {
  const checks = resourceChecks
    .map(check => `R${check.resourceIndex}: ${check.need} <= ${check.work}`)
    .join(', ');

  return `P${processIndex} can run because every Need entry is within Work (${checks}). When it finishes, it releases [${release.join(', ')}].`;
}

function buildBlockedExplanation(processIndex, blockedBy) {
  const blockers = blockedBy
    .map(check => `R${check.resourceIndex} needs ${check.need} but only ${check.work} is available`)
    .join('; ');

  return `P${processIndex} stays blocked because ${blockers}.`;
}

export function runSafetyAlgorithm({ allocation, maximum, available }) {
  const processCount = allocation.length;
  const need = calculateNeed(maximum, allocation);
  const work = [...available];
  const finish = Array.from({ length: processCount }, () => false);
  const steps = [];
  const evaluations = [];
  const safeSequence = [];

  let pass = 1;
  let progressed = true;

  while (safeSequence.length < processCount && progressed) {
    progressed = false;

    for (let processIndex = 0; processIndex < processCount; processIndex += 1) {
      const workBefore = [...work];
      const finishBefore = [...finish];

      if (finish[processIndex]) {
        evaluations.push({
          kind: 'skip',
          pass,
          process: processIndex,
          title: `P${processIndex} is already complete`,
          summary: `Skip P${processIndex} because it already finished in an earlier pass.`,
          explanation: `The algorithm revisits processes in order. P${processIndex} is ignored here because its Finish flag is already true.`,
          need: [...need[processIndex]],
          workBefore,
          workAfter: [...work],
          release: Array.from({ length: work.length }, () => 0),
          finishBefore,
          finishAfter: [...finish],
          finishSummary: formatFinish(finish),
          resourceChecks: [],
          blockedBy: [],
        });
        continue;
      }

      const resourceChecks = buildResourceChecks(need[processIndex], work);
      const blockedBy = resourceChecks.filter(check => !check.satisfied);
      const canExecute = blockedBy.length === 0;

      if (!canExecute) {
        evaluations.push({
          kind: 'blocked',
          pass,
          process: processIndex,
          title: `P${processIndex} cannot run yet`,
          summary: `P${processIndex} is blocked in pass ${pass}.`,
          explanation: buildBlockedExplanation(processIndex, blockedBy),
          need: [...need[processIndex]],
          workBefore,
          workAfter: [...work],
          release: Array.from({ length: work.length }, () => 0),
          finishBefore,
          finishAfter: [...finish],
          finishSummary: formatFinish(finish),
          resourceChecks,
          blockedBy,
        });
        continue;
      }

      for (let resourceIndex = 0; resourceIndex < work.length; resourceIndex += 1) {
        work[resourceIndex] += allocation[processIndex][resourceIndex];
      }

      finish[processIndex] = true;
      safeSequence.push(processIndex);

      const step = {
        kind: 'execute',
        pass,
        sequencePosition: safeSequence.length,
        process: processIndex,
        title: `P${processIndex} can complete`,
        summary: `P${processIndex} runs in pass ${pass} and releases its allocated resources.`,
        explanation: buildExecutionExplanation(
          processIndex,
          resourceChecks,
          allocation[processIndex]
        ),
        need: [...need[processIndex]],
        release: [...allocation[processIndex]],
        workBefore,
        workAfter: [...work],
        finishBefore,
        finishAfter: [...finish],
        finishSummary: formatFinish(finish),
        resourceChecks,
        blockedBy: [],
      };

      steps.push(step);
      evaluations.push(step);
      progressed = true;
    }

    pass += 1;
  }

  const blockedProcesses = finish
    .map((done, processIndex) => (done ? -1 : processIndex))
    .filter(processIndex => processIndex >= 0);

  if (blockedProcesses.length > 0) {
    evaluations.push({
      kind: 'stall',
      pass: Math.max(1, pass - 1),
      process: null,
      title: 'System reaches an unsafe stopping point',
      summary: 'No remaining process can satisfy Need <= Work.',
      explanation: `The algorithm stops here because ${blockedProcesses
        .map(processIndex => `P${processIndex}`)
        .join(', ')} still need resources that are not currently available.`,
      need: [],
      release: [],
      workBefore: [...work],
      workAfter: [...work],
      finishBefore: [...finish],
      finishAfter: [...finish],
      finishSummary: formatFinish(finish),
      resourceChecks: [],
      blockedBy: [],
      blockedProcesses,
    });
  }

  return {
    isSafe: blockedProcesses.length === 0,
    safeSequence,
    blockedProcesses,
    steps,
    evaluations,
    need,
    finalWork: work,
    finish,
    passes: Math.max(1, pass - 1),
  };
}

function buildDecisionTrailItem(label, passed, detail) {
  return {
    label,
    passed,
    detail,
  };
}

export function checkRequest({ allocation, maximum, available, process, request }) {
  const need = calculateNeed(maximum, allocation);
  const decisionTrail = [
    buildDecisionTrailItem(
      'Request is not empty',
      !request.every(value => value === 0),
      `Current request vector: [${request.join(', ')}]`
    ),
  ];

  if (request.every(value => value === 0)) {
    return {
      granted: false,
      code: 'empty',
      process,
      request: [...request],
      message: 'Enter a non-zero request vector before checking.',
      decisionTrail,
    };
  }

  const needChecks = request.map((value, resourceIndex) => ({
    resourceIndex,
    request: value,
    remainingNeed: need[process][resourceIndex],
    passed: value <= need[process][resourceIndex],
  }));

  const requestWithinNeed = needChecks.every(check => check.passed);
  decisionTrail.push(
    buildDecisionTrailItem(
      `Request stays within P${process}'s remaining need`,
      requestWithinNeed,
      needChecks
        .map(
          check =>
            `R${check.resourceIndex}: request ${check.request}, remaining need ${check.remainingNeed}`
        )
        .join(' | ')
    )
  );

  if (!requestWithinNeed) {
    return {
      granted: false,
      code: 'exceeds-need',
      process,
      request: [...request],
      message: `Request exceeds P${process}'s remaining need.`,
      decisionTrail,
    };
  }

  const availabilityChecks = request.map((value, resourceIndex) => ({
    resourceIndex,
    request: value,
    available: available[resourceIndex],
    passed: value <= available[resourceIndex],
  }));

  const requestWithinAvailable = availabilityChecks.every(check => check.passed);
  decisionTrail.push(
    buildDecisionTrailItem(
      'Enough resources are currently available',
      requestWithinAvailable,
      availabilityChecks
        .map(check => `R${check.resourceIndex}: request ${check.request}, available ${check.available}`)
        .join(' | ')
    )
  );

  if (!requestWithinAvailable) {
    return {
      granted: false,
      code: 'unavailable',
      process,
      request: [...request],
      message: 'Request cannot be granted immediately because available resources are insufficient.',
      decisionTrail,
    };
  }

  const nextAllocation = cloneMatrix(allocation);
  nextAllocation[process] = nextAllocation[process].map(
    (value, resourceIndex) => value + request[resourceIndex]
  );

  const nextAvailable = available.map(
    (value, resourceIndex) => value - request[resourceIndex]
  );

  const safetyResult = runSafetyAlgorithm({
    allocation: nextAllocation,
    maximum,
    available: nextAvailable,
  });

  decisionTrail.push(
    buildDecisionTrailItem(
      'Tentative allocation keeps the system safe',
      safetyResult.isSafe,
      safetyResult.isSafe
        ? `Safe sequence after granting the request: ${safetyResult.safeSequence
            .map(processIndex => `P${processIndex}`)
            .join(' -> ')}`
        : `Blocked after tentative allocation: ${safetyResult.blockedProcesses
            .map(processIndex => `P${processIndex}`)
            .join(', ')}`
    )
  );

  if (!safetyResult.isSafe) {
    return {
      granted: false,
      code: 'unsafe',
      process,
      request: [...request],
      message: 'Granting this request would leave the system in an unsafe state.',
      decisionTrail,
      safetyResult,
    };
  }

  return {
    granted: true,
    code: 'granted',
    process,
    request: [...request],
    message: `Request approved for P${process}. Allocation, Available, and Need were updated.`,
    decisionTrail,
    allocation: nextAllocation,
    available: nextAvailable,
    safetyResult,
  };
}

export function validateState({
  n,
  m,
  allocation,
  maximum,
  available,
  requestProcess,
  requestVector,
}) {
  const messageSet = new Set();
  const matrixErrors = [];
  const availableErrors = [];
  const requestErrors = [];
  const configErrors = { n: false, m: false, requestProcess: false };

  if (n < 1 || n > 8) {
    configErrors.n = true;
    messageSet.add('Process count must stay between 1 and 8.');
  }

  if (m < 1 || m > 6) {
    configErrors.m = true;
    messageSet.add('Resource type count must stay between 1 and 6.');
  }

  if (requestProcess < 0 || requestProcess >= n) {
    configErrors.requestProcess = true;
    messageSet.add('Select a valid process for the resource request.');
  }

  for (let rowIndex = 0; rowIndex < n; rowIndex += 1) {
    for (let colIndex = 0; colIndex < m; colIndex += 1) {
      if (allocation[rowIndex][colIndex] < 0) {
        matrixErrors.push(`allocation-${rowIndex}-${colIndex}`);
        messageSet.add('Allocation values cannot be negative.');
      }

      if (maximum[rowIndex][colIndex] < 0) {
        matrixErrors.push(`max-${rowIndex}-${colIndex}`);
        messageSet.add('Maximum values cannot be negative.');
      }

      if (maximum[rowIndex][colIndex] < allocation[rowIndex][colIndex]) {
        matrixErrors.push(`max-${rowIndex}-${colIndex}`);
        messageSet.add('Every Max entry must be greater than or equal to Allocation.');
      }
    }
  }

  for (let resourceIndex = 0; resourceIndex < m; resourceIndex += 1) {
    if (available[resourceIndex] < 0) {
      availableErrors.push(resourceIndex);
      messageSet.add('Available resources cannot be negative.');
    }

    if (requestVector[resourceIndex] < 0) {
      requestErrors.push(resourceIndex);
      messageSet.add('Requested resources cannot be negative.');
    }
  }

  return {
    messages: [...messageSet],
    matrixErrors,
    availableErrors,
    requestErrors,
    configErrors,
  };
}
