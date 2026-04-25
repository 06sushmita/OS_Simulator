import { useEffect, useState } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import AllocationGraph from './components/AllocationGraph';
import MatrixTable from './components/MatrixTable';
import ResultsPanel from './components/ResultsPanel';
import {
  BANKER_DEMO,
  calculateNeed,
  checkRequest,
  cloneMatrix,
  createMatrix,
  runSafetyAlgorithm,
  validateState,
} from './bankersAlgorithm';

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function makeHighlightKeys(process, requestVector, matrixName) {
  return requestVector
    .map((amount, resourceIndex) =>
      amount > 0 ? `${matrixName}-${process}-${resourceIndex}` : null
    )
    .filter(Boolean);
}

function buildInitialState() {
  return {
    n: BANKER_DEMO.n,
    m: BANKER_DEMO.m,
    allocation: cloneMatrix(BANKER_DEMO.allocation),
    maximum: cloneMatrix(BANKER_DEMO.maximum),
    available: [...BANKER_DEMO.available],
    requestProcess: BANKER_DEMO.requestProcess,
    requestVector: [...BANKER_DEMO.requestVector],
    safetyResult: runSafetyAlgorithm(BANKER_DEMO),
  };
}

export default function App() {
  const initial = buildInitialState();
  const [theme, setTheme] = useState(getInitialTheme);
  const [n, setN] = useState(initial.n);
  const [m, setM] = useState(initial.m);
  const [allocation, setAllocation] = useState(initial.allocation);
  const [maximum, setMaximum] = useState(initial.maximum);
  const [available, setAvailable] = useState(initial.available);
  const [requestProcess, setRequestProcess] = useState(initial.requestProcess);
  const [requestVector, setRequestVector] = useState(initial.requestVector);
  const [safetyResult, setSafetyResult] = useState(initial.safetyResult);
  const [requestResult, setRequestResult] = useState(null);
  const [activeTraceIndex, setActiveTraceIndex] = useState(
    initial.safetyResult.evaluations.length > 0 ? 0 : -1
  );
  const [updatedCells, setUpdatedCells] = useState([]);
  const [updatedAvailable, setUpdatedAvailable] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const need = calculateNeed(maximum, allocation);
  const validation = validateState({
    n,
    m,
    allocation,
    maximum,
    available,
    requestProcess,
    requestVector,
  });

  const currentProcess =
    activeTraceIndex >= 0 && safetyResult?.evaluations?.[activeTraceIndex]
      ? safetyResult.evaluations[activeTraceIndex].process
      : null;

  const clearComputedState = () => {
    setSafetyResult(null);
    setRequestResult(null);
    setActiveTraceIndex(-1);
    setUpdatedCells([]);
    setUpdatedAvailable([]);
  };

  const resizeSystem = (nextN, nextM) => {
    setN(nextN);
    setM(nextM);
    setAllocation(previous => createMatrix(nextN, nextM, previous));
    setMaximum(previous => createMatrix(nextN, nextM, previous));
    setAvailable(previous =>
      Array.from({ length: nextM }, (_, resourceIndex) => previous[resourceIndex] ?? 0)
    );
    setRequestVector(previous =>
      Array.from({ length: nextM }, (_, resourceIndex) => previous[resourceIndex] ?? 0)
    );
    setRequestProcess(previous => Math.min(previous, nextN - 1));
    clearComputedState();
  };

  const loadDemo = () => {
    const next = buildInitialState();
    setN(next.n);
    setM(next.m);
    setAllocation(next.allocation);
    setMaximum(next.maximum);
    setAvailable(next.available);
    setRequestProcess(next.requestProcess);
    setRequestVector(next.requestVector);
    setSafetyResult(next.safetyResult);
    setRequestResult(null);
    setActiveTraceIndex(next.safetyResult.evaluations.length > 0 ? 0 : -1);
    setUpdatedCells([]);
    setUpdatedAvailable([]);
  };

  const updateAllocationCell = (rowIndex, columnIndex, value) => {
    setAllocation(previous => {
      const next = cloneMatrix(previous);
      next[rowIndex][columnIndex] = value;
      return next;
    });
    clearComputedState();
  };

  const updateMaximumCell = (rowIndex, columnIndex, value) => {
    setMaximum(previous => {
      const next = cloneMatrix(previous);
      next[rowIndex][columnIndex] = value;
      return next;
    });
    clearComputedState();
  };

  const updateAvailableCell = (columnIndex, value) => {
    setAvailable(previous => {
      const next = [...previous];
      next[columnIndex] = value;
      return next;
    });
    clearComputedState();
  };

  const updateRequestCell = (columnIndex, value) => {
    setRequestVector(previous => {
      const next = [...previous];
      next[columnIndex] = value;
      return next;
    });
    clearComputedState();
  };

  const updateRequestProcess = value => {
    setRequestProcess(value);
    clearComputedState();
  };

  const runAlgorithm = () => {
    if (validation.messages.length > 0) {
      return;
    }

    const result = runSafetyAlgorithm({ allocation, maximum, available });
    setSafetyResult(result);
    setRequestResult(null);
    setActiveTraceIndex(result.evaluations.length > 0 ? 0 : -1);
    setUpdatedCells([]);
    setUpdatedAvailable([]);
  };

  const checkResourceRequest = () => {
    if (validation.messages.length > 0) {
      return;
    }

    const baselineResult = runSafetyAlgorithm({ allocation, maximum, available });
    const result = checkRequest({
      allocation,
      maximum,
      available,
      process: requestProcess,
      request: requestVector,
    });

    setRequestResult(result);

    if (!result.granted) {
      setSafetyResult(result.safetyResult ?? baselineResult);
      setActiveTraceIndex((result.safetyResult ?? baselineResult).evaluations.length > 0 ? 0 : -1);
      setUpdatedCells([]);
      setUpdatedAvailable([]);
      return;
    }

    setAllocation(result.allocation);
    setAvailable(result.available);
    setRequestVector(Array.from({ length: m }, () => 0));
    setSafetyResult(result.safetyResult);
    setActiveTraceIndex(result.safetyResult.evaluations.length > 0 ? 0 : -1);
    setUpdatedCells([
      ...makeHighlightKeys(result.process, result.request, 'allocation'),
      ...makeHighlightKeys(result.process, result.request, 'need'),
    ]);
    setUpdatedAvailable(
      result.request
        .map((amount, resourceIndex) => (amount > 0 ? resourceIndex : null))
        .filter(index => index !== null)
    );
  };

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(current => (current === 'dark' ? 'light' : 'dark'))}
        processCount={n}
        resourceCount={m}
        result={safetyResult}
      />

      <div className="dashboard-layout">
        <section className="workspace workspace--input">
          <div className="workspace-heading">
            <div>
              <p className="section-kicker">Workspace A</p>
              <h2>Input Builder</h2>
            </div>
            <p className="workspace-copy">
              Everything in this column is editable input data for the current system snapshot.
            </p>
          </div>

          <InputPanel
            n={n}
            m={m}
            available={available}
            requestProcess={requestProcess}
            requestVector={requestVector}
            validation={validation}
            requestResult={requestResult}
            onProcessCountChange={value => resizeSystem(value, m)}
            onResourceCountChange={value => resizeSystem(n, value)}
            onAvailableChange={updateAvailableCell}
            onRequestProcessChange={updateRequestProcess}
            onRequestChange={updateRequestCell}
            onRun={runAlgorithm}
            onCheckRequest={checkResourceRequest}
            onReset={loadDemo}
          />

          <MatrixTable
            title="Allocation Matrix"
            description="How many instances of each resource are currently assigned to each process."
            matrixKey="allocation"
            rows={n}
            cols={m}
            data={allocation}
            editable
            onChange={updateAllocationCell}
            activeProcess={currentProcess}
            updatedCells={updatedCells}
            invalidCells={validation.matrixErrors}
            badgeLabel="Input"
            badgeTone="input"
          />

          <MatrixTable
            title="Max Matrix"
            description="The maximum claim that each process may request during execution."
            matrixKey="max"
            rows={n}
            cols={m}
            data={maximum}
            editable
            onChange={updateMaximumCell}
            activeProcess={currentProcess}
            updatedCells={[]}
            invalidCells={validation.matrixErrors}
            badgeLabel="Input"
            badgeTone="input"
          />
        </section>

        <section className="workspace workspace--output">
          <div className="workspace-heading">
            <div>
              <p className="section-kicker">Workspace B</p>
              <h2>Simulation Output</h2>
            </div>
            <p className="workspace-copy">
              This column is generated by the simulator and explains the system state step by
              step.
            </p>
          </div>

          <ResultsPanel
            result={safetyResult}
            requestResult={requestResult}
            processCount={n}
            activeStep={activeTraceIndex}
            onStepChange={setActiveTraceIndex}
            updatedAvailable={updatedAvailable}
            available={available}
          />

          <MatrixTable
            title="Need Matrix"
            description="Derived automatically as Max - Allocation. This is what each process still needs before it can finish."
            matrixKey="need"
            rows={n}
            cols={m}
            data={need}
            activeProcess={currentProcess}
            updatedCells={updatedCells}
            invalidCells={[]}
            badgeLabel="Derived"
            badgeTone="derived"
          />

          <AllocationGraph
            allocation={allocation}
            need={need}
            requestProcess={requestProcess}
            requestVector={requestVector}
            activeProcess={currentProcess}
          />
        </section>
      </div>
    </div>
  );
}
