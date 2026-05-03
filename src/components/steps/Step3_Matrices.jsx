import MatrixTable from '../MatrixTable';

export default function Step3_Matrices({
  processes,
  resources,
  allocationMatrix,
  maxMatrix,
  needMatrix,
  availableVector,
  validationErrors,
  updateMatrixValue,
  nextStep,
  previousStep,
}) {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[2rem] border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">Step 3</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-50">Allocation and Max Matrices</h2>
        <p className="mt-3 max-w-3xl text-slate-400">
          Fill the current allocation and maximum claim values. The Need matrix and Available vector update automatically.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <MatrixTable
          matrixKey="allocation"
          title="Allocation"
          description="Current resource instances already held by each process."
          processes={processes}
          resources={resources}
          data={allocationMatrix}
          onChange={(row, col, value) => updateMatrixValue('allocation', row, col, value)}
          validationErrors={validationErrors}
        />
        <MatrixTable
          matrixKey="max"
          title="Max"
          description="Maximum demand each process may request during its lifetime."
          processes={processes}
          resources={resources}
          data={maxMatrix}
          onChange={(row, col, value) => updateMatrixValue('max', row, col, value)}
          validationErrors={validationErrors}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <MatrixTable
          matrixKey="need"
          title="Need"
          description="Derived live as Max - Allocation."
          processes={processes}
          resources={resources}
          data={needMatrix}
          readOnly
        />
        <div className="glass-panel rounded-3xl border border-white/10 p-5">
          <h3 className="text-lg font-semibold text-slate-100">Available Vector</h3>
          <div className="mt-5 space-y-3">
            {resources.map((resource, index) => (
              <div
                key={resource.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
              >
                <span className="text-slate-300">{resource.name}</span>
                <span className={`font-mono text-lg ${availableVector[index] < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {availableVector[index]}
                </span>
              </div>
            ))}
          </div>

          {Object.keys(validationErrors).length > 0 && (
            <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              Resolve red cells before advancing. Allocation must stay within Max and within resource totals.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={previousStep} className="nav-button">
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={Object.keys(validationErrors).length > 0}
          className="nav-button nav-button--primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
