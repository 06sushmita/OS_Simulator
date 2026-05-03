import { useEffect } from 'react';
import RAGCanvas from '../RAGCanvas';
import MessageLog from '../MessageLog';

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
}) {
  const frame = simulationFrames[currentSimStep] || simulationFrames[0];

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
      <div className="glass-panel rounded-[2rem] border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Step 6</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-50">Step-by-Step Simulation</h2>
      </div>

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

      <div className="glass-panel flex flex-col gap-4 rounded-3xl border border-white/10 p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="text-sm text-slate-300">
          Step {currentSimStep} / {Math.max(simulationFrames.length - 1, 0)}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={previousStep} className="nav-button">
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
        </div>
      </div>
    </div>
  );
}
