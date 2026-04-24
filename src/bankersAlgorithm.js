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

export function runSafetyAlgorithm({ allocation, maximum, available }) {
  const processCount = allocation.length;
  const need = calculateNeed(maximum, allocation);
  const work = [...available];
  const finish = Array.from({ length: processCount }, () => false);
  const steps = [];
  const safeSequence = [];

  let progressed = true;

  while (safeSequence.length < processCount && progressed) {
    progressed = false;

    for (let processIndex = 0; processIndex < processCount; processIndex += 1) {
      if (finish[processIndex]) {
        continue;
      }

      const canExecute = need[processIndex].every(
        (needValue, resourceIndex) => needValue <= work[resourceIndex]
      );

      if (!canExecute) {
        continue;
      }

      const workBefore = [...work];
      const finishBefore = [...finish];

      for (let resourceIndex = 0; resourceIndex < work.length; resourceIndex += 1) {
        work[resourceIndex] += allocation[processIndex][resourceIndex];
      }

      finish[processIndex] = true;
      safeSequence.push(processIndex);

      steps.push({
        process: processIndex,
        need: [...need[processIndex]],
        release: [...allocation[processIndex]],
        workBefore,
        workAfter: [...work],
        finishBefore,
        finishAfter: [...finish],
        finishSummary: formatFinish(finish),
      });

      progressed = true;
    }
  }

  const blockedProcesses = finish
    .map((done, processIndex) => (done ? -1 : processIndex))
    .filter(processIndex => processIndex >= 0);

  return {
    isSafe: blockedProcesses.length === 0,
    safeSequence,
    blockedProcesses,
    steps,
    need,
    finalWork: work,
    finish,
  };
}

export function checkRequest({ allocation, maximum, available, process, request }) {
  const need = calculateNeed(maximum, allocation);

  if (request.every(value => value === 0)) {
    return {
      granted: false,
      code: 'empty',
      process,
      request: [...request],
      message: 'Enter a non-zero request vector before checking.',
    };
  }

  if (request.some((value, resourceIndex) => value > need[process][resourceIndex])) {
    return {
      granted: false,
      code: 'exceeds-need',
      process,
      request: [...request],
      message: `Request exceeds P${process}'s remaining need.`,
    };
  }

  if (request.some((value, resourceIndex) => value > available[resourceIndex])) {
    return {
      granted: false,
      code: 'unavailable',
      process,
      request: [...request],
      message: 'Request cannot be granted immediately because available resources are insufficient.',
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

  if (!safetyResult.isSafe) {
    return {
      granted: false,
      code: 'unsafe',
      process,
      request: [...request],
      message: 'Granting this request would leave the system in an unsafe state.',
      safetyResult,
    };
  }

  return {
    granted: true,
    code: 'granted',
    process,
    request: [...request],
    message: `Request approved for P${process}. Allocation and Need were updated.`,
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
