import type { MetricKey } from '../../types';
import { METRIC_OPTIONS } from '../../types';

interface TopBarProps {
  selectedYear: number;
  selectedMetric: MetricKey;
  gdpTotal: string;
  gdpTopProvince: string;
  gdpPerCapitaTop: string;
  avgGrowth: string;
  totalPop: string;
  isDemoPlaying: boolean;
  onToggleDemo: () => void;
}

export default function TopBar({
  selectedYear,
  selectedMetric,
  gdpTotal,
  gdpTopProvince,
  gdpPerCapitaTop,
  avgGrowth,
  totalPop,
  isDemoPlaying,
  onToggleDemo,
}: TopBarProps) {
  const metricLabel = METRIC_OPTIONS.find((item) => item.key === selectedMetric)?.label ?? selectedMetric;

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1 className="topbar-heading">中国内地省域经济发展可视化分析平台</h1>
        <span className="topbar-subtitle">{selectedYear}年 · {metricLabel}</span>
      </div>
      <div className="topbar-stats">
        <StatCard label="全国GDP" value={gdpTotal} unit="万亿元" />
        <StatCard label="GDP最高省份" value={gdpTopProvince} />
        <StatCard label="人均GDP最高" value={gdpPerCapitaTop} />
        <StatCard label="平均增速" value={avgGrowth} unit="%" accent="green" />
        <StatCard label="总人口" value={totalPop} unit="亿人" />
      </div>
      <button className={`demo-btn ${isDemoPlaying ? 'demo-playing' : ''}`} onClick={onToggleDemo}>
        {isDemoPlaying ? '退出演示' : '自动演示'}
      </button>
    </header>
  );
}

function StatCard({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: string }) {
  return (
    <div className={`stat-card ${accent ?? ''}`}>
      <span className="stat-value">{value}{unit && <small>{unit}</small>}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
