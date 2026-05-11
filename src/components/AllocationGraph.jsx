function ProcessNode({ x, y, label, active }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="-62"
        y="-26"
        width="124"
        height="52"
        rx="18"
        className={active ? 'graph-node graph-node--process-active' : 'graph-node graph-node--process'}
      />
      <text className="graph-node__title" textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
    </g>
  );
}

function ResourceNode({ x, y, label }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="26" className="graph-node graph-node--resource" />
      <text className="graph-node__title" textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
    </g>
    );
}

function EdgeLabel({ x, y, text, variant, subtle = false }) {
  return (
    <g transform={`translate(${x}, ${y})`} className={subtle ? 'graph-label graph-label--subtle' : 'graph-label'}>
      <rect
        x="-15"
        y="-10"
        width="30"
        height="20"
        rx="10"
        className={variant === 'request' ? 'graph-chip graph-chip--request' : 'graph-chip graph-chip--allocation'}
      />
      <text className="graph-chip__text" textAnchor="middle" dominantBaseline="middle">
        {text}
      </text>
    </g>
  );
}

function makeNodeSlots(count, spacing) {
  return Array.from({ length: count }, (_, index) => (index - (count - 1) / 2) * spacing);
}

function getCurvePoint(x1, y1, c1x, c1y, c2x, c2y, x2, y2, t) {
  const inverse = 1 - t;
  const x =
    inverse ** 3 * x1 +
    3 * inverse ** 2 * t * c1x +
    3 * inverse * t ** 2 * c2x +
    t ** 3 * x2;
  const y =
    inverse ** 3 * y1 +
    3 * inverse ** 2 * t * c1y +
    3 * inverse * t ** 2 * c2y +
    t ** 3 * y2;

  return { x, y };
}

function CurveEdge({
  fromX,
  fromY,
  toX,
  toY,
  lane,
  markerEnd,
  className,
  label,
  labelVariant,
  labelAt,
  subtleLabel = false,
}) {
  const controlOffset = Math.max(88, Math.abs(toX - fromX) * 0.24);
  const c1x = fromX + controlOffset;
  const c2x = toX - controlOffset;
  const c1y = fromY + lane;
  const c2y = toY + lane;
  const path = `M ${fromX} ${fromY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toX} ${toY}`;
  const labelPoint = label
    ? getCurvePoint(fromX, fromY, c1x, c1y, c2x, c2y, toX, toY, labelAt)
    : null;

  return (
    <g>
      <path d={path} markerEnd={markerEnd} className={className} />
      {labelPoint ? (
        <EdgeLabel
          x={labelPoint.x}
          y={labelPoint.y}
          text={label}
          variant={labelVariant}
          subtle={subtleLabel}
        />
      ) : null}
    </g>
  );
}

