import coffmanConditionsConfig from '../data/coffmanConditions.json';

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

function formatVector(values = []) {
  return `[${values.join(', ')}]`;
}

function getResourceLabel(resource, index) {
  return resource?.id || resource?.name || `R${index}`;
}

function getProcessHoldings(processes, resources, allocation, processIndex) {
  return resources
    .map((resource, resourceIndex) => ({
      resourceId: getResourceLabel(resource, resourceIndex),
      resourceIndex,
      amount: Number(allocation[processIndex]?.[resourceIndex] ?? 0),
    }))
    .filter((entry) => entry.amount > 0);
}

function getBlockedProcessDetails({
  processes,
  resources,
  allocation,
  need,
  finish,
  activeIndexes,
  workAtStop,
}) {
  return activeIndexes
    .filter((index) => !finish[index])
    .map((processIndex) => {
      const heldResources = getProcessHoldings(processes, resources, allocation, processIndex);
      const shortageResources = resources
        .map((resource, resourceIndex) => {
          const needValue = Number(need[processIndex]?.[resourceIndex] ?? 0);
          const workValue = Number(workAtStop[resourceIndex] ?? 0);
          const shortBy = needValue - workValue;

          if (shortBy <= 0) {
            return null;
          }

          return {
            resourceId: getResourceLabel(resource, resourceIndex),
            resourceIndex,
            need: needValue,
            work: workValue,
            shortBy,
          };
        })
        .filter(Boolean);

      return {
        processId: processes[processIndex].id,
        processIndex,
        heldResources,
        shortageResources,
      };
    });
}

function buildWaitForEdges(processes, allocation, blockedProcessDetails) {
  const edges = [];

  blockedProcessDetails.forEach((detail) => {
    detail.shortageResources.forEach((shortage) => {
      processes.forEach((process, holderIndex) => {
        if (process.active === false || holderIndex === detail.processIndex) {
          return;
        }

        const heldAmount = Number(allocation[holderIndex]?.[shortage.resourceIndex] ?? 0);
        if (heldAmount <= 0) {
          return;
        }

        edges.push({
          from: detail.processId,
          to: process.id,
          resourceId: shortage.resourceId,
          heldAmount,
        });
      });
    });
  });

  return edges;
}

function findWaitCycle(waitForEdges) {
  const adjacency = new Map();

  waitForEdges.forEach((edge) => {
    const outgoing = adjacency.get(edge.from) || [];
    outgoing.push(edge);
    adjacency.set(edge.from, outgoing);
  });

  const visited = new Set();
  const onStack = new Set();
  const pathNodes = [];
  const pathEdges = [];

  function dfs(node) {
    visited.add(node);
    onStack.add(node);
    pathNodes.push(node);

    const outgoing = adjacency.get(node) || [];
    for (const edge of outgoing) {
      if (onStack.has(edge.to)) {
        const cycleStartIndex = pathNodes.indexOf(edge.to);
        return pathEdges.slice(cycleStartIndex).concat(edge);
      }

      if (!visited.has(edge.to)) {
        pathEdges.push(edge);
        const cycle = dfs(edge.to);
        if (cycle) {
          return cycle;
        }
        pathEdges.pop();
      }
    }

    onStack.delete(node);
    pathNodes.pop();
    return null;
  }

  for (const node of adjacency.keys()) {
    if (visited.has(node)) {
      continue;
    }

    const cycle = dfs(node);
    if (cycle) {
      return cycle;
    }
  }

  return null;
}

function buildCircularWaitExplanation(cycleEdges) {
  if (!cycleEdges?.length) {
    return null;
  }

  return cycleEdges
    .map(
      (edge) =>
        `${edge.from} is waiting for ${edge.resourceId} while ${edge.to} is holding it.`
    )
    .join(' ');
}

function buildShortageExplanation(blockedProcessDetails) {
  if (!blockedProcessDetails.length) {
    return null;
  }

  return blockedProcessDetails
    .map((detail) => {
      const shortages = detail.shortageResources
        .map(
          (resource) =>
            `${resource.resourceId} needs ${resource.need}, Work has ${resource.work}, short by ${resource.shortBy}`
        )
        .join('; ');

      return `${detail.processId} cannot finish because ${shortages}.`;
    })
    .join(' ');
}

function getConditionCopy(key) {
  return (
    coffmanConditionsConfig.find((condition) => condition.key === key) || {
      key,
      label: key,
      presentDetail: '',
      absentDetail: '',
    }
  );
}

