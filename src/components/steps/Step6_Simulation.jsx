import { useEffect } from 'react';
import RAGCanvas from '../RAGCanvas';
import MessageLog from '../MessageLog';
import StepHeader from '../StepHeader';

export default function Step6_Simulation({
  processes,
  resources,
  simulationFrames,
  currentSimStep,
  isPlaying,
  messageLog,
  nextSimulationStep,
  previousSimulationStep,
  setIsPlaying,
  previousStep,
  onReturnToIntro,
}) {
  const frame = simulationFrames[currentSimStep] || simulationFrames[0];
  const isSimulationComplete =
    simulationFrames.length > 0 && currentSimStep >= simulationFrames.length - 1;

  useEffect(() => {
    if (!isPlaying || simulationFrames.length === 0 || currentSimStep >= simulationFrames.length - 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      nextSimulationStep();
    }, 1500);

    return () => window.clearInterval(timer);
  }, [currentSimStep, isPlaying, nextSimulationStep, simulationFrames.length]);

  return (
    <div className="space-y-6">
      <StepHeader
        step="6"
        title="Step-by-Step Simulation"
        description="Play, pause, and scrub through the safe execution path with the graph and system narration kept in sync."
      />

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
        <RAGCanvas
          processes={processes}
          resources={resources}
          allocationMatrix={frame?.allocationMatrix || []}
          needMatrix={frame?.needMatrix || []}
          availableVector={frame?.currentWork || []}
          completedProcessIds={frame?.completedProcessIds || []}
          currentProcess={frame?.currentProcess || null}
        />
        <MessageLog entries={messageLog} />
      </div>

      <div className="glass-panel ui-card flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="text-sm text-slate-300">
          Step {currentSimStep} / {Math.max(simulationFrames.length - 1, 0)}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={previousStep} className="nav-button nav-button--back">
            Back
          </button>
          <button type="button" onClick={previousSimulationStep} className="nav-button">
            Previous Move
          </button>
          <button type="button" onClick={() => setIsPlaying(!isPlaying)} className="nav-button nav-button--primary">
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={nextSimulationStep} className="nav-button nav-button--primary">
            Next Move
          </button>
          {isSimulationComplete ? (
            <button
              type="button"
              onClick={onReturnToIntro}
              className="nav-button nav-button--primary"
            >
              Return To Intro
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
