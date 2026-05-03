import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import ResourceNode from './ResourceNode';

function buildPath(fromX, fromY, toX, toY) {
  const curve = (toX - fromX) * 0.45;
  return `M ${fromX} ${fromY} C ${fromX + curve} ${fromY}, ${toX - curve} ${toY}, ${toX} ${toY}`;
}

export default function RAGCanvas({
  processes,
  resources,
  allocationMatrix,
  needMatrix,
  availableVector,
  completedProcessIds = [],
  currentProcess = null,
}) {
  const [hoveredId, setHoveredId] = useState(null);

  const processNodes = useMemo(
    () =>
      processes.map((process, index) => ({
        ...process,
        x: 120,
        y: 90 + index * 110,
      })),
    [processes]
  );

  const resourceNodes = useMemo(
    () =>
      resources.map((resource, index) => ({
        ...resource,
        x: 620,
        y: 90 + index * 120,
      })),
    [resources]
  );

  const edges = [];

  processes.forEach((process, processIndex) => {
    resources.forEach((resource, resourceIndex) => {
      if (allocationMatrix[processIndex]?.[resourceIndex] > 0) {
        edges.push({
          id: `alloc-${process.id}-${resource.id}`,
          type: 'allocation',
          processId: process.id,
          resourceId: resource.id,
          value: allocationMatrix[processIndex][resourceIndex],
        });
      }

      if (needMatrix[processIndex]?.[resourceIndex] > 0 && process.active !== false) {
        edges.push({
          id: `need-${process.id}-${resource.id}`,
          type: 'request',
          processId: process.id,
          resourceId: resource.id,
          value: needMatrix[processIndex][resourceIndex],
        });
      }
    });
  });

  const isEdgeHighlighted = (edge) =>
    hoveredId === edge.processId ||
    hoveredId === edge.resourceId ||
    hoveredId === edge.id ||
    currentProcess === edge.processId;

  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl border border-white/10 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Resource Allocation Graph</h3>
          <p className="mt-1 text-sm text-slate-400">
            Solid blue edges show held resources. Dashed amber edges show outstanding need.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
          <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1">Allocation</span>
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1">Request</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox="0 0 980 760" className="min-h-[34rem] w-full">
          <defs>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const processNode = processNodes.find((node) => node.id === edge.processId);
            const resourceNode = resourceNodes.find((node) => node.id === edge.resourceId);

            const fromX = edge.type === 'allocation' ? resourceNode.x : processNode.x + 168;
            const fromY = edge.type === 'allocation' ? resourceNode.y + 36 : processNode.y + 28;
            const toX = edge.type === 'allocation' ? processNode.x : resourceNode.x;
            const toY = edge.type === 'allocation' ? processNode.y + 28 : resourceNode.y + 36;

            return (
              <motion.g
                key={edge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onMouseEnter={() => setHoveredId(edge.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <motion.path
                  d={buildPath(fromX, fromY, toX, toY)}
                  fill="none"
                  stroke={edge.type === 'allocation' ? '#3b82f6' : '#f59e0b'}
                  strokeWidth={isEdgeHighlighted(edge) ? 3 : 2}
                  strokeDasharray={edge.type === 'request' ? '7 7' : '0'}
                  markerEnd={edge.type === 'allocation' ? 'url(#arrow-blue)' : 'url(#arrow-amber)'}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1, opacity: isEdgeHighlighted(edge) ? 1 : 0.6 }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                />
                <text
                  x={(fromX + toX) / 2}
                  y={(fromY + toY) / 2 - 8}
                  fill={edge.type === 'allocation' ? '#93c5fd' : '#fcd34d'}
                  fontSize="12"
                  textAnchor="middle"
                >
                  {edge.value}
                </text>
              </motion.g>
            );
          })}

          {processNodes.map((process) => {
            const isCompleted = completedProcessIds.includes(process.id);
            const isInactive = process.active === false;
            const isFocused = hoveredId === process.id || currentProcess === process.id;

            return (
              <motion.g
                key={process.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  filter:
                    !isCompleted && !isInactive && isFocused
                      ? 'drop-shadow(0 0 12px rgba(59,130,246,0.5))'
                      : 'none',
                }}
                onMouseEnter={() => setHoveredId(process.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <rect
                  x={process.x}
                  y={process.y}
                  width="168"
                  height="56"
                  rx="18"
                  fill={
                    isCompleted
                      ? 'rgba(34,197,94,0.16)'
                      : isInactive
                        ? 'rgba(239,68,68,0.14)'
                        : 'rgba(15,23,42,0.9)'
                  }
                  stroke={
                    isCompleted ? '#22c55e' : isInactive ? '#ef4444' : isFocused ? '#60a5fa' : 'rgba(255,255,255,0.14)'
                  }
                  strokeWidth="1.5"
                />
                <text x={process.x + 20} y={process.y + 24} fill="#f8fafc" fontSize="15" fontWeight="700">
                  {process.id}
                </text>
                <text x={process.x + 20} y={process.y + 42} fill="#94a3b8" fontSize="12">
                  Priority {process.priority}
                </text>
              </motion.g>
            );
          })}

          {resourceNodes.map((resource, resourceIndex) => {
            const allocatedCount = allocationMatrix.reduce(
              (sum, row) => sum + Number(row[resourceIndex] ?? 0),
              0
            );

            return (
              <motion.g
                key={resource.id}
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                onMouseEnter={() => setHoveredId(resource.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <ResourceNode
                  resource={resource}
                  x={resource.x}
                  y={resource.y}
                  width={220}
                  height={72}
                  availableCount={availableVector[resourceIndex]}
                  allocatedCount={allocatedCount}
                  isHighlighted={hoveredId === resource.id}
                />
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
