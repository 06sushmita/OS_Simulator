import RAGCanvas from '../RAGCanvas';

export default function Step4_RAG({
  processes,
  resources,
  allocationMatrix,
  needMatrix,
  availableVector,
  nextStep,
  previousStep,
}) {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[2rem] border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Step 4</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-50">Resource Allocation Graph</h2>
        <p className="mt-3 max-w-3xl text-slate-400">
          This graph maps held resources and unresolved requests directly from the matrices.
        </p>
      </div>
      <RAGCanvas
        processes={processes}
        resources={resources}
        allocationMatrix={allocationMatrix}
        needMatrix={needMatrix}
        availableVector={availableVector}
      />
      <div className="flex justify-between">
        <button type="button" onClick={previousStep} className="nav-button">
          Back
        </button>
        <button type="button" onClick={nextStep} className="nav-button nav-button--primary">
          Next
        </button>
      </div>
    </div>
  );
}
