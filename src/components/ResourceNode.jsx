export default function ResourceNode({ resource, x, y, width, height, availableCount, allocatedCount, isHighlighted }) {
  const dotRadius = 6;
  const gap = 16;
  const startX = x + 18;
  const dotY = y + height / 2;
  const total = resource.totalInstances;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="18"
        fill={isHighlighted ? 'rgba(59,130,246,0.18)' : 'rgba(15,23,42,0.88)'}
        stroke={isHighlighted ? '#60a5fa' : 'rgba(255,255,255,0.15)'}
        strokeWidth="1.5"
      />
      <text x={x + 16} y={y + 20} fill="#e2e8f0" fontSize="13" fontWeight="600">
        {resource.name}
      </text>
      {Array.from({ length: total }, (_, index) => {
        const allocated = index < allocatedCount;
        return (
          <circle
            key={`${resource.id}-${index}`}
            cx={startX + index * gap}
            cy={dotY}
            r={dotRadius}
            fill={allocated ? '#3b82f6' : 'transparent'}
            stroke={allocated ? '#7dd3fc' : '#94a3b8'}
            strokeWidth="1.5"
            opacity={allocated || index < availableCount + allocatedCount ? 1 : 0.3}
          />
        );
      })}
    </g>
  );
}
