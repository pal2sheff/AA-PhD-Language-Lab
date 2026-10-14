// Простые SVG-графики без зависимостей: столбцы (с накоплением для двух языков) и линия.
// Цвета серий проверены валидатором палитры (CVD ΔE ≥ 8).
import { useState } from 'react';

// EN — фирменный синий, KK — бирюзовый (тот же оттенок, что и цвет казахского в интерфейсе).
export const SERIES = { en: '#2855a1', kk: '#0d9488' };

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Столбцы с накоплением: каждая точка — массив значений по сериям. */
export function StackedBars({
  data,
  series,
  height = 140,
  unit = '',
  target,
}: {
  data: { label: string; values: number[] }[];
  series: { label: string; color: string }[];
  height?: number;
  unit?: string;
  target?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(1, target ?? 0, ...data.map((d) => d.values.reduce((a, b) => a + b, 0)));
  const W = Math.max(280, Math.min(data.length * 14, 560));
  const bw = W / data.length;
  const H = height;
  if (table)
    return (
      <div>
        <button className="mb-2 min-h-11 text-sm font-medium text-brand underline underline-offset-2" onClick={() => setTable(false)}>
          Показать график
        </button>
        <div className="max-h-64 overflow-y-auto text-sm">
          <table className="w-full">
            <thead>
              <tr className="text-left text-ink-soft">
                <th className="py-1">Дата</th>
                {series.map((s) => (
                  <th key={s.label}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-t border-line">
                  <td className="py-1">{d.label}</td>
                  {d.values.map((v, i) => (
                    <td key={i} className="tabular-nums">
                      {v}
                      {unit}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        {series.length > 1 ? <Legend items={series} /> : <span />}
        <button className="min-h-11 shrink-0 text-sm font-medium text-brand underline underline-offset-2" onClick={() => setTable(true)}>
          Таблица
        </button>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" role="img" aria-label="График">
          {[0.5, 1].map((f) => (
            <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="var(--color-line)" strokeWidth={1} />
          ))}
          <line x1={0} x2={W} y1={H} y2={H} stroke="var(--color-ink-faint)" strokeWidth={1} />
          {target !== undefined && <line x1={0} x2={W} y1={H - (target / max) * H} y2={H - (target / max) * H} stroke="var(--color-ink-soft)" strokeDasharray="4 4" strokeWidth={1} />}
          {data.map((d, i) => {
            let y = H;
            const x = i * bw + bw * 0.15;
            const w = Math.max(2, bw * 0.7);
            const segs = d.values.map((v, k) => {
              const h = (v / max) * H;
              y -= h;
              const top = k === d.values.length - 1 || d.values.slice(k + 1).every((z) => z === 0);
              const yy = y;
              if (h <= 0) return null;
              return <rect key={k} x={x} y={yy + (k > 0 ? 0 : 0)} width={w} height={Math.max(0, h - (k > 0 ? 2 : 0))} rx={top ? Math.min(3, w / 2) : 0} fill={series[k].color} />;
            });
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
                <rect x={i * bw} y={0} width={bw} height={H} fill={hover === i ? 'rgba(23,43,77,0.05)' : 'transparent'} />
                {segs}
              </g>
            );
          })}
          {data.map((d, i) =>
            i % Math.ceil(data.length / 7) === 0 ? (
              <text key={i} x={i * bw + bw / 2} y={H + 14} textAnchor="middle" fontSize={W > 320 ? 12 : 10} fill="var(--color-ink-soft)">
                {d.label}
              </text>
            ) : null,
          )}
        </svg>
        {hover !== null && data[hover] && (
          <div className="pointer-events-none absolute top-0 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-sm shadow-raised" style={{ left: `${Math.min(70, (hover / data.length) * 100)}%` }}>
            <div className="font-medium">{data[hover].label}</div>
            {series.map((s, k) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />
                {s.label}: {data[hover].values[k]}
                {unit}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Линия по одной серии (0–100 или произвольная шкала). */
export function LineChart({ points, max = 100, height = 120, unit = '%', color = SERIES.en }: { points: { label: string; value: number }[]; max?: number; height?: number; unit?: string; color?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length === 0) return <p className="text-sm text-ink-soft">Недостаточно данных.</p>;
  const W = 300;
  const H = height;
  const step = points.length > 1 ? W / (points.length - 1) : 0;
  const xy = points.map((p, i) => [points.length > 1 ? i * step : W / 2, H - (p.value / max) * H] as const);
  return (
    <div className="relative">
      <svg viewBox={`-6 -6 ${W + 12} ${H + 26}`} className="w-full" role="img" aria-label="Динамика">
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="var(--color-line)" />
        ))}
        <line x1={0} x2={W} y1={H} y2={H} stroke="var(--color-ink-faint)" />
        <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        {xy.map(([x, y], i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
            <circle cx={x} cy={y} r={12} fill="transparent" />
            <circle cx={x} cy={y} r={4} fill={color} stroke="var(--color-surface)" strokeWidth={2} />
          </g>
        ))}
        {points.map((p, i) =>
          i % Math.ceil(points.length / 6) === 0 || i === points.length - 1 ? (
            <text key={i} x={xy[i][0]} y={H + 16} textAnchor="middle" fontSize={10} fill="var(--color-ink-soft)">
              {p.label}
            </text>
          ) : null,
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-sm shadow-raised" style={{ left: `${Math.min(70, (xy[hover][0] / W) * 100)}%` }}>
          {points[hover].label}: <strong>{points[hover].value}{unit}</strong>
        </div>
      )}
    </div>
  );
}
