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
  const [activeStep, setActiveStep] = useState(
    initial.safetyResult.steps.length > 0 ? 0 : -1
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
    activeStep >= 0 && safetyResult?.steps?.[activeStep]
      ? safetyResult.steps[activeStep].process
      : null;

  const clearComputedState = () => {
    setSafetyResult(null);
    setRequestResult(null);
    setActiveStep(-1);
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
    setActiveStep(next.safetyResult.steps.length > 0 ? 0 : -1);
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
    setActiveStep(result.steps.length > 0 ? 0 : -1);
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
      setSafetyResult(baselineResult);
      setActiveStep(baselineResult.steps.length > 0 ? 0 : -1);
      setUpdatedCells([]);
      setUpdatedAvailable([]);
      return;
    }

    setAllocation(result.allocation);
    setAvailable(result.available);
    setRequestVector(Array.from({ length: m }, () => 0));
    setSafetyResult(result.safetyResult);
    setActiveStep(result.safetyResult.steps.length > 0 ? 0 : -1);
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
      />

      <div className="dashboard-layout">
        <aside className="dashboard-column">
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
        </aside>

        <main className="dashboard-column dashboard-column--wide">
          <div className="matrix-stack">
            <MatrixTable
              title="Allocation Matrix"
              description="Resources currently allocated to each process."
              matrixKey="allocation"
              rows={n}
              cols={m}
              data={allocation}
              editable
              onChange={updateAllocationCell}
              activeProcess={currentProcess}
              updatedCells={updatedCells}
              invalidCells={validation.matrixErrors}
            />
            <MatrixTable
              title="Max Matrix"
              description="Maximum claim declared by each process."
              matrixKey="max"
              rows={n}
              cols={m}
              data={maximum}
              editable
              onChange={updateMaximumCell}
              activeProcess={currentProcess}
              updatedCells={[]}
              invalidCells={validation.matrixErrors}
            />
            <MatrixTable
              title="Need Matrix"
              description="Remaining demand calculated as Max - Allocation."
              matrixKey="need"
              rows={n}
              cols={m}
              data={need}
              activeProcess={currentProcess}
              updatedCells={updatedCells}
              invalidCells={[]}
            />
            <AllocationGraph
              allocation={allocation}
              need={need}
              requestProcess={requestProcess}
              requestVector={requestVector}
              activeProcess={currentProcess}
            />
          </div>
        </main>

        <aside className="dashboard-column">
          <ResultsPanel
            result={safetyResult}
            requestResult={requestResult}
            processCount={n}
            activeStep={activeStep}
            onStepChange={setActiveStep}
            updatedAvailable={updatedAvailable}
            available={available}
          />
        </aside>
      </div>
    </div>
  );
}
