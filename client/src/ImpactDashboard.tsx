import { Package, Scale, TrendingDown, TrendingUp, Users, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { computeImpact, SAMPLE_DONATIONS } from './impact';
import { useCountUp } from './useCountUp';

const IMPACT = computeImpact(SAMPLE_DONATIONS);

const PALETTE = ['#10B981', '#F59E0B', '#CBD5E1', '#94A3B8', '#38BDF8'];

const AXIS_TICK = { fill: '#94A3B8', fontSize: 12 };

interface MonthPoint {
  month: string;
  kg: number;
}

interface CategoryPoint {
  category: string;
  kg: number;
}

interface TrendInfo {
  direction: 'up' | 'down';
  label: string;
}

/** Change in kg between the last two months. Null when there are fewer than two months. */
function computeTrend(monthly: MonthPoint[]): TrendInfo | null {
  if (monthly.length < 2) return null;
  const previous = monthly[monthly.length - 2].kg;
  const latest = monthly[monthly.length - 1].kg;
  if (previous === 0) return { direction: 'up', label: 'New' };
  const change = ((latest - previous) / previous) * 100;
  const direction: TrendInfo['direction'] = change >= 0 ? 'up' : 'down';
  const sign = change >= 0 ? '+' : '-';
  return { direction, label: `${sign}${Math.round(Math.abs(change))}%` };
}

function MonthTooltip({ active, point }: { active?: boolean; point?: MonthPoint }) {
  if (!active || !point) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{point.month}</p>
      <p className="chart-tooltip-value">{`${point.kg.toFixed(1)} kg`}</p>
    </div>
  );
}

function CategoryTooltip({ active, point }: { active?: boolean; point?: CategoryPoint }) {
  if (!active || !point) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{point.category}</p>
      <p className="chart-tooltip-value">{`${point.kg.toFixed(1)} kg`}</p>
    </div>
  );
}

function MonthlyKgChart() {
  const months = IMPACT.monthly;

  if (months.length === 0) {
    return <p className="impact-empty">No monthly data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={months} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="impact-bar-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          content={({ active, payload }) => (
            <MonthTooltip active={active} point={payload?.[0]?.payload as MonthPoint | undefined} />
          )}
          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
        />
        <Bar
          dataKey="kg"
          fill="url(#impact-bar-gradient)"
          radius={[8, 8, 0, 0]}
          animationDuration={900}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function CategoryDonut() {
  const data = IMPACT.byCategory;
  const total = data.reduce((sum, c) => sum + c.kg, 0);

  if (total <= 0) {
    return <p className="impact-empty">No category data yet.</p>;
  }

  return (
    <div className="impact-donut-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="kg"
            nameKey="category"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
            animationDuration={900}
          >
            {data.map((c, i) => (
              <Cell key={c.category} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => (
              <CategoryTooltip
                active={active}
                point={payload?.[0]?.payload as CategoryPoint | undefined}
              />
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="impact-legend">
        {data.map((c, i) => (
          <li key={c.category}>
            <span
              className="impact-swatch"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              aria-hidden="true"
            />
            <span className="impact-legend-name">{c.category}</span>
            <span className="impact-legend-value">{`${Math.round((c.kg / total) * 100)}%`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopNgos() {
  if (IMPACT.topNgos.length === 0) {
    return <p className="impact-empty">No NGOs have claimed food yet.</p>;
  }

  const maxDonations = IMPACT.topNgos.reduce((max, n) => Math.max(max, n.donations), 0);

  return (
    <ol className="impact-ngo-list">
      {IMPACT.topNgos.map((n) => {
        const percent = maxDonations > 0 ? (n.donations / maxDonations) * 100 : 0;
        return (
          <li key={n.ngo} className="impact-ngo">
            <div className="impact-ngo-row">
              <span className="impact-ngo-name">{n.ngo}</span>
              <span className="impact-ngo-count">{`${n.donations} donation${n.donations === 1 ? '' : 's'}`}</span>
            </div>
            <div className="impact-track" aria-hidden="true">
              <div className="impact-fill" style={{ width: `${percent}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

interface AnimatedValueProps {
  value: number;
  decimals?: number;
}

function AnimatedValue({ value, decimals = 0 }: AnimatedValueProps) {
  const animated = useCountUp(value);
  const text = decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString();
  return <>{text}</>;
}

interface ImpactKpiProps {
  label: string;
  value: number;
  decimals?: number;
  icon: LucideIcon;
  tone: 'green' | 'orange' | 'blue' | 'purple';
  trend?: TrendInfo | null;
}

function ImpactKpi({ label, value, decimals, icon: Icon, tone, trend }: ImpactKpiProps) {
  return (
    <article className={`kpi-card impact-card card--${tone}`}>
      <div className="kpi-card-top">
        <span className="kpi-icon">
          <Icon size={18} strokeWidth={2} aria-hidden="true" />
        </span>
        {trend && (
          <span className={`kpi-trend kpi-trend--${trend.direction}`}>
            {trend.direction === 'up' ? (
              <TrendingUp size={18} strokeWidth={2} aria-hidden="true" />
            ) : (
              <TrendingDown size={18} strokeWidth={2} aria-hidden="true" />
            )}
            <span>{trend.label}</span>
          </span>
        )}
      </div>
      <p className="impact-value">
        <AnimatedValue value={value} decimals={decimals} />
      </p>
      <p className="impact-caption">{label}</p>
    </article>
  );
}

export default function ImpactDashboard() {
  const trend = computeTrend(IMPACT.monthly);

  return (
    <section className="impact">
      <p className="impact-subtitle">Data is based on month-wise figures. Showing data for November.</p>
      <div className="impact-cards">
        <ImpactKpi
          label="Total Donations"
          value={IMPACT.totalDonations}
          icon={Package}
          tone="green"
        />
        <ImpactKpi
          label="Meals Saved"
          value={IMPACT.mealsSaved}
          icon={Utensils}
          tone="orange"
          trend={trend}
        />
        <ImpactKpi
          label="Food Saved (Kg)"
          value={IMPACT.foodSavedKg}
          decimals={1}
          icon={Scale}
          tone="blue"
          trend={trend}
        />
        <ImpactKpi
          label="NGOs Supported"
          value={IMPACT.ngosSupported}
          icon={Users}
          tone="purple"
        />
      </div>

      <div className="impact-charts">
        <section
          className="impact-panel chart-card chart-card--dark"
          aria-labelledby="impact-monthly-heading"
        >
          <h2 id="impact-monthly-heading">Food saved per month (kg)</h2>
          <figure className="impact-chart">
            <MonthlyKgChart />
          </figure>
        </section>

        <section className="impact-panel chart-card" aria-labelledby="impact-category-heading">
          <h2 id="impact-category-heading">Share by category</h2>
          <figure className="impact-chart">
            <CategoryDonut />
          </figure>
        </section>
      </div>

      <section className="impact-panel glass-card" aria-labelledby="impact-ngo-heading">
        <h2 id="impact-ngo-heading">Top NGOs</h2>
        <TopNgos />
      </section>
    </section>
  );
}
