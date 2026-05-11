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
    <div className="glass-panel ui-card flex min-h-0 max-h-[34rem] flex-col overflow-hidden shadow-[0_20px_50px_rgba(2,6,23,0.28)] xl:max-h-[calc(100vh-15rem)]">
      <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(15,23,42,0.4))] px-5 py-5">
        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
          {title} Matrix
        </div>
        <h3 className="mt-3 text-[22px] font-semibold text-slate-50">{title}</h3>
        {description ? <p className="ui-body mt-2 max-w-xl">{description}</p> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <motion.table
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="min-w-full border-separate border-spacing-0 text-sm"
        >
          <thead>
            <tr className="border-b border-white/10 bg-slate-950/35 text-slate-300">
              <th className="px-4 py-4 text-left text-base font-semibold text-slate-200">Process</th>
              {resources.map((resource, colIndex) => {
                const columnHasTotalError =
                  matrixKey === 'allocation' && validationErrors[`resource-total-${colIndex}`];

                return (
                  <th
                    key={resource.id}
                    className={`px-4 py-4 text-center ${
                      columnHasTotalError ? 'text-rose-300' : ''
                    }`}
                  >
                    <div className="text-base font-semibold text-slate-200">{resource.name}</div>
                    <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
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
                className="bg-white/[0.01] transition hover:bg-white/[0.03]"
              >
                <td className="border-t border-white/6 px-4 py-4">
                  <span className="inline-flex min-w-14 justify-center rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-2 font-semibold text-blue-100">
                    {process.id}
                  </span>
                </td>
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
                    <td key={resource.id} className="border-t border-white/6 px-4 py-4">
                      {readOnly ? (
                        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/8 px-3 py-3 text-center font-mono text-base text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                          {data[rowIndex][colIndex]}
                        </div>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={data[rowIndex][colIndex]}
                          onFocus={(event) => event.target.select()}
                          onChange={(event) => onChange(rowIndex, colIndex, event.target.value)}
                          className={`w-24 rounded-2xl border px-3 py-3 text-center font-mono text-base text-slate-100 outline-none transition ${
                            isInvalid
                              ? 'border-rose-400/70 bg-rose-500/12 shadow-[0_0_14px_rgba(239,68,68,0.18)]'
                              : 'border-white/10 bg-slate-950/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus:border-blue-400/70 focus:bg-blue-500/10 focus:shadow-[0_0_18px_rgba(59,130,246,0.16)]'
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
        <div className="border-t border-white/8 bg-slate-950/20 px-6 py-4 text-sm text-slate-400">
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
