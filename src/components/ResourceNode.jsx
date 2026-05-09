const DOT_GAP = 14;
const DOT_RADIUS = 4.5;

function getInstanceOffsets(total, gap = DOT_GAP) {
  return Array.from({ length: total }, (_, index) => (index - (total - 1) / 2) * gap);
}

export function getResourceNodeMetrics(totalInstances) {
  const total = Math.max(1, Number(totalInstances) || 0);
  const dotsWidth = total > 1 ? (total - 1) * DOT_GAP + DOT_RADIUS * 2 : DOT_RADIUS * 2;
  const width = Math.max(68, Math.ceil(dotsWidth + 28));
  const height = 74;

  return {
    width,
    height,
    halfWidth: width / 2,
    halfHeight: height / 2,
  };
}

export default function ResourceNode({
  resource,
  x,
  y,
  availableCount,
  allocatedCount,
  isHighlighted,
  isInCycle,
}) {
  const total = Number(resource.totalInstances) || 0;
  const { width, height, halfWidth, halfHeight } = getResourceNodeMetrics(total);
  const instanceOffsets = getInstanceOffsets(total);
  const labelColor = isInCycle ? '#fecaca' : '#e2e8f0';
  const ringStroke = isInCycle
    ? '#f87171'
    : isHighlighted
      ? '#60a5fa'
      : 'rgba(255,255,255,0.18)';
  const ringFill = isInCycle
    ? 'rgba(127,29,29,0.28)'
    : isHighlighted
      ? 'rgba(59,130,246,0.16)'
      : 'rgba(15,23,42,0.9)';

  return (
    <g>
      <rect
        x={x - halfWidth}
        y={y - halfHeight}
        width={width}
        height={height}
        rx="14"
        fill={ringFill}
        stroke={ringStroke}
        strokeWidth={isInCycle ? 2.5 : 1.75}
      />
      <text
        x={x}
        y={y - 8}
        fill={labelColor}
        fontSize="14"
        fontWeight="700"
        textAnchor="middle"
      >
        {resource.name}
      </text>
      <text
        x={x}
        y={y + 8}
        fill={isInCycle ? '#fca5a5' : '#94a3b8'}
        fontSize="10"
        textAnchor="middle"
      >
        {total} instance{total === 1 ? '' : 's'}
      </text>

      {instanceOffsets.map((offset, index) => {
        const isAllocated = index < allocatedCount;
        const isAvailable = index < allocatedCount + availableCount;

        return (
          <circle
            key={`${resource.id}-instance-${index}`}
            cx={x + offset}
            cy={y + 24}
            r={DOT_RADIUS}
            fill={isAllocated ? '#38bdf8' : isAvailable ? '#cbd5e1' : 'transparent'}
            stroke={isInCycle ? '#fca5a5' : isAllocated ? '#7dd3fc' : '#94a3b8'}
            strokeWidth="1.15"
            opacity={isAvailable ? 1 : 0.38}
          />
        );
      })}
    </g>
  );
}
