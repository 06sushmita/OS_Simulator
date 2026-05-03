function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function buildNeedMatrix(max, allocation) {
  return max.map((row, rowIndex) =>
    row.map((value, colIndex) => Math.max(0, value - allocation[rowIndex][colIndex]))
  );
}

function getActiveProcessIndexes(processes) {
  return processes
    .map((process, index) => (process?.active === false ? -1 : index))
    .filter((index) => index >= 0);
}

export function runBankersAlgorithm({
  processes,
  allocation,
  max,
  available,
  resources,
}) {
  const activeIndexes = getActiveProcessIndexes(processes);
  const need = buildNeedMatrix(max, allocation);
  const work = [...available];
  const finish = processes.map((process) => process?.active === false);
  const safeSequence = [];
  const steps = [];

  let stepNumber = 1;
  let progressed = true;

  while (progressed && safeSequence.length < activeIndexes.length) {
    progressed = false;

    for (const processIndex of activeIndexes) {
      if (finish[processIndex]) {
        continue;
      }

      const needVector = need[processIndex];
      const workBefore = [...work];
      const canProceed = needVector.every(
        (needValue, resourceIndex) => needValue <= work[resourceIndex]
      );

      if (!canProceed) {
        steps.push({
          step: stepNumber,
          process: processes[processIndex].id,
          processIndex,
          work: workBefore,
          workAfter: [...work],
          need: [...needVector],
          allocation: [...allocation[processIndex]],
          canProceed: false,
          message: `${processes[processIndex].id} is blocked. Need exceeds current Work.`,
          resources: resources.map((resource) => resource.id),
        });
        stepNumber += 1;
        continue;
      }

      for (let resourceIndex = 0; resourceIndex < work.length; resourceIndex += 1) {
        work[resourceIndex] += allocation[processIndex][resourceIndex];
      }

      finish[processIndex] = true;
      safeSequence.push(processes[processIndex].id);
      progressed = true;

      steps.push({
        step: stepNumber,
        process: processes[processIndex].id,
        processIndex,
        work: workBefore,
        workAfter: [...work],
        need: [...needVector],
        allocation: [...allocation[processIndex]],
        canProceed: true,
        message: `${processes[processIndex].id} can proceed. Need <= Work. Releasing allocation after completion.`,
        resources: resources.map((resource) => resource.id),
      });
      stepNumber += 1;
    }
  }

  const blockedProcesses = activeIndexes
    .filter((index) => !finish[index])
    .map((index) => processes[index].id);

  return {
    isSafe: blockedProcesses.length === 0,
    safeSequence: blockedProcesses.length === 0 ? safeSequence : null,
    steps,
    blockedProcesses,
    needMatrix: cloneMatrix(need),
    finalWork: work,
  };
}

export function buildRecoverySnapshot({ processes, allocation, max, resources }) {
  const available = resources.map((resource, resourceIndex) => {
    const allocated = allocation.reduce(
      (sum, row) => sum + Number(row[resourceIndex] ?? 0),
      0
    );
    return Math.max(0, resource.totalInstances - allocated);
  });

  return {
    processes: processes.map((process) => ({ ...process })),
    allocation: cloneMatrix(allocation),
    max: cloneMatrix(max),
    available,
  };
}

export { buildNeedMatrix, cloneMatrix };
