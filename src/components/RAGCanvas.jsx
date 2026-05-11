import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import ResourceNode, { getResourceNodeMetrics } from './ResourceNode';

const PROCESS_RADIUS = 34;

function spreadNodeY(index, count, top, bottom) {
  if (count <= 1) {
    return (top + bottom) / 2;
  }

  const step = (bottom - top) / (count - 1);
  return top + step * index;
}

function buildPath(fromX, fromY, toX, toY, bend = 0) {
  const curve = Math.max(92, Math.abs(toX - fromX) * 0.34);
  return `M ${fromX} ${fromY} C ${fromX + curve} ${fromY + bend}, ${toX - curve} ${toY + bend}, ${toX} ${toY}`;
}

function getBoundaryPoint(fromX, fromY, toX, toY, radius) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy) || 1;

  return {
    x: fromX + (dx / distance) * radius,
    y: fromY + (dy / distance) * radius,
  };
}

function getRectangleBoundaryPoint(fromX, fromY, toX, toY, halfWidth, halfHeight) {
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (dx === 0 && dy === 0) {
    return { x: fromX, y: fromY };
  }

  const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(dx);
  const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);

  return {
    x: fromX + dx * scale,
    y: fromY + dy * scale,
  };
}

function getCycleResourceIds(processes, resources, allocationMatrix, needMatrix, blockedProcessIds) {
  const blockedSet = new Set(blockedProcessIds);

  return new Set(
    resources
      .filter((resource, resourceIndex) => {
        const hasBlockedRequest = processes.some(
          (process, processIndex) =>
            blockedSet.has(process.id) &&
            process.active !== false &&
            Number(needMatrix[processIndex]?.[resourceIndex] ?? 0) > 0
        );
        const hasBlockedAllocation = processes.some(
          (process, processIndex) =>
            blockedSet.has(process.id) &&
            process.active !== false &&
            Number(allocationMatrix[processIndex]?.[resourceIndex] ?? 0) > 0
        );

        return hasBlockedRequest && hasBlockedAllocation;
      })
      .map((resource) => resource.id)
  );
}