function buildCoffmanConditions({
  resources,
  blockedProcessDetails,
  waitCycle,
}) {
  const anyHeldResources = blockedProcessDetails.some((detail) => detail.heldResources.length > 0);
  const anyShortage = blockedProcessDetails.some((detail) => detail.shortageResources.length > 0);
  const holdAndWait = blockedProcessDetails.some(
    (detail) => detail.heldResources.length > 0 && detail.shortageResources.length > 0
  );
  const contestedResources = resources.some((resource) => Number(resource.totalInstances ?? 0) > 0);
  const mutualExclusionCopy = getConditionCopy('mutual-exclusion');
  const holdAndWaitCopy = getConditionCopy('hold-and-wait');
  const noPreemptionCopy = getConditionCopy('no-preemption');
  const circularWaitCopy = getConditionCopy('circular-wait');

  return [
    {
      key: mutualExclusionCopy.key,
      label: mutualExclusionCopy.label,
      active: contestedResources,
      detail: contestedResources
        ? mutualExclusionCopy.presentDetail
        : mutualExclusionCopy.absentDetail,
    },
    {
      key: holdAndWaitCopy.key,
      label: holdAndWaitCopy.label,
      active: holdAndWait,
      detail: holdAndWait
        ? holdAndWaitCopy.presentDetail
        : anyShortage
          ? holdAndWaitCopy.waitingWithoutHoldingDetail
          : holdAndWaitCopy.absentDetail,
    },
    {
      key: noPreemptionCopy.key,
      label: noPreemptionCopy.label,
      active: anyHeldResources,
      detail: anyHeldResources
        ? noPreemptionCopy.presentDetail
        : noPreemptionCopy.absentDetail,
    },
    {
      key: circularWaitCopy.key,
      label: circularWaitCopy.label,
      active: Boolean(waitCycle?.length),
      detail: waitCycle?.length
        ? buildCircularWaitExplanation(waitCycle)
        : circularWaitCopy.absentDetail,
    },
  ];
}

function buildNarration({
  isSafe,
  safeSequence,
  steps,
  blockedProcesses,
  blockedProcessDetails,
  waitCycle,
  workAtStop,
  resources,
}) {
  const successSteps = steps.filter((step) => step.canProceed);
  const coffmanConditions = buildCoffmanConditions({
    resources,
    blockedProcessDetails,
    waitCycle,
  });

  if (isSafe) {
    const firstStep = successSteps[0] || null;
    const lastStep = successSteps[successSteps.length - 1] || null;

    return {
      headline: 'A safe completion order exists.',
      summary:
        successSteps.length === 0
          ? 'There are no unfinished active processes left, so the snapshot is already safe.'
          : 'Banker\'s Algorithm can always find at least one unfinished process whose remaining need fits inside the current Work vector.',
      whySafeSequence: firstStep
        ? `${firstStep.process} can begin because Need ${formatVector(firstStep.need)} <= Work ${formatVector(firstStep.work)}. Each finished process releases its allocation, and Work grows to ${formatVector(lastStep?.workAfter || workAtStop)} by the end of the sequence.`
        : 'No additional execution steps are required to prove safety.',
      safeSequenceFailure: null,
      deadlockReason: null,
      waitCycleText: null,
      recoveryHint: 'No recovery action is required because a safe sequence is already available.',
      workAtStop,
      blockedProcessDetails,
      coffmanConditions,
    };
  }

  const shortageExplanation = buildShortageExplanation(blockedProcessDetails);
  const circularWaitExplanation = buildCircularWaitExplanation(waitCycle);

  return {
    headline: 'No remaining process can finish from the current Work vector.',
    summary: `The safety check stops at Work ${formatVector(workAtStop)} because every unfinished active process still needs at least one unavailable resource.`,
    whySafeSequence: null,
    safeSequenceFailure: shortageExplanation,
    deadlockReason: circularWaitExplanation
      ? `${circularWaitExplanation} Circular wait detected.`
      : `Blocked processes: ${blockedProcesses.join(', ')}. The system is unsafe because none of them can satisfy Need <= Work and release more resources.`,
    waitCycleText: circularWaitExplanation,
    recoveryHint:
      'Break the blockage by terminating one blocked process or preempting the lowest-priority holder so its resources return to Work.',
    workAtStop,
    blockedProcessDetails,
    coffmanConditions,
  };
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
  const blockedProcessDetails = getBlockedProcessDetails({
    processes,
    resources,
    allocation,
    need,
    finish,
    activeIndexes,
    workAtStop: work,
  });
  const waitForEdges = buildWaitForEdges(processes, allocation, blockedProcessDetails);
  const waitCycle = findWaitCycle(waitForEdges);
  const isSafe = blockedProcesses.length === 0;

  return {
    isSafe,
    safeSequence: isSafe ? safeSequence : null,
    steps,
    blockedProcesses,
    blockedProcessDetails,
    waitCycle,
    needMatrix: cloneMatrix(need),
    finalWork: work,
    narration: buildNarration({
      isSafe,
      safeSequence,
      steps,
      blockedProcesses,
      blockedProcessDetails,
      waitCycle,
      workAtStop: work,
      resources,
    }),
  };
}

export function buildRecoverySnapshot({ processes, allocation, max, resources }) {
  const available = resources.map((resource, resourceIndex) => {
    const allocated = allocation.reduce(
      (sum, row) => sum + Number(row[resourceIndex] ?? 0),
      0
    );
    return Math.max(0, Number(resource.totalInstances ?? 0) - allocated);
  });

  return {
    processes: processes.map((process) => ({ ...process })),
    allocation: cloneMatrix(allocation),
    max: cloneMatrix(max),
    available,
  };
}

export { buildNeedMatrix, cloneMatrix };
