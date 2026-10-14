// Отрисовка графиков для IELTS Writing Task 1 (данные учебные).
import type { ChartSpec } from '../data/ielts/writing-speaking';
import { Legend, SERIES } from './Charts';

const COLORS = [SERIES.en, SERIES.kk];

export function TaskChart({ spec }: { spec: ChartSpec }) {
  if (spec.kind === 'table')
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr>
              {spec.head.map((h) => (
                <th key={h} className="border border-line bg-canvas px-2 py-1.5 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className="border border-line px-2 py-1.5 tabular-nums">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if (spec.kind === 'process')
    return (
      <ol className="space-y-1.5">
        {spec.steps.map((s, i) => (
          <li key={i}>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">{i + 1}</span>
              <span className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm">{s}</span>
            </div>
            {spec.branch && spec.branch.after === i + 1 && <div className="mt-1 ml-9 rounded-lg border border-dashed border-warn/50 bg-warn-soft px-3 py-1 text-sm">{spec.branch.text}</div>}
            {i < spec.steps.length - 1 && <div className="ml-3.5 h-3 border-l-2 border-line" />}
          </li>
        ))}
      </ol>
    );
  const W = 320;
  const H = 170;
  const left = 32;
  if (spec.kind === 'bars') {
    const groupW = (W - left) / spec.categories.length;
    const barW = (groupW * 0.7) / spec.series.length;
    return (
      <div>
        <Legend items={spec.series.map((s, i) => ({ label: s.name, color: COLORS[i] }))} />
        <svg viewBox={`0 -12 ${W} ${H + 36}`} className="mt-2 w-full" role="img" aria-label="Столбчатая диаграмма">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={left} x2={W} y1={H - H * f} y2={H - H * f} stroke="var(--color-line)" />
              <text x={left - 4} y={H - H * f + 3} textAnchor="end" fontSize={9} fill="var(--color-ink-soft)">
                {Math.round(spec.yMax * f)}
                {spec.unit === '%' ? '%' : ''}
              </text>
            </g>
          ))}
          {spec.categories.map((c, ci) => (
            <g key={c}>
              {spec.series.map((s, si) => {
                const v = s.values[ci];
                const h = (v / spec.yMax) * H;
                const x = left + ci * groupW + groupW * 0.15 + si * (barW + 2);
                return (
                  <g key={si}>
                    <rect x={x} y={H - h} width={barW} height={h} rx={3} fill={COLORS[si]}>
                      <title>{`${c}, ${s.name}: ${v}${spec.unit === '%' ? '%' : ''}`}</title>
                    </rect>
                    <text x={x + barW / 2} y={H - h - 3} textAnchor="middle" fontSize={8} fill="var(--color-ink-soft)">
                      {v}
                    </text>
                  </g>
                );
              })}
              <text x={left + ci * groupW + groupW / 2} y={H + 14} textAnchor="middle" fontSize={10} fill="var(--color-ink)">
                {c}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }
  const step = (W - left - 10) / (spec.x.length - 1);
  return (
    <div>
      <Legend items={spec.series.map((s, i) => ({ label: s.name, color: COLORS[i] }))} />
      <svg viewBox={`0 -12 ${W} ${H + 36}`} className="mt-2 w-full" role="img" aria-label="Линейный график">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={left} x2={W} y1={H - H * f} y2={H - H * f} stroke="var(--color-line)" />
            <text x={left - 4} y={H - H * f + 3} textAnchor="end" fontSize={9} fill="var(--color-ink-soft)">
              {Math.round(spec.yMax * f)}
            </text>
          </g>
        ))}
        {spec.series.map((s, si) => (
          <g key={s.name}>
            <polyline points={s.values.map((v, i) => `${left + i * step},${H - (v / spec.yMax) * H}`).join(' ')} fill="none" stroke={COLORS[si]} strokeWidth={2} />
            {s.values.map((v, i) => (
              <circle key={i} cx={left + i * step} cy={H - (v / spec.yMax) * H} r={4} fill={COLORS[si]} stroke="var(--color-surface)" strokeWidth={2}>
                <title>{`${s.name}, ${spec.x[i]}: ${v} ${spec.unit}`}</title>
              </circle>
            ))}
          </g>
        ))}
        {spec.x.map((x, i) => (
          <text key={x} x={left + i * step} y={H + 14} textAnchor="middle" fontSize={10} fill="var(--color-ink)">
            {x}
          </text>
        ))}
      </svg>
      <p className="text-xs text-ink-soft">Единицы: {spec.unit}. Данные учебные.</p>
    </div>
  );
}