export default function RAGCanvas({
  processes,
  resources,
  allocationMatrix,
  needMatrix,
  availableVector,
  completedProcessIds = [],
  currentProcess = null,
  blockedProcessIds = [],
  isSafe = null,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef(null);

  const graphWidth = 980;
  const graphHeight = Math.max(
    460,
    processes.length > 0 ? 220 + (processes.length - 1) * 140 : 0,
    resources.length > 0 ? 240 + (resources.length - 1) * 150 : 0
  );
  const topPadding = 88;
  const bottomPadding = graphHeight - 88;

  const processNodes = useMemo(
    () =>
      processes.map((process, index) => ({
        ...process,
        x: 150,
        y: spreadNodeY(index, processes.length, topPadding, bottomPadding),
      })),
    [bottomPadding, processes, topPadding]
  );

  const resourceNodes = useMemo(
    () =>
      resources.map((resource, index) => ({
        ...resource,
        x: 650,
        y: spreadNodeY(index, resources.length, topPadding, bottomPadding),
        ...getResourceNodeMetrics(resource.totalInstances),
      })),
    [bottomPadding, resources, topPadding]
  );

  const cycleResourceIds = useMemo(
    () => getCycleResourceIds(processes, resources, allocationMatrix, needMatrix, blockedProcessIds),
    [allocationMatrix, blockedProcessIds, needMatrix, processes, resources]
  );

  const edges = useMemo(() => {
    const blockedSet = new Set(blockedProcessIds);
    const nextEdges = [];

    processes.forEach((process, processIndex) => {
      resources.forEach((resource, resourceIndex) => {
        const allocationValue = Number(allocationMatrix[processIndex]?.[resourceIndex] ?? 0);
        const needValue = Number(needMatrix[processIndex]?.[resourceIndex] ?? 0);
        const isCycleEdge = blockedSet.has(process.id) && cycleResourceIds.has(resource.id);

        if (allocationValue > 0) {
          nextEdges.push({
            id: `alloc-${process.id}-${resource.id}`,
            type: 'allocation',
            processId: process.id,
            resourceId: resource.id,
            value: allocationValue,
            processIndex,
            resourceIndex,
            isCycleEdge,
          });
        }

        if (needValue > 0 && process.active !== false) {
          nextEdges.push({
            id: `need-${process.id}-${resource.id}`,
            type: 'request',
            processId: process.id,
            resourceId: resource.id,
            value: needValue,
            processIndex,
            resourceIndex,
            isCycleEdge,
          });
        }
      });
    });

    return nextEdges;
  }, [allocationMatrix, blockedProcessIds, cycleResourceIds, needMatrix, processes, resources]);

  const isEdgeHighlighted = (edge) =>
    hoveredId === edge.processId ||
    hoveredId === edge.resourceId ||
    hoveredId === edge.id ||
    currentProcess === edge.processId;

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return undefined;
    }

    const handleWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
        return;
      }

      event.preventDefault();
      setZoom((currentZoom) => {
        const nextZoom = currentZoom * Math.exp(-event.deltaY * 0.0012);
        return Math.max(0.55, Math.min(1.8, Number(nextZoom.toFixed(2))));
      });
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      viewport.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl border border-white/10 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Resource Allocation Graph</h3>
          <p className="mt-1 text-sm text-slate-400">
            Processes are shown as circles, resources show their instance count, and arrowheads make ownership direction explicit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
          <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1">Allocation</span>
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1">Request</span>
          <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-rose-100">Deadlock Cycle</span>
          <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
            Zoom {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <p>Hold `Ctrl`, `Shift`, or `Cmd` and use the mouse wheel to zoom the graph.</p>
        <div className="flex items-center gap-2">
          {!isSafe && blockedProcessIds.length > 0 ? (
            <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-rose-100">
              Highlighting blocked cycle: {blockedProcessIds.join(', ')}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setZoom((currentZoom) => Math.max(0.55, Number((currentZoom - 0.15).toFixed(2))))}
            className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-slate-200 transition hover:border-blue-400/40"
          >
            Zoom Out
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-slate-200 transition hover:border-blue-400/40"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setZoom((currentZoom) => Math.min(1.8, Number((currentZoom + 0.15).toFixed(2))))}
            className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-slate-200 transition hover:border-blue-400/40"
          >
            Zoom In
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative h-[26rem] overflow-auto rounded-3xl border border-white/10 bg-slate-950/35"
      >
        <svg
          viewBox={`0 0 ${graphWidth} ${graphHeight}`}
          width={graphWidth * zoom}
          height={graphHeight * zoom}
          className="block max-w-none"
        >
          <defs>
            <marker id="arrow-blue" viewBox="0 0 14 14" refX="12" refY="7" markerWidth="11" markerHeight="11" orient="auto">
              <path d="M 0 0 L 14 7 L 0 14 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 14 14" refX="12" refY="7" markerWidth="11" markerHeight="11" orient="auto">
              <path d="M 0 0 L 14 7 L 0 14 z" fill="#f59e0b" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 14 14" refX="12" refY="7" markerWidth="11" markerHeight="11" orient="auto">
              <path d="M 0 0 L 14 7 L 0 14 z" fill="#ef4444" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const processNode = processNodes.find((node) => node.id === edge.processId);
            const resourceNode = resourceNodes.find((node) => node.id === edge.resourceId);
            const fromCenter =
              edge.type === 'allocation'
                ? { x: resourceNode.x, y: resourceNode.y }
                : { x: processNode.x, y: processNode.y };
            const toCenter =
              edge.type === 'allocation'
                ? { x: processNode.x, y: processNode.y }
                : { x: resourceNode.x, y: resourceNode.y };
            const fromBoundary = getBoundaryPoint(
              fromCenter.x,
              fromCenter.y,
              toCenter.x,
              toCenter.y,
              PROCESS_RADIUS
            );
            const toBoundary =
              edge.type === 'allocation'
                ? getBoundaryPoint(toCenter.x, toCenter.y, fromCenter.x, fromCenter.y, PROCESS_RADIUS)
                : getRectangleBoundaryPoint(
                    toCenter.x,
                    toCenter.y,
                    fromCenter.x,
                    fromCenter.y,
                    resourceNode.halfWidth,
                    resourceNode.halfHeight
                  );
            const allocationFromBoundary =
              edge.type === 'allocation'
                ? getRectangleBoundaryPoint(
                    fromCenter.x,
                    fromCenter.y,
                    toCenter.x,
                    toCenter.y,
                    resourceNode.halfWidth,
                    resourceNode.halfHeight
                  )
                : fromBoundary;
            const bend =
              edge.type === 'allocation'
                ? -18 - edge.resourceIndex * 5 + edge.processIndex * 3
                : 18 + edge.processIndex * 5 - edge.resourceIndex * 3;
            const stroke = edge.isCycleEdge
              ? '#ef4444'
              : edge.type === 'allocation'
                ? '#38bdf8'
                : '#f59e0b';
            const marker = edge.isCycleEdge
              ? 'url(#arrow-red)'
              : edge.type === 'allocation'
                ? 'url(#arrow-blue)'
                : 'url(#arrow-amber)';
            const emphasized = isEdgeHighlighted(edge) || edge.isCycleEdge;

            return (
              <motion.g
                key={edge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onMouseEnter={() => setHoveredId(edge.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <motion.path
                  d={buildPath(
                    edge.type === 'allocation' ? allocationFromBoundary.x : fromBoundary.x,
                    edge.type === 'allocation' ? allocationFromBoundary.y : fromBoundary.y,
                    toBoundary.x,
                    toBoundary.y,
                    bend
                  )}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={edge.isCycleEdge ? 4 : emphasized ? 3 : 2.2}
                  strokeDasharray={edge.type === 'request' ? '8 7' : '0'}
                  strokeLinecap="round"
                  markerEnd={marker}
                  initial={{ pathLength: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: emphasized ? 1 : edge.type === 'allocation' ? 0.78 : 0.68,
                  }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                />
                <text
                  x={((edge.type === 'allocation' ? allocationFromBoundary.x : fromBoundary.x) + toBoundary.x) / 2}
                  y={((edge.type === 'allocation' ? allocationFromBoundary.y : fromBoundary.y) + toBoundary.y) / 2 + bend * 0.24 - 10}
                  fill={edge.isCycleEdge ? '#fca5a5' : edge.type === 'allocation' ? '#bae6fd' : '#fcd34d'}
                  fontSize="12"
                  fontWeight="700"
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
            const isBlocked = blockedProcessIds.includes(process.id);
            const isFocused = hoveredId === process.id || currentProcess === process.id;
            const fill = isCompleted
              ? 'rgba(34,197,94,0.16)'
              : isBlocked
                ? 'rgba(127,29,29,0.24)'
                : isInactive
                  ? 'rgba(100,116,139,0.18)'
                  : 'rgba(15,23,42,0.92)';
            const stroke = isCompleted
              ? '#22c55e'
              : isBlocked
                ? '#ef4444'
                : isInactive
                  ? '#64748b'
                  : isFocused
                    ? '#60a5fa'
                    : 'rgba(255,255,255,0.16)';

            return (
              <motion.g
                key={process.id}
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  filter:
                    isBlocked || (!isCompleted && !isInactive && isFocused)
                      ? `drop-shadow(0 0 12px ${isBlocked ? 'rgba(239,68,68,0.45)' : 'rgba(59,130,246,0.5)'})`
                      : 'none',
                }}
                onMouseEnter={() => setHoveredId(process.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <circle
                  cx={process.x}
                  cy={process.y}
                  r={PROCESS_RADIUS}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isBlocked ? 2.5 : 1.75}
                />
                <text
                  x={process.x}
                  y={process.y - 4}
                  fill="#f8fafc"
                  fontSize="15"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {process.id}
                </text>
                <text
                  x={process.x}
                  y={process.y + 14}
                  fill={isBlocked ? '#fca5a5' : '#94a3b8'}
                  fontSize="10"
                  textAnchor="middle"
                >
                  {isCompleted ? 'Completed' : isInactive ? 'Stopped' : `Priority ${process.priority}`}
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
                  availableCount={Math.max(0, Number(availableVector[resourceIndex] ?? 0))}
                  allocatedCount={allocatedCount}
                  isHighlighted={hoveredId === resource.id}
                  isInCycle={cycleResourceIds.has(resource.id)}
                />
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
