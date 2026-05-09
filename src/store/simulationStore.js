import { create } from 'zustand';
import {
  buildNeedMatrix,
  cloneMatrix,
  runBankersAlgorithm,
} from '../algorithms/bankersAlgorithm';

export const STEP_LABELS = [
  'Intro',
  'Processes',
  'Resources',
  'Matrices',
  'RAG View',
  'Status',
  'Simulate',
  'Recovery',
];

const MIN_PROCESSES = 1;
const MAX_PROCESSES = 10;
const MIN_RESOURCES = 1;
const MAX_RESOURCES = 5;
const MIN_RESOURCE_INSTANCES = 1;
const MAX_RESOURCE_INSTANCES = 10;

function createProcesses(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `P${index}`,
    name: `Process ${index}`,
    priority: Math.floor(Math.random() * 10) + 1,
    active: true,
    status: 'ready',
  }));
}

function createProcess(index) {
  return {
    id: `P${index}`,
    name: `Process ${index}`,
    priority: Math.floor(Math.random() * 10) + 1,
    active: true,
    status: 'ready',
  };
}

function createResources(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `R${index}`,
    name: `R${index}`,
    totalInstances: 1,
  }));
}

function createZeroMatrix(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}

function resizeMatrix(matrix, rows, cols) {
  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => Number(matrix[rowIndex]?.[colIndex] ?? 0))
  );
}

function syncProcesses(existingProcesses, count) {
  return Array.from({ length: count }, (_, index) => ({
    ...(existingProcesses[index] || createProcess(index)),
    id: `P${index}`,
    name: `Process ${index}`,
  }));
}

function createMessage(step, icon, text, type = 'info') {
  return { step, icon, text, type };
}

function computeAvailableVector(resources, allocationMatrix) {
  return resources.map((resource, resourceIndex) => {
    const allocated = allocationMatrix.reduce(
      (sum, row) => sum + Number(row[resourceIndex] ?? 0),
      0
    );
    return Number(resource.totalInstances ?? 0) - allocated;
  });
}

function getColumnAllocationTotal(matrix, colIndex, excludeRowIndex = -1) {
  return matrix.reduce((sum, row, rowIndex) => {
    if (rowIndex === excludeRowIndex) {
      return sum;
    }

    return sum + Number(row[colIndex] ?? 0);
  }, 0);
}

function parseMatrixInput(value) {
  const digitsOnly = String(value ?? '').replace(/\D/g, '');

  if (!digitsOnly) {
    return 0;
  }

  return Math.max(0, Math.min(10, Number(digitsOnly) || 0));
}

function validateResources(resources) {
  const errors = {};

  resources.forEach((resource, colIndex) => {
    const totalInstances = Number(resource.totalInstances ?? 0);

    if (
      !Number.isFinite(totalInstances) ||
      totalInstances < MIN_RESOURCE_INSTANCES ||
      totalInstances > MAX_RESOURCE_INSTANCES
    ) {
      errors[`resource-range-${colIndex}`] =
        `Resource total must be between ${MIN_RESOURCE_INSTANCES} and ${MAX_RESOURCE_INSTANCES}.`;
    }
  });

  return errors;
}

function validateMatrices(processes, resources, allocationMatrix, maxMatrix) {
  const errors = validateResources(resources);

  processes.forEach((process, rowIndex) => {
    if (process.active === false) {
      return;
    }

    resources.forEach((resource, colIndex) => {
      const allocation = Number(allocationMatrix[rowIndex]?.[colIndex] ?? 0);
      const max = Number(maxMatrix[rowIndex]?.[colIndex] ?? 0);

      if (allocation > max) {
        errors[`allocation-${rowIndex}-${colIndex}`] =
          'Allocation cannot exceed the maximum claim.';
        errors[`max-${rowIndex}-${colIndex}`] =
          'Maximum claim must stay above or equal to allocation.';
      }

      if (allocation < 0 || max < 0) {
        errors[`allocation-${rowIndex}-${colIndex}`] = 'Values cannot be negative.';
        errors[`max-${rowIndex}-${colIndex}`] = 'Values cannot be negative.';
      }

      if (max > Number(resource.totalInstances ?? 0)) {
        errors[`max-${rowIndex}-${colIndex}`] =
          'A process cannot claim more than the total resource instances.';
      }
    });
  });

  resources.forEach((resource, colIndex) => {
    const allocated = allocationMatrix.reduce(
      (sum, row) => sum + Number(row[colIndex] ?? 0),
      0
    );

    if (allocated > Number(resource.totalInstances ?? 0)) {
      errors[`resource-total-${colIndex}`] =
        'Allocated instances exceed the configured resource total.';
    }
  });

  return errors;
}