export default function AllocationGraph({
  allocation,
  need,
  requestProcess,
  requestVector,
  activeProcess,
}) {
  const processCount = allocation.length;
  const resourceCount = allocation[0]?.length ?? 0;
  const width = 760;
  const height = Math.max(360, Math.max(processCount, resourceCount) * 82 + 96);
  const processX = 162;
  const resourceX = width - 118;
  const processNodeWidth = 124;
  const resourceNodeRadius = 26;

  const processNodes = Array.from({ length: processCount }, (_, index) => ({
    x: processX,
    y: 76 + index * ((height - 152) / Math.max(processCount - 1, 1)),
    label: `P${index}`,
  }));

  const resourceNodes = Array.from({ length: resourceCount }, (_, index) => ({
    x: resourceX,
    y: 76 + index * ((height - 152) / Math.max(resourceCount - 1, 1)),
    label: `R${index}`,
  }));

  const processAllocationSlots = processNodes.map(() => makeNodeSlots(resourceCount, 10));
  const processNeedSlots = processNodes.map(() => makeNodeSlots(resourceCount, 10));
  const resourceAllocationSlots = resourceNodes.map(() => makeNodeSlots(processCount, 8));
  const resourceNeedSlots = resourceNodes.map(() => makeNodeSlots(processCount, 8));

  const allocationEdges = [];
  const needEdges = [];

  for (let processIndex = 0; processIndex < processCount; processIndex += 1) {
    for (let resourceIndex = 0; resourceIndex < resourceCount; resourceIndex += 1) {
      const allocationValue = allocation[processIndex][resourceIndex];
      const needValue = need[processIndex][resourceIndex];
      const requestValue = processIndex === requestProcess ? requestVector[resourceIndex] ?? 0 : 0;

      if (allocationValue > 0) {
        allocationEdges.push({
          fromX: resourceNodes[resourceIndex].x - resourceNodeRadius,
          fromY: resourceNodes[resourceIndex].y + resourceAllocationSlots[resourceIndex][processIndex],
          toX: processNodes[processIndex].x + processNodeWidth / 2,
          toY: processNodes[processIndex].y + processAllocationSlots[processIndex][resourceIndex],
          value: allocationValue,
          lane: -16 - resourceIndex * 6,
          emphasized: processIndex === activeProcess,
        });
      }

      if (needValue > 0) {
        needEdges.push({
          fromX: processNodes[processIndex].x + processNodeWidth / 2,
          fromY: processNodes[processIndex].y + processNeedSlots[processIndex][resourceIndex],
          toX: resourceNodes[resourceIndex].x - resourceNodeRadius,
          toY: resourceNodes[resourceIndex].y + resourceNeedSlots[resourceIndex][processIndex],
          needValue,
          requestValue,
          lane: 18 + processIndex * 4,
          emphasized: processIndex === requestProcess || processIndex === activeProcess,
          isCurrentRequest: requestValue > 0 && processIndex === requestProcess,
        });
      }
    }
  }

  return (
    <section className="table-card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Visual Topology</p>
          <h2>Allocation Graph</h2>
        </div>
      </div>
      <p className="table-description">
        Solid blue flows show granted allocations. Muted dashed links show outstanding need, while
        the selected request is highlighted in amber for quick review.
      </p>

      <div className="graph-legend">
        <span className="graph-legend__item">
          <span className="graph-legend__swatch graph-legend__swatch--allocation" />
          Allocated
        </span>
        <span className="graph-legend__item">
          <span className="graph-legend__swatch graph-legend__swatch--need" />
          Remaining Need
        </span>
        <span className="graph-legend__item">
          <span className="graph-legend__swatch graph-legend__swatch--request" />
          Selected Request
        </span>
      </div>

      <div className="graph-shell">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="allocation-graph"
          role="img"
          aria-label="Resource allocation graph"
        >
          <defs>
            <marker
              id="graph-arrow-allocation"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="graph-arrow graph-arrow--allocation" />
            </marker>
            <marker
              id="graph-arrow-need"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="graph-arrow graph-arrow--need" />
            </marker>
            <marker
              id="graph-arrow-request"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="graph-arrow graph-arrow--request" />
            </marker>
          </defs>

          <text x="54" y="34" className="graph-column-label">
            Processes
          </text>
          <text x={width - 182} y="34" className="graph-column-label">
            Resources
          </text>
          <line x1="84" y1="46" x2="84" y2={height - 34} className="graph-guide" />
          <line x1={width - 84} y1="46" x2={width - 84} y2={height - 34} className="graph-guide" />

          {needEdges.map((edge, index) => (
            <CurveEdge
              key={`need-edge-${index}`}
              fromX={edge.fromX}
              fromY={edge.fromY}
              toX={edge.toX}
              toY={edge.toY}
              lane={edge.lane}
              markerEnd={edge.isCurrentRequest ? 'url(#graph-arrow-request)' : 'url(#graph-arrow-need)'}
              className={[
                'graph-edge',
                edge.isCurrentRequest ? 'graph-edge--request-current' : 'graph-edge--need',
                edge.emphasized ? 'graph-edge--emphasis' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              label={edge.isCurrentRequest ? edge.requestValue : null}
              labelVariant="request"
              labelAt={0.66}
            />
          ))}

          {allocationEdges.map((edge, index) => (
            <CurveEdge
              key={`allocation-edge-${index}`}
              fromX={edge.fromX}
              fromY={edge.fromY}
              toX={edge.toX}
              toY={edge.toY}
              lane={edge.lane}
              markerEnd="url(#graph-arrow-allocation)"
              className={[
                'graph-edge',
                'graph-edge--allocation',
                edge.emphasized ? 'graph-edge--emphasis' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              label={edge.value}
              labelVariant="allocation"
              labelAt={0.34}
              subtle={!edge.emphasized}
            />
          ))}

          {processNodes.map(node => (
            <ProcessNode
              key={node.label}
              x={node.x}
              y={node.y}
              label={node.label}
              active={node.label === `P${activeProcess}`}
            />
          ))}

          {resourceNodes.map(node => (
            <ResourceNode key={node.label} x={node.x} y={node.y} label={node.label} />
          ))}
        </svg>
      </div>
    </section>
  );
}
