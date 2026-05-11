import { useRef, useEffect } from 'react';

export default function WFGCanvas({ n, edges, deadlocked }) {
  const ref = useRef();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (n === 0) return;

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.33;

    const pos = Array.from({ length: n }, (_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    const isDead = i => deadlocked.includes(i);
    const NODE_R = 20;

    const edgeColor   = isDark ? '#F09595' : '#E24B4A';
    const deadFill    = isDark ? '#501313' : '#FCEBEB';
    const deadStroke  = isDark ? '#F09595' : '#E24B4A';
    const deadText    = isDark ? '#F7C1C1' : '#791F1F';
    const safeFill    = isDark ? '#04342C' : '#E1F5EE';
    const safeStroke  = isDark ? '#5DCAA5' : '#1D9E75';
    const safeText    = isDark ? '#9FE1CB' : '#085041';

    // Draw edges with arrowheads
    edges.forEach(({ from, to }) => {
      const s = pos[from];
      const t = pos[to];
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      const nx = dx / len;
      const ny = dy / len;
      const sx = s.x + nx * NODE_R;
      const sy = s.y + ny * NODE_R;
      const ex = t.x - nx * NODE_R;
      const ey = t.y - ny * NODE_R;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(ey - sy, ex - sx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 10 * Math.cos(angle - 0.4), ey - 10 * Math.sin(angle - 0.4));
      ctx.lineTo(ex - 10 * Math.cos(angle + 0.4), ey - 10 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = edgeColor;
      ctx.fill();
    });

    // Draw nodes
    pos.forEach(({ x, y }, i) => {
      ctx.beginPath();
      ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle   = isDead(i) ? deadFill   : safeFill;
      ctx.strokeStyle = isDead(i) ? deadStroke : safeStroke;
      ctx.lineWidth   = isDead(i) ? 2 : 1;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle    = isDead(i) ? deadText : safeText;
      ctx.font         = '500 12px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${i}`, x, y);
    });
  }, [n, edges, deadlocked]);

  return (
    <canvas
      ref={ref}
      width={300}
      height={220}
      className="wfg-canvas"
    />
  );
}