function buildSimulationFrames({ processes, resources, allocationMatrix, maxMatrix, availableVector, algorithmResult }) {
  const frames = [
    {
      index: 0,
      currentProcess: null,
      currentWork: [...availableVector],
      completedProcessIds: [],
      allocationMatrix: cloneMatrix(allocationMatrix),
      needMatrix: buildNeedMatrix(maxMatrix, allocationMatrix),
      message: createMessage(
        0,
        'ℹ️',
        'Simulation initialized. Use Play or Next to walk through the safe sequence.',
        'info'
      ),
    },
  ];

  const runningAllocation = cloneMatrix(allocationMatrix);
  const runningNeed = buildNeedMatrix(maxMatrix, allocationMatrix);
  const completedProcessIds = [];

  let work = [...availableVector];
  let frameIndex = 1;

  for (const step of algorithmResult.steps.filter((item) => item.canProceed)) {
    completedProcessIds.push(step.process);

    runningAllocation[step.processIndex] = runningAllocation[step.processIndex].map(() => 0);
    runningNeed[step.processIndex] = runningNeed[step.processIndex].map(() => 0);
    work = [...step.workAfter];

    frames.push({
      index: frameIndex,
      currentProcess: step.process,
      currentWork: [...work],
      completedProcessIds: [...completedProcessIds],
      allocationMatrix: cloneMatrix(runningAllocation),
      needMatrix: cloneMatrix(runningNeed),
      message: createMessage(
        frameIndex,
        '✅',
        `${step.process}: Need [${step.need.join(', ')}] <= Work [${step.work.join(', ')}]. Process finished and released [${step.allocation.join(', ')}].`,
        'success'
      ),
    });

    frameIndex += 1;
  }

  return frames;
}

function buildDetailedSimulationFrames({
  processes,
  resources,
  allocationMatrix,
  maxMatrix,
  availableVector,
  algorithmResult,
}) {
  const frames = [
    {
      index: 0,
      currentProcess: null,
      currentWork: [...availableVector],
      completedProcessIds: [],
      allocationMatrix: cloneMatrix(allocationMatrix),
      needMatrix: buildNeedMatrix(maxMatrix, allocationMatrix),
      message: createMessage(
        0,
        '->',
        'Simulation initialized. Use Play or Next to walk through the safe sequence.',
        'info'
      ),
    },
  ];

  const runningAllocation = cloneMatrix(allocationMatrix);
  const runningNeed = buildNeedMatrix(maxMatrix, allocationMatrix);
  const completedProcessIds = [];

  let work = [...availableVector];
  let frameIndex = 1;

  for (const step of algorithmResult.steps.filter((item) => item.canProceed)) {
    runningNeed[step.processIndex] = runningNeed[step.processIndex].map(() => 0);

    const allocatedResources = step.allocation
      .map((value, resourceIndex) => ({
        resource: resources[resourceIndex],
        resourceIndex,
        value: Number(value ?? 0),
      }))
      .filter((entry) => entry.value > 0);

    if (allocatedResources.length === 0) {
      completedProcessIds.push(step.process);
      work = [...step.workAfter];

      frames.push({
        index: frameIndex,
        currentProcess: step.process,
        currentWork: [...work],
        completedProcessIds: [...completedProcessIds],
        allocationMatrix: cloneMatrix(runningAllocation),
        needMatrix: cloneMatrix(runningNeed),
        message: createMessage(
          frameIndex,
          'OK',
          `${step.process}: Need [${step.need.join(', ')}] <= Work [${step.work.join(', ')}]. Process completed with no held resources to release.`,
          'success'
        ),
      });

      frameIndex += 1;
      continue;
    }

    for (const { resource, resourceIndex, value } of allocatedResources) {
      runningAllocation[step.processIndex][resourceIndex] = 0;
      work[resourceIndex] += value;

      frames.push({
        index: frameIndex,
        currentProcess: step.process,
        currentWork: [...work],
        completedProcessIds: [...completedProcessIds],
        allocationMatrix: cloneMatrix(runningAllocation),
        needMatrix: cloneMatrix(runningNeed),
        message: createMessage(
          frameIndex,
          '->',
          `${step.process} released ${value} instance${value > 1 ? 's' : ''} of ${resource.id}. The allocation arrow to ${resource.id} has been removed.`,
          'info'
        ),
      });

      frameIndex += 1;
    }

    completedProcessIds.push(step.process);
    work = [...step.workAfter];

    frames.push({
      index: frameIndex,
      currentProcess: step.process,
      currentWork: [...work],
      completedProcessIds: [...completedProcessIds],
      allocationMatrix: cloneMatrix(runningAllocation),
      needMatrix: cloneMatrix(runningNeed),
      message: createMessage(
        frameIndex,
        'OK',
        `${step.process}: All held resources have been deallocated. Work is now [${step.workAfter.join(', ')}].`,
        'success'
      ),
    });

    frameIndex += 1;
  }

  return frames;
}

