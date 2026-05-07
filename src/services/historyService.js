import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { runBankersAlgorithm } from '../algorithms/bankersAlgorithm';
import { db } from '../firebase';

const HISTORY_LIMIT = 12;
const STORAGE_PREFIX = 'deadlock-history:';

function toNumber(value) {
  return Math.max(0, Number(value ?? 0));
}

function cloneMatrix(matrix = []) {
  return matrix.map((row) => row.map((value) => toNumber(value)));
}

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

function createSignature({ processes, resources, allocationMatrix, maxMatrix }) {
  return JSON.stringify({
    processes: processes.map((process) => ({
      id: process.id,
      priority: toNumber(process.priority),
      active: process.active !== false,
    })),
    resources: resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      totalInstances: toNumber(resource.totalInstances),
    })),
    allocationMatrix,
    maxMatrix,
  });
}

function buildAnalysis(processes, resources, allocationMatrix, maxMatrix, availableVector) {
  return runBankersAlgorithm({
    processes,
    resources,
    allocation: allocationMatrix,
    max: maxMatrix,
    available: availableVector,
  });
}

function readLocalHistory(userId) {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(getStorageKey(userId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(userId, entries) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(entries));
  } catch {
    // Ignore local persistence failures and continue with the live session.
  }
}

function normalizeHistoryEntry(entry, fallbackId) {
  const createdAtClient =
    entry.createdAtClient ||
    (typeof entry.createdAt?.toDate === 'function'
      ? entry.createdAt.toDate().toISOString()
      : new Date().toISOString());

  return {
    id: entry.id || fallbackId,
    createdAtClient,
    signature: entry.signature || `${fallbackId}-${createdAtClient}`,
    summary: entry.summary || {},
    snapshot: entry.snapshot || {},
  };
}

function mergeHistoryEntries(...historyGroups) {
  const seen = new Set();
  const merged = [];

  historyGroups.flat().forEach((entry, index) => {
    const normalized = normalizeHistoryEntry(entry, `history-${index}`);
    const key = `${normalized.signature}:${normalized.createdAtClient}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(normalized);
  });

  return merged
    .sort((left, right) => new Date(right.createdAtClient) - new Date(left.createdAtClient))
    .slice(0, HISTORY_LIMIT);
}

export function createHistoryEntryFromState(state) {
  const processes = state.processes.map((process) => ({
    id: process.id,
    name: process.name,
    priority: toNumber(process.priority),
    active: process.active !== false,
    status: process.status || 'ready',
  }));
  const resources = state.resources.map((resource, index) => ({
    id: resource.id,
    name: resource.name || `R${index}`,
    totalInstances: toNumber(resource.totalInstances),
  }));
  const allocationMatrix = cloneMatrix(state.allocationMatrix);
  const maxMatrix = cloneMatrix(state.maxMatrix);
  const availableVector = resources.map((_, index) => toNumber(state.availableVector[index]));
  const analysis = buildAnalysis(
    processes,
    resources,
    allocationMatrix,
    maxMatrix,
    availableVector
  );
  const totalResourceInstances = resources.reduce(
    (sum, resource) => sum + resource.totalInstances,
    0
  );
  const totalAllocatedInstances = allocationMatrix.flat().reduce((sum, value) => sum + value, 0);
  const totalRemainingNeed = analysis.needMatrix
    .flat()
    .reduce((sum, value) => sum + toNumber(value), 0);
  const createdAtClient = new Date().toISOString();
  const signature = createSignature({
    processes,
    resources,
    allocationMatrix,
    maxMatrix,
  });

  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAtClient,
    signature,
    summary: {
      label: `${processes.length}P / ${resources.length}R / ${analysis.isSafe ? 'Safe' : 'Unsafe'}`,
      isSafe: analysis.isSafe,
      processCount: processes.length,
      activeProcessCount: processes.filter((process) => process.active !== false).length,
      resourceCount: resources.length,
      totalResourceInstances,
      totalAllocatedInstances,
      totalRemainingNeed,
      blockedCount: analysis.blockedProcesses.length,
      blockedProcesses: analysis.blockedProcesses,
      safeSequence: analysis.safeSequence,
      availableVector,
      resourceNames: resources.map((resource) => resource.name),
      resourceTotals: resources.map((resource) => resource.totalInstances),
    },
    snapshot: {
      processes,
      resources,
      allocationMatrix,
      maxMatrix,
      needMatrix: analysis.needMatrix,
      availableVector,
      analysis: {
        isSafe: analysis.isSafe,
        safeSequence: analysis.safeSequence,
        blockedProcesses: analysis.blockedProcesses,
        finalWork: analysis.finalWork,
      },
    },
  };
}

export async function loadUserHistory(userId) {
  const localEntries = mergeHistoryEntries(readLocalHistory(userId));

  try {
    const historyQuery = query(
      collection(db, 'users', userId, 'scenarioHistory'),
      orderBy('createdAt', 'desc'),
      limit(HISTORY_LIMIT)
    );
    const snapshot = await getDocs(historyQuery);
    const remoteEntries = snapshot.docs.map((doc) =>
      normalizeHistoryEntry({ id: doc.id, ...doc.data() }, doc.id)
    );
    const mergedEntries = mergeHistoryEntries(localEntries, remoteEntries);
    writeLocalHistory(userId, mergedEntries);

    return {
      entries: mergedEntries,
      notice: null,
    };
  } catch {
    return {
      entries: localEntries,
      notice:
        localEntries.length > 0
          ? 'Cloud history is unavailable right now. Showing the scenarios saved in this browser.'
          : 'Cloud history is unavailable right now. New safety checks will still be stored in this browser.',
    };
  }
}

export async function saveUserHistory(userId, entry) {
  const localEntries = mergeHistoryEntries([entry], readLocalHistory(userId));
  writeLocalHistory(userId, localEntries);

  try {
    await addDoc(collection(db, 'users', userId, 'scenarioHistory'), {
      createdAt: serverTimestamp(),
      createdAtClient: entry.createdAtClient,
      signature: entry.signature,
      summary: entry.summary,
      snapshot: entry.snapshot,
    });

    return {
      entries: localEntries,
      notice: null,
    };
  } catch {
    return {
      entries: localEntries,
      notice:
        'Cloud sync is unavailable right now. This scenario was still stored in the current browser history.',
    };
  }
}
