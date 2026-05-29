import { METRIC_OPTIONS, REGIONS } from '../../types';
import { MORANDI_PALETTE } from '../../utils/chartTheme';
import type { MetricKey, ProvinceEconomy } from '../../types';
import { RankingBoard } from './BCharts';

interface LeftPanelProps {
  allData: ProvinceEconomy[];
  selectedYear: number;
  selectedMetric: MetricKey;
  selectedRegion: string | null;
  onSelectMetric: (key: MetricKey) => void;
  onSelectRegion: (region: string | null) => void;
  onSelectProvince: (province: string) => void;
  onOpenAdvanced: () => void;
}

export default function LeftPanel({
  allData,
  selectedYear,
  selectedMetric,
  selectedRegion,
  onSelectMetric,
  onSelectRegion,
  onSelectProvince,
  onOpenAdvanced,
}: LeftPanelProps) {
  return (
    <aside className="left-panel">
      <div className="panel-section">
        <h3 className="panel-title">指标选择</h3>
        <div className="metric-selector">
          {METRIC_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`metric-btn ${selectedMetric === opt.key ? 'active' : ''}`}
              onClick={() => onSelectMetric(opt.key)}
              title={`${opt.label} · ${opt.unit}`}
            >
              {opt.label}
              <span className="metric-unit">{opt.unit}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="panel-section">
        <h3 className="panel-title">经济区域</h3>
        <div className="region-selector">
          <button className={`region-btn ${!selectedRegion ? 'active' : ''}`} onClick={() => onSelectRegion(null)}>
            全国
          </button>
          {REGIONS.map((region, index) => (
            <button
              key={region.code}
              className={`region-btn ${selectedRegion === region.code ? 'active' : ''}`}
              onClick={() => onSelectRegion(selectedRegion === region.code ? null : region.code)}
              style={{ borderColor: selectedRegion === region.code ? region.color : 'transparent' }}
            >
              <span className="region-dot" style={{ background: MORANDI_PALETTE[index % MORANDI_PALETTE.length] }} />
              {region.name}
              <span className="region-count">{region.provinces.length}省</span>
            </button>
          ))}
        </div>
      </div>
      <div className="panel-section">
        <h3 className="panel-title">排行榜 Top10</h3>
        <RankingBoard allData={allData} selectedYear={selectedYear} selectedMetric={selectedMetric} onSelectProvince={onSelectProvince} />
      </div>
      <div className="panel-section">
        <h3 className="panel-title">分析工具</h3>
        <button className="advanced-entry-btn" onClick={onOpenAdvanced}>
          <span className="advanced-entry-icon">◆</span>
          高级分析
          <span className="advanced-entry-hint">人物 C</span>
        </button>
      </div>
    </aside>
  );
}