function recalculateState(statePatch) {
  const needMatrix = buildNeedMatrix(statePatch.maxMatrix, statePatch.allocationMatrix);
  const availableVector = computeAvailableVector(statePatch.resources, statePatch.allocationMatrix);
  const validationErrors = validateMatrices(
    statePatch.processes,
    statePatch.resources,
    statePatch.allocationMatrix,
    statePatch.maxMatrix
  );

  return {
    ...statePatch,
    needMatrix,
    availableVector,
    validationErrors,
  };
}

function normalizeLoadedProcesses(processes = []) {
  return processes.map((process, index) => ({
    id: `P${index}`,
    name: process.name || `Process ${index}`,
    priority: Math.max(1, Math.min(10, Number(process.priority ?? 1) || 1)),
    active: process.active !== false,
    status: process.status || 'ready',
  }));
}

function normalizeLoadedResources(resources = []) {
  return resources.map((resource, index) => ({
    id: `R${index}`,
    name: resource.name || `R${index}`,
    totalInstances: Math.max(
      MIN_RESOURCE_INSTANCES,
      Math.min(MAX_RESOURCE_INSTANCES, Number(resource.totalInstances ?? 1) || 1)
    ),
  }));
}

const initialProcesses = createProcesses(3);
const initialResources = createResources(3);
const initialState = recalculateState({
  currentStep: 0,
  processCountInput: 3,
  resourceCountInput: 3,
  processes: initialProcesses,
  resources: initialResources,
  allocationMatrix: createZeroMatrix(initialProcesses.length, initialResources.length),
  maxMatrix: createZeroMatrix(initialProcesses.length, initialResources.length),
  needMatrix: [],
  availableVector: [],
  validationErrors: {},
  isSafe: null,
  blockedProcessIds: [],
  safeSequence: null,
  simulationSteps: [],
  simulationFrames: [],
  currentSimStep: 0,
  isPlaying: false,
  recoveryMode: null,
  messageLog: [],
  resourcesLocked: false,
});

