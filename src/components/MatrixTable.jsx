import { motion } from 'framer-motion';

export default function MatrixTable({
  matrixKey,
  title,
  description,
  processes,
  resources,
  data,
  onChange,
  readOnly = false,
  validationErrors = {},
}) {
  return (
    <div className="glass-panel overflow-hidden rounded-3xl border border-white/10">
      <div className="border-b border-white/10 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>

      <div className="overflow-x-auto">
        <motion.table
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="min-w-full text-sm"
        >
          <thead>
            <tr className="border-b border-white/10 bg-slate-900/50 text-slate-300">
              <th className="px-4 py-3 text-left font-medium">Process</th>
              {resources.map((resource, colIndex) => {
                const columnHasTotalError =
                  matrixKey === 'allocation' && validationErrors[`resource-total-${colIndex}`];

                return (
                  <th
                    key={resource.id}
                    className={`px-4 py-3 text-center font-medium ${
                      columnHasTotalError ? 'text-rose-300' : ''
                    }`}
                  >
                    <div>{resource.name}</div>
                    <div className="mt-1 text-[11px] font-normal uppercase tracking-[0.18em] text-slate-500">
                      Total {resource.totalInstances}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {processes.map((process, rowIndex) => (
              <motion.tr
                key={process.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="border-b border-white/5 last:border-b-0"
              >
                <td className="px-4 py-3 font-medium text-slate-200">{process.id}</td>
                {resources.map((resource, colIndex) => {
                  const cellError =
                    matrixKey === 'allocation'
                      ? validationErrors[`allocation-${rowIndex}-${colIndex}`] ||
                        validationErrors[`resource-total-${colIndex}`]
                      : matrixKey === 'max'
                        ? validationErrors[`max-${rowIndex}-${colIndex}`]
                        : null;
                  const isInvalid = Boolean(cellError);

                  return (
                    <td key={resource.id} className="px-4 py-3">
                      {readOnly ? (
                        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/8 px-3 py-2 text-center font-mono text-slate-100">
                          {data[rowIndex][colIndex]}
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={data[rowIndex][colIndex]}
                          onChange={(event) => onChange(rowIndex, colIndex, event.target.value)}
                          className={`w-20 rounded-2xl border px-3 py-2 text-center font-mono text-slate-100 outline-none transition ${
                            isInvalid
                              ? 'border-rose-400/70 bg-rose-500/12 shadow-[0_0_14px_rgba(239,68,68,0.18)]'
                              : 'border-white/10 bg-slate-950/70 focus:border-blue-400/70 focus:bg-blue-500/10'
                          }`}
                          title={cellError || ''}
                        />
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
      </div>

      {!readOnly && Object.keys(validationErrors).length > 0 ? (
        <div className="border-t border-white/10 px-5 py-4 text-sm text-slate-400">
          {matrixKey === 'allocation' && (
            <p>
              Allocation must not exceed the matching Max entry, and each resource column must stay
              within its configured total instances.
            </p>
          )}
          {matrixKey === 'max' && (
            <p>
              Max must be greater than or equal to Allocation, and it cannot exceed the total
              instances configured for that resource.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
