import { AnimatePresence, motion } from 'framer-motion';
import StepProgressBar from './components/StepProgressBar';
import Step0_Intro from './components/steps/Step0_Intro';
import Step1_Processes from './components/steps/Step1_Processes';
import Step2_Resources from './components/steps/Step2_Resources';
import Step3_Matrices from './components/steps/Step3_Matrices';
import Step4_RAG from './components/steps/Step4_RAG';
import Step5_SafetyCheck from './components/steps/Step5_SafetyCheck';
import Step6_Simulation from './components/steps/Step6_Simulation';
import Step7_Recovery from './components/steps/Step7_Recovery';
import { useSimulationStore } from './store/simulationStore';

const pageTransition = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
  transition: { duration: 0.4, ease: 'easeInOut' },
};

export default function App() {
  const state = useSimulationStore();

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
      runSafetyCheck={state.runSafetyCheck}
      startSimulation={state.startSimulation}
      setCurrentStep={state.setCurrentStep}
      previousStep={state.previousStep}
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
        <StepProgressBar currentStep={state.currentStep} onJump={state.setCurrentStep} />

        <AnimatePresence mode="wait">
          <motion.div key={state.currentStep} {...pageTransition} className="flex-1">
            {steps[state.currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