export const useSimulationStore = create((set, get) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: Math.max(0, Math.min(7, step)) }),
  nextStep: () => set((state) => ({ currentStep: Math.min(7, state.currentStep + 1) })),
  previousStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

  setProcessCountInput: (count) =>
    set((state) => {
      const processCountInput = Math.max(MIN_PROCESSES, Math.min(MAX_PROCESSES, count));
      const processes = syncProcesses(state.processes, processCountInput);
      const allocationMatrix = resizeMatrix(
        state.allocationMatrix,
        processCountInput,
        state.resources.length
      );
      const maxMatrix = resizeMatrix(state.maxMatrix, processCountInput, state.resources.length);

      return recalculateState({
        ...state,
        processCountInput,
        processes,
        allocationMatrix,
        maxMatrix,
        isSafe: null,
        blockedProcessIds: [],
        safeSequence: null,
        simulationSteps: [],
        simulationFrames: [],
        currentSimStep: 0,
        isPlaying: false,
        recoveryMode: null,
        messageLog: [],
      });
    }),

  generateProcesses: () =>
    set((state) => {
      const processes = createProcesses(state.processCountInput);
      const resourceCount = state.resources.length || state.resourceCountInput;
      const resources = resourceCount > 0 ? state.resources : createResources(state.resourceCountInput);
      const next = recalculateState({
        ...state,
        processes,
        resources,
        allocationMatrix: createZeroMatrix(processes.length, resources.length),
        maxMatrix: createZeroMatrix(processes.length, resources.length),
        isSafe: null,
        blockedProcessIds: [],
        safeSequence: null,
        simulationSteps: [],
        simulationFrames: [],
        currentSimStep: 0,
        isPlaying: false,
        recoveryMode: null,
        messageLog: [],
      });

      return next;
    }),

  setResourceCountInput: (count) =>
    set((state) => {
      const resourceCountInput = Math.max(MIN_RESOURCES, Math.min(MAX_RESOURCES, count));
      const resources = Array.from({ length: resourceCountInput }, (_, index) => ({
        id: `R${index}`,
        name: state.resources[index]?.name || `R${index}`,
        totalInstances: state.resources[index]?.totalInstances || 1,
      }));
      const next = recalculateState({
        ...state,
        resourceCountInput,
        resources,
        allocationMatrix: createZeroMatrix(state.processes.length, resources.length),
        maxMatrix: createZeroMatrix(state.processes.length, resources.length),
        isSafe: null,
        blockedProcessIds: [],
        safeSequence: null,
        simulationSteps: [],
        simulationFrames: [],
        currentSimStep: 0,
        isPlaying: false,
        recoveryMode: null,
        messageLog: [],
      });
      return next;
    }),

  updateResourceField: (resourceIndex, field, value) =>
    set((state) => {
      const resources = state.resources.map((resource, index) =>
        index === resourceIndex
          ? {
              ...resource,
              [field]:
                field === 'totalInstances'
                  ? Number(value)
                  : value || `R${resourceIndex}`,
            }
          : resource
      );
      return recalculateState({
        ...state,
        resources,
      });
    }),

  lockResources: () => set({ resourcesLocked: true }),
  unlockResources: () => set({ resourcesLocked: false }),

  updateMatrixValue: (matrixName, rowIndex, colIndex, value) =>
    set((state) => {
      const requestedValue = parseMatrixInput(value);
      const nextAllocationMatrix = cloneMatrix(state.allocationMatrix);
      const nextMaxMatrix = cloneMatrix(state.maxMatrix);
      const resourceTotal = Number(state.resources[colIndex]?.totalInstances ?? 0);

      if (matrixName === 'allocation') {
        const maxAllowedByMax = Number(state.maxMatrix[rowIndex]?.[colIndex] ?? 0);
        const otherAllocated = getColumnAllocationTotal(state.allocationMatrix, colIndex, rowIndex);
        const maxAllowedByResource = Math.max(0, resourceTotal - otherAllocated);
        nextAllocationMatrix[rowIndex][colIndex] = Math.min(
          requestedValue,
          maxAllowedByMax,
          maxAllowedByResource
        );
      } else {
        const minAllowedByAllocation = Number(state.allocationMatrix[rowIndex]?.[colIndex] ?? 0);
        nextMaxMatrix[rowIndex][colIndex] = Math.max(
          minAllowedByAllocation,
          Math.min(requestedValue, resourceTotal)
        );
      }

      return recalculateState({
        ...state,
        allocationMatrix: nextAllocationMatrix,
        maxMatrix: nextMaxMatrix,
        isSafe: null,
        blockedProcessIds: [],
        safeSequence: null,
        simulationSteps: [],
        simulationFrames: [],
        currentSimStep: 0,
        isPlaying: false,
        recoveryMode: null,
        messageLog: [],
      });
    }),

  loadScenarioSnapshot: (snapshot) =>
    set((state) => {
      const processes = normalizeLoadedProcesses(snapshot?.processes);
      const resources = normalizeLoadedResources(snapshot?.resources);
      const processCount = processes.length || initialState.processes.length;
      const resourceCount = resources.length || initialState.resources.length;
      const normalizedProcesses =
        processes.length > 0 ? processes : normalizeLoadedProcesses(initialState.processes);
      const normalizedResources =
        resources.length > 0 ? resources : normalizeLoadedResources(initialState.resources);
      const allocationMatrix = resizeMatrix(
        snapshot?.allocationMatrix || [],
        processCount,
        resourceCount
      );
      const maxMatrix = resizeMatrix(snapshot?.maxMatrix || [], processCount, resourceCount);

      return recalculateState({
        ...state,
        currentStep: 3,
        processCountInput: processCount,
        resourceCountInput: resourceCount,
        processes: normalizedProcesses,
        resources: normalizedResources,
        allocationMatrix,
        maxMatrix,
        isSafe: null,
        blockedProcessIds: [],
        safeSequence: null,
        simulationSteps: [],
        simulationFrames: [],
        currentSimStep: 0,
        isPlaying: false,
        recoveryMode: null,
        messageLog: [],
        resourcesLocked: false,
      });
    }),

  runSafetyCheck: () =>
    set((state) => {
      if (Object.keys(state.validationErrors).length > 0) {
        return {
          blockedProcessIds: [],
          messageLog: [
            createMessage(
              state.messageLog.length + 1,
              '❌',
              'Validation errors must be resolved before checking system safety.',
              'error'
            ),
          ],
        };
      }

      const result = runBankersAlgorithm({
        processes: state.processes,
        allocation: state.allocationMatrix,
        max: state.maxMatrix,
        available: state.availableVector,
        resources: state.resources,
      });

      const nextMessages = result.isSafe
        ? [
            createMessage(
              1,
              '✅',
              `Safe state confirmed. Sequence: ${result.safeSequence.join(' -> ')}.`,
              'success'
            ),
          ]
        : [
            createMessage(
              1,
              '❌',
              `Unsafe state detected. Deadlocked processes: ${result.blockedProcesses.join(', ')}.`,
              'error'
            ),
          ];

      return {
        isSafe: result.isSafe,
        blockedProcessIds: result.blockedProcesses,
        safeSequence: result.safeSequence,
        simulationSteps: result.steps,
        simulationFrames: result.isSafe
          ? buildDetailedSimulationFrames({
              processes: state.processes,
              resources: state.resources,
              allocationMatrix: state.allocationMatrix,
              maxMatrix: state.maxMatrix,
              availableVector: state.availableVector,
              algorithmResult: result,
            })
          : [],
        currentSimStep: 0,
        isPlaying: false,
        recoveryMode: null,
        messageLog: nextMessages,
      };
    }),

  startSimulation: () =>
    set((state) => ({
      currentStep: 6,
      currentSimStep: 0,
      isPlaying: false,
      messageLog:
        state.simulationFrames.length > 0 ? [state.simulationFrames[0].message] : state.messageLog,
    })),

  nextSimulationStep: () =>
    set((state) => {
      if (state.simulationFrames.length === 0) {
        return {};
      }

      const nextIndex = Math.min(state.currentSimStep + 1, state.simulationFrames.length - 1);
      const frame = state.simulationFrames[nextIndex];

      return {
        currentSimStep: nextIndex,
        messageLog: state.simulationFrames.slice(0, nextIndex + 1).map((item) => item.message),
        isPlaying: nextIndex === state.simulationFrames.length - 1 ? false : state.isPlaying,
      };
    }),

  previousSimulationStep: () =>
    set((state) => {
      if (state.simulationFrames.length === 0) {
        return {};
      }

      const nextIndex = Math.max(state.currentSimStep - 1, 0);
      return {
        currentSimStep: nextIndex,
        messageLog: state.simulationFrames.slice(0, nextIndex + 1).map((item) => item.message),
        isPlaying: false,
      };
    }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setRecoveryMode: (recoveryMode) => set({ recoveryMode }),

  terminateProcess: (processId) =>
    set((state) => {
      const processIndex = state.processes.findIndex((process) => process.id === processId);
      if (processIndex < 0 || state.processes[processIndex].active === false) {
        return {};
      }

      const released = [...state.allocationMatrix[processIndex]];
      const processes = state.processes.map((process, index) =>
        index === processIndex ? { ...process, active: false, status: 'terminated' } : process
      );
      const allocationMatrix = cloneMatrix(state.allocationMatrix);
      const maxMatrix = cloneMatrix(state.maxMatrix);
      allocationMatrix[processIndex] = allocationMatrix[processIndex].map(() => 0);
      maxMatrix[processIndex] = maxMatrix[processIndex].map(() => 0);

      const recalculated = recalculateState({
        ...state,
        processes,
        allocationMatrix,
        maxMatrix,
      });

      const result = runBankersAlgorithm({
        processes: recalculated.processes,
        allocation: recalculated.allocationMatrix,
        max: recalculated.maxMatrix,
        available: recalculated.availableVector,
        resources: recalculated.resources,
      });

      const simulationFrames = result.isSafe
        ? buildDetailedSimulationFrames({
            processes: recalculated.processes,
            resources: recalculated.resources,
            allocationMatrix: recalculated.allocationMatrix,
            maxMatrix: recalculated.maxMatrix,
            availableVector: recalculated.availableVector,
            algorithmResult: result,
          })
        : [];

      return {
        ...recalculated,
        currentStep: result.isSafe ? 6 : state.currentStep,
        isSafe: result.isSafe,
        blockedProcessIds: result.blockedProcesses,
        safeSequence: result.safeSequence,
        simulationSteps: result.steps,
        simulationFrames,
        currentSimStep: 0,
        isPlaying: false,
        messageLog: [
          ...state.messageLog,
          createMessage(
            state.messageLog.length + 1,
            result.isSafe ? '✅' : '⚠️',
            `${processId} terminated. Resources [${released.join(', ')}] returned to the available pool. Re-checking safety...`,
            result.isSafe ? 'success' : 'warning'
          ),
        ],
      };
    }),

  preemptLowestPriority: () =>
    set((state) => {
      const candidates = state.processes
        .map((process, index) => ({ ...process, index }))
        .filter(
          (process) =>
            process.active !== false &&
            state.allocationMatrix[process.index].some((value) => value > 0)
        )
        .sort((left, right) => left.priority - right.priority || left.index - right.index);

      if (candidates.length === 0) {
        return {
          messageLog: [
            ...state.messageLog,
            createMessage(
              state.messageLog.length + 1,
              '❌',
              'System cannot recover. No preemption candidates remain.',
              'error'
            ),
          ],
        };
      }

      const victim = candidates[0];
      const released = [...state.allocationMatrix[victim.index]];
      const processes = state.processes.map((process, index) =>
        index === victim.index ? { ...process, active: false, status: 'preempted' } : process
      );
      const allocationMatrix = cloneMatrix(state.allocationMatrix);
      const maxMatrix = cloneMatrix(state.maxMatrix);
      allocationMatrix[victim.index] = allocationMatrix[victim.index].map(() => 0);
      maxMatrix[victim.index] = maxMatrix[victim.index].map(() => 0);

      const recalculated = recalculateState({
        ...state,
        processes,
        allocationMatrix,
        maxMatrix,
      });

      const result = runBankersAlgorithm({
        processes: recalculated.processes,
        allocation: recalculated.allocationMatrix,
        max: recalculated.maxMatrix,
        available: recalculated.availableVector,
        resources: recalculated.resources,
      });

      const noProcessesRemain = recalculated.processes.every((process) => process.active === false);
      const simulationFrames = result.isSafe
        ? buildDetailedSimulationFrames({
            processes: recalculated.processes,
            resources: recalculated.resources,
            allocationMatrix: recalculated.allocationMatrix,
            maxMatrix: recalculated.maxMatrix,
            availableVector: recalculated.availableVector,
            algorithmResult: result,
          })
        : [];

      return {
        ...recalculated,
        isSafe: result.isSafe,
        blockedProcessIds: result.blockedProcesses,
        safeSequence: result.safeSequence,
        simulationSteps: result.steps,
        simulationFrames: result.isSafe
          ? buildDetailedSimulationFrames({
              processes: recalculated.processes,
              resources: recalculated.resources,
              allocationMatrix: recalculated.allocationMatrix,
              maxMatrix: recalculated.maxMatrix,
              availableVector: recalculated.availableVector,
              algorithmResult: result,
            })
          : [],
        currentSimStep: 0,
        isPlaying: false,
        messageLog: [
          ...state.messageLog,
          createMessage(
            state.messageLog.length + 1,
            result.isSafe ? '✅' : '⚠️',
            `Preempting ${victim.id} (Priority: ${victim.priority} - lowest). Reclaiming resources [${released.join(', ')}].`,
            result.isSafe ? 'success' : 'warning'
          ),
          ...(!result.isSafe && noProcessesRemain
            ? [
                createMessage(
                  state.messageLog.length + 2,
                  '❌',
                  'System cannot recover. All processes must be restarted.',
                  'error'
                ),
              ]
            : []),
        ],
      };
    }),

  resetSimulation: () =>
    set((state) => ({
      currentSimStep: 0,
      isPlaying: false,
      messageLog:
        state.simulationFrames.length > 0 ? [state.simulationFrames[0].message] : state.messageLog,
    })),
}));
