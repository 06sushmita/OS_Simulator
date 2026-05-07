import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthScreen from './components/AuthScreen';
import HistoryComparisonPanel from './components/HistoryComparisonPanel';
import ProjectOverview from './components/ProjectOverview';
import StepProgressBar from './components/StepProgressBar';
import Step0_Intro from './components/steps/Step0_Intro';
import Step1_Processes from './components/steps/Step1_Processes';
import Step2_Resources from './components/steps/Step2_Resources';
import Step3_Matrices from './components/steps/Step3_Matrices';
import Step4_RAG from './components/steps/Step4_RAG';
import Step5_SafetyCheck from './components/steps/Step5_SafetyCheck';
import Step6_Simulation from './components/steps/Step6_Simulation';
import Step7_Recovery from './components/steps/Step7_Recovery';
import { auth } from './firebase';
import {
  createHistoryEntryFromState,
  loadUserHistory,
  saveUserHistory,
} from './services/historyService';
import { useSimulationStore } from './store/simulationStore';

const pageTransition = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
  transition: { duration: 0.4, ease: 'easeInOut' },
};

export default function App() {
  const state = useSimulationStore();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyNotice, setHistoryNotice] = useState('');
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [currentScenarioEntry, setCurrentScenarioEntry] = useState(null);
  const activeProcessCount = state.processes.filter((process) => process.active !== false).length;
  const freeInstanceCount = state.availableVector.reduce(
    (sum, value) => sum + Math.max(0, Number(value ?? 0)),
    0
  );
  const safetyLabel =
    state.isSafe === null ? 'Ready' : state.isSafe ? 'Safe' : 'Unsafe';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setIsSigningOut(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setHistoryEntries([]);
      setHistoryLoaded(false);
      setHistoryNotice('');
      setIsSavingHistory(false);
      setCurrentScenarioEntry(null);
      return undefined;
    }

    let cancelled = false;
    setHistoryLoaded(false);

    loadUserHistory(user.uid).then(({ entries, notice }) => {
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
  }, [user]);

  useEffect(() => {
    if (state.isSafe === null) {
      setCurrentScenarioEntry(null);
    }
  }, [state.isSafe]);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut(auth);
      state.restartWorkspace();
    } catch {
      setIsSigningOut(false);
    }
  }

  async function handleRunSafetyCheck() {
    if (Object.keys(state.validationErrors).length > 0) {
      state.runSafetyCheck();
      return;
    }

    const historyEntry = createHistoryEntryFromState(state);
    state.runSafetyCheck();
    setCurrentScenarioEntry(historyEntry);

    if (!user?.uid) {
      return;
    }

    setIsSavingHistory(true);

    try {
      const { entries, notice } = await saveUserHistory(user.uid, historyEntry);
      setHistoryEntries(entries);
      setHistoryNotice(notice || '');
    } finally {
      setIsSavingHistory(false);
      setHistoryLoaded(true);
    }
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-slate-100">
        <div className="glass-panel w-full max-w-md rounded-[2rem] border border-white/10 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Authenticating</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-50">Preparing your workspace</h1>
          <p className="mt-3 text-slate-400">
            Firebase is checking your session so we can open the simulator safely.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const userLabel = user.displayName || user.email || 'Authenticated User';

  const steps = [
    <Step0_Intro key={0} onBegin={() => state.setCurrentStep(1)} />,
    <Step1_Processes
      key={1}
      processCountInput={state.processCountInput}
      processes={state.processes}
      resources={state.resources}
      allocationMatrix={state.allocationMatrix}
      setProcessCountInput={state.setProcessCountInput}
      generateProcesses={state.generateProcesses}
      nextStep={state.nextStep}
      previousStep={state.previousStep}
    />,
    <Step2_Resources
      key={2}
      resourceCountInput={state.resourceCountInput}
      resources={state.resources}
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
      historyPanel={
        <HistoryComparisonPanel
          currentScenario={currentScenarioEntry}
          historyEntries={historyEntries}
          isLoading={!historyLoaded}
          isSaving={isSavingHistory}
          notice={historyNotice}
        />
      }
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
    />,
    <Step7_Recovery
      key={7}
      processes={state.processes}
      resources={state.resources}
      allocationMatrix={state.allocationMatrix}
      needMatrix={state.needMatrix}
      availableVector={state.availableVector}
      messageLog={state.messageLog}
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
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col">
        <StepProgressBar
          currentStep={state.currentStep}
          onJump={state.setCurrentStep}
          processCount={state.processes.length}
          resourceCount={state.resources.length}
          safetyLabel={safetyLabel}
          onRestart={state.restartWorkspace}
          userLabel={userLabel}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />

        {state.currentStep > 0 ? (
          <ProjectOverview
            processCount={state.processes.length}
            activeProcessCount={activeProcessCount}
            resourceCount={state.resources.length}
            freeInstanceCount={freeInstanceCount}
            safetyLabel={safetyLabel}
          />
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div key={state.currentStep} {...pageTransition} className="flex-1">
            {steps[state.currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
