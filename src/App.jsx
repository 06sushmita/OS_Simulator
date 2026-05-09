import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HistorySidebar from './components/HistorySidebar';
import StepProgressBar from './components/StepProgressBar';
import Step0_Intro from './components/steps/Step0_Intro';
import Step1_Processes from './components/steps/Step1_Processes';
import Step2_Resources from './components/steps/Step2_Resources';
import Step3_Matrices from './components/steps/Step3_Matrices';
import Step4_RAG from './components/steps/Step4_RAG';
import Step5_SafetyCheck from './components/steps/Step5_SafetyCheck';
import Step6_Simulation from './components/steps/Step6_Simulation';
import Step7_Recovery from './components/steps/Step7_Recovery';
import {
  createHistoryEntryFromState,
  loadUserHistory,
  saveUserHistory,
} from './services/historyService';
import { useSimulationStore } from './store/simulationStore';

const VISITOR_ID_STORAGE_KEY = 'deadlock-visitor-id';

function getOrCreateVisitorId() {
  if (typeof window === 'undefined') {
    return 'visitor-server';
  }

  const existingId = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
  if (existingId) {
    return existingId;
  }

  const generatedId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, generatedId);
  return generatedId;
}

const pageTransition = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.4, ease: 'easeInOut' },
};

export default function App() {
  const state = useSimulationStore();
  const [visitorId, setVisitorId] = useState('');
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyNotice, setHistoryNotice] = useState('');
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  useEffect(() => {
    if (!visitorId) {
      setHistoryEntries([]);
      setHistoryLoaded(false);
      setHistoryNotice('');
      setIsSavingHistory(false);
      return undefined;
    }

    let cancelled = false;
    setHistoryLoaded(false);

    loadUserHistory(visitorId).then(({ entries, notice }) => {
      if (cancelled) {
        return;
      }

      setHistoryEntries(entries);
      setHistoryNotice(notice || '');
      setHistoryLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [visitorId]);

  async function handleRunSafetyCheck() {
    if (Object.keys(state.validationErrors).length > 0) {
      state.runSafetyCheck();
      return;
    }

    const historyEntry = createHistoryEntryFromState(state);
    state.runSafetyCheck();

    if (!visitorId) {
      return;
    }

    setIsSavingHistory(true);

    try {
      const { entries, notice } = await saveUserHistory(visitorId, historyEntry);
      setHistoryEntries(entries);
      setHistoryNotice(notice || '');
    } finally {
      setIsSavingHistory(false);
      setHistoryLoaded(true);
    }
  }

  async function refreshHistory() {
    if (!visitorId) {
      return;
    }

    setHistoryLoaded(false);
    const { entries, notice } = await loadUserHistory(visitorId);
    setHistoryEntries(entries);
    setHistoryNotice(notice || '');
    setHistoryLoaded(true);
  }

  async function handleOpenHistoryDrawer() {
    setIsHistoryDrawerOpen(true);

    if (!historyLoaded && visitorId) {
      await refreshHistory();
      return;
    }

    if (visitorId) {
      refreshHistory();
    }
  }

  function handleLoadHistoryEntry(entry) {
    state.loadScenarioSnapshot(entry.snapshot);
    setIsHistoryDrawerOpen(false);
  }

  if (!visitorId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-slate-100">
        <div className="glass-panel w-full max-w-md rounded-[2rem] border border-white/10 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Preparing</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-50">Opening your workspace</h1>
          <p className="mt-3 text-slate-400">
            Setting up your browser ID so your simulator inputs can be saved separately.
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    <Step0_Intro key={0} onBegin={() => state.setCurrentStep(1)} />,
    <Step1_Processes
      key={1}
      processCountInput={state.processCountInput}
      processes={state.processes}
      resources={state.resources}
      allocationMatrix={state.allocationMatrix}
      setProcessCountInput={state.setProcessCountInput}
      nextStep={state.nextStep}
      previousStep={state.previousStep}
    />,
    <Step2_Resources
      key={2}
      resourceCountInput={state.resourceCountInput}
      resources={state.resources}
      validationErrors={state.validationErrors}
      setResourceCountInput={state.setResourceCountInput}
      updateResourceField={state.updateResourceField}
      lockResources={state.lockResources}
      unlockResources={state.unlockResources}
      resourcesLocked={state.resourcesLocked}
      nextStep={state.nextStep}
      previousStep={state.previousStep}
    />,
    <Step3_Matrices
      key={3}
      processes={state.processes}
      resources={state.resources}
      allocationMatrix={state.allocationMatrix}
      maxMatrix={state.maxMatrix}
      needMatrix={state.needMatrix}
      availableVector={state.availableVector}
      validationErrors={state.validationErrors}
      updateMatrixValue={state.updateMatrixValue}
      nextStep={state.nextStep}
      previousStep={state.previousStep}
    />,
    <Step4_RAG
      key={4}
      processes={state.processes}
      resources={state.resources}
      allocationMatrix={state.allocationMatrix}
      needMatrix={state.needMatrix}
      availableVector={state.availableVector}
      nextStep={state.nextStep}
      previousStep={state.previousStep}
    />,
    <Step5_SafetyCheck
      key={5}
      processes={state.processes}
      resources={state.resources}
      allocationMatrix={state.allocationMatrix}
      needMatrix={state.needMatrix}
      availableVector={state.availableVector}
      isSafe={state.isSafe}
      safeSequence={state.safeSequence}
      simulationSteps={state.simulationSteps}
      runSafetyCheck={handleRunSafetyCheck}
      startSimulation={state.startSimulation}
      setCurrentStep={state.setCurrentStep}
      previousStep={state.previousStep}
      isSavingHistory={isSavingHistory}
    />,
    <Step6_Simulation
      key={6}
      processes={state.processes}
      resources={state.resources}
      simulationFrames={state.simulationFrames}
      currentSimStep={state.currentSimStep}
      isPlaying={state.isPlaying}
      messageLog={state.messageLog}
      nextSimulationStep={state.nextSimulationStep}
      previousSimulationStep={state.previousSimulationStep}
      resetSimulation={state.resetSimulation}
      setIsPlaying={state.setIsPlaying}
      previousStep={state.previousStep}
      onReturnToIntro={state.restartWorkspace}
    />,
    <Step7_Recovery
      key={7}
      processes={state.processes}
      resources={state.resources}
      allocationMatrix={state.allocationMatrix}
      needMatrix={state.needMatrix}
      availableVector={state.availableVector}
      messageLog={state.messageLog}
      blockedProcessIds={state.blockedProcessIds}
      simulationSteps={state.simulationSteps}
      setRecoveryMode={state.setRecoveryMode}
      recoveryMode={state.recoveryMode}
      terminateProcess={state.terminateProcess}
      preemptLowestPriority={state.preemptLowestPriority}
      isSafe={state.isSafe}
      safeSequence={state.safeSequence}
      startSimulation={state.startSimulation}
      previousStep={state.previousStep}
    />,
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#0f172a_35%,#111827_100%)] px-4 py-4 text-slate-100 md:px-6 xl:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.1),transparent_24%)]" />
      <button
        type="button"
        onClick={handleOpenHistoryDrawer}
        className="fixed left-4 top-4 z-30 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-100 shadow-[0_12px_30px_rgba(2,6,23,0.38)] transition hover:border-cyan-400/40 hover:bg-slate-900 md:left-6 md:top-6 xl:left-8 xl:top-8"
      >
        History
      </button>
      <HistorySidebar
        isOpen={isHistoryDrawerOpen}
        historyEntries={historyEntries}
        isLoading={!historyLoaded}
        notice={historyNotice}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onLoadEntry={handleLoadHistoryEntry}
      />
      <div
        className={`relative mx-auto flex min-h-screen flex-col ${
          state.currentStep === 0
            ? 'max-w-none items-center justify-center'
            : 'max-w-7xl'
        }`}
      >
        {state.currentStep > 0 ? (
          <StepProgressBar
            currentStep={state.currentStep}
            onJump={state.setCurrentStep}
          />
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            {...pageTransition}
            className={state.currentStep === 0 ? 'flex w-full flex-1 items-center justify-center' : 'flex-1'}
          >
            {steps[state.currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
