import ReactECharts from 'echarts-for-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { MetricKey, ProvinceEconomy } from '../../types';
import { METRIC_OPTIONS, REGIONS } from '../../types';
import {
  MORANDI_BLUE,
  MORANDI_GOLD,
  MORANDI_GREEN,
  MORANDI_LAVENDER,
  MORANDI_PALETTE,
  MORANDI_ROSE,
  MORANDI_TERRA,
  axisStyle,
  withChartDefaults,
} from '../../utils/chartTheme';

// ===== 图表放大弹窗 Context =====
interface ChartModalState {
  option: Record<string, unknown>;
  title: string;
}
const ChartModalCtx = createContext<{
  open: (state: ChartModalState) => void;
  close: () => void;
} | null>(null);

export function ChartModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChartModalState | null>(null);
  const open = useCallback((s: ChartModalState) => setState(s), []);
  const close = useCallback(() => setState(null), []);
  return (
    <ChartModalCtx.Provider value={{ open, close }}>
      {children}
      {state && (
        <div className="chart-modal-overlay" onClick={close}>
          <div className="chart-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="chart-modal-header">
              <span>{state.title}</span>
              <button className="chart-modal-close" onClick={close}>✕</button>
            </div>
            <ReactECharts
              option={withChartDefaults(state.option) as never}
              style={{ height: 'calc(100vh - 120px)', width: '100%' }}
              notMerge
              lazyUpdate
            />
          </div>
        </div>
      )}
    </ChartModalCtx.Provider>
  );
}

function useChartModal() {
  const ctx = useContext(ChartModalCtx);
  if (!ctx) throw new Error('useChartModal must be used inside ChartModalProvider');
  return ctx;
}

// ===== 基础类型 =====
type ChartProps = {
  option: Record<string, unknown>;
  height?: number;
  className?: string;
  modalTitle?: string;
};

const fmt = (value: number, digits = 0) =>
  value.toLocaleString('zh-CN', { maximumFractionDigits: digits, minimumFractionDigits: digits });

const metricLabel = (key: MetricKey) => METRIC_OPTIONS.find((item) => item.key === key)?.label ?? key;

function Chart({ option, height = 190, className, modalTitle }: ChartProps) {
  const modal = useChartModal();
  return (
    <div
      className={`chart-card ${className ?? ''}`}
      onClick={() => modal.open({ option, title: modalTitle ?? '图表' })}
      title="点击放大"
      style={{ cursor: 'pointer' }}
    >
      <ReactECharts option={withChartDefaults(option) as never} style={{ height, width: '100%' }} notMerge lazyUpdate />
    </div>
  );
}

function selectedYearRows(allData: ProvinceEconomy[], year: number) {
  return allData.filter((item) => item.year === year);
}

function nationalByYear(allData: ProvinceEconomy[]) {
  const years = [...new Set(allData.map((item) => item.year))].sort((a, b) => a - b);
  return years.map((year) => {
    const rows = selectedYearRows(allData, year);
    const gdp = rows.reduce((sum, row) => sum + row.gdp, 0);
    const population = rows.reduce((sum, row) => sum + row.population, 0);
    return {
      year,
      gdp,
      population,
      gdpPerCapita: population ? (gdp * 10000) / population : 0,
      gdpGrowth: rows.reduce((sum, row) => sum + row.gdpGrowth, 0) / rows.length,
    };
  });
}

export function OverviewCards({ allData, selectedYear }: { allData: ProvinceEconomy[]; selectedYear: number }) {
  const rows = selectedYearRows(allData, selectedYear);
  const gdp = rows.reduce((sum, row) => sum + row.gdp, 0);
  const population = rows.reduce((sum, row) => sum + row.population, 0);
  const gdpTop = [...rows].sort((a, b) => b.gdp - a.gdp)[0];
  const pcTop = [...rows].sort((a, b) => b.gdpPerCapita - a.gdpPerCapita)[0];
  const avgGrowth = rows.reduce((sum, row) => sum + row.gdpGrowth, 0) / Math.max(rows.length, 1);

  return (
    <div className="overview-cards">
      <div><strong>{fmt(gdp / 10000, 1)}</strong><span>全国GDP/万亿元</span></div>
      <div><strong>{gdpTop?.provinceName ?? '-'}</strong><span>GDP最高省份</span></div>
      <div><strong>{pcTop?.provinceName ?? '-'}</strong><span>人均GDP最高</span></div>
      <div><strong>{avgGrowth.toFixed(1)}%</strong><span>平均增速</span></div>
      <div><strong>{fmt(population / 10000, 2)}</strong><span>总人口/亿人</span></div>
    </div>
  );
}

export function MapLegend({ min, max, label, colors }: { min: number; max: number; label: string; colors: [string, string, string] }) {
  const gradient = `linear-gradient(to right, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
  return (
    <div className="map-legend">
      <span className="legend-label">{label}</span>
      <div className="legend-gradient-bar" style={{ background: gradient }} />
      <div className="legend-values">
        <small>{fmt(min, 1)}</small>
        <small>{fmt(max, 1)}</small>
      </div>
    </div>
  );
}

export function RankingBoard({
  allData,
  selectedYear,
  selectedMetric,
  onSelectProvince,
}: {
  allData: ProvinceEconomy[];
  selectedYear: number;
  selectedMetric: MetricKey;
  onSelectProvince: (province: string) => void;
}) {
  const current = selectedYearRows(allData, selectedYear).sort((a, b) => b[selectedMetric] - a[selectedMetric]).slice(0, 10);
  const previous = selectedYearRows(allData, selectedYear - 1).sort((a, b) => b[selectedMetric] - a[selectedMetric]);
  const previousRank = new Map(previous.map((row, index) => [row.provinceName, index + 1]));

  return (
    <div className="ranking-board">
      {current.map((row, index) => {
        const diff = (previousRank.get(row.provinceName) ?? index + 1) - (index + 1);
        const trend = allData.filter((item) => item.provinceName === row.provinceName).sort((a, b) => a.year - b.year);
        const maxValue = Math.max(...trend.map((item) => item[selectedMetric]));
        return (
          <button className="ranking-row" key={row.provinceName} onClick={() => onSelectProvince(row.provinceName)}>
            <span className={`rank-num rank-${index + 1}`}>{index + 1}</span>
            <span className="rank-prov">{row.provinceName}</span>
            <span className={diff >= 0 ? 'rank-up' : 'rank-down'}>{diff === 0 ? '-' : diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`}</span>
            <span className="rank-spark">
              {trend.slice(-6).map((point) => (
                <i key={point.year} style={{ height: `${Math.max(12, (point[selectedMetric] / maxValue) * 100)}%` }} />
              ))}
            </span>
            <span className="rank-value">{fmt(row[selectedMetric], selectedMetric.includes('Rate') || selectedMetric === 'gdpGrowth' ? 1 : 0)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ProvinceDetailPanel({
  province,
  allData,
  selectedYear,
  onStartCompare,
}: {
  province: string;
  allData: ProvinceEconomy[];
  selectedYear: number;
  onStartCompare: () => void;
}) {
  const trend = allData.filter((item) => item.provinceName === province).sort((a, b) => a.year - b.year);
  const row = trend.find((item) => item.year === selectedYear) ?? trend.at(-1);
  const national = nationalByYear(allData);
  const nationalRow = national.find((item) => item.year === selectedYear);
  if (!row || !nationalRow) return null;

  const years = trend.map((item) => item.year);
  const maxGdp = Math.max(...trend.map((item) => item.gdp));
  const minGdp = Math.min(...trend.map((item) => item.gdp));
  const indicators: Array<[string, number, number]> = [
    ['GDP', row.gdp, nationalRow.gdp / 31],
    ['人均GDP', row.gdpPerCapita, nationalRow.gdpPerCapita],
    ['增速', row.gdpGrowth, nationalRow.gdpGrowth],
    ['人口', row.population, nationalRow.population / 31],
    ['城镇化', row.urbanizationRate, 66.5],
    ['人均收入', row.perCapitaIncome, selectedYearRows(allData, selectedYear).reduce((s, d) => s + d.perCapitaIncome, 0) / 31],
  ];

  return (
    <div className="detail-panel b-panel">
      <div className="panel-actions">
        <span>{selectedYear} 年省份画像</span>
        <button className="compare-btn" onClick={onStartCompare}>加入对比</button>
      </div>
      <div className="metric-cards compact">
        <div><strong>{fmt(row.gdp)}</strong><span>GDP/亿元</span></div>
        <div><strong>{fmt(row.gdpPerCapita)}</strong><span>人均GDP/元</span></div>
        <div><strong>{row.gdpGrowth.toFixed(1)}%</strong><span>GDP增速</span></div>
        <div><strong>{row.tertiaryIndustry ? ((row.tertiaryIndustry / row.gdp) * 100).toFixed(1) : '0.0'}%</strong><span>三产占比</span></div>
      </div>
      <Chart modalTitle={`${province} GDP总量趋势`}
        option={{
          title: { text: '图表1 GDP总量趋势' },
          xAxis: { type: 'category', data: years, ...axisStyle },
          yAxis: { type: 'value', name: '亿元', ...axisStyle },
          series: [{ type: 'line', smooth: true, data: trend.map((item) => item.gdp), areaStyle: { opacity: 0.18 }, lineStyle: { color: MORANDI_TERRA, width: 2 }, itemStyle: { color: MORANDI_TERRA }, markPoint: { data: [{ type: 'max', name: '最高' }, { type: 'min', name: '最低' }] } }],
        }}
      />
      <Chart modalTitle={`${province} 人均GDP趋势`}
        option={{
          title: { text: '图表2 人均GDP趋势' },
          xAxis: { type: 'category', data: years, ...axisStyle },
          yAxis: { type: 'value', name: '元/人', ...axisStyle },
          series: [
            { type: 'line', smooth: true, data: trend.map((item) => item.gdpPerCapita), areaStyle: { opacity: 0.16 }, lineStyle: { color: MORANDI_BLUE, width: 2 }, itemStyle: { color: MORANDI_BLUE } },
            { type: 'line', name: '全国均值', data: national.map((item) => item.gdpPerCapita), lineStyle: { type: 'dashed', color: MORANDI_GOLD }, symbol: 'none' },
          ],
        }}
      />
      <Chart modalTitle={`${province} GDP增速`}
        option={{
          title: { text: '图表3 GDP增速柱状图' },
          xAxis: { type: 'category', data: years, ...axisStyle },
          yAxis: { type: 'value', name: '%', ...axisStyle },
          series: [{ type: 'bar', barWidth: '55%', data: trend.map((item) => ({ value: item.gdpGrowth, itemStyle: { color: item.gdpGrowth >= 0 ? MORANDI_GREEN : MORANDI_ROSE, borderRadius: [4, 4, 0, 0] }, label: { show: true, position: 'top', formatter: '{c}%' } })), markLine: { data: [{ yAxis: 0 }], lineStyle: { type: 'dashed' } } }],
        }}
      />
      <Chart modalTitle={`${province} 三次产业结构`} height={210}
        option={{
          title: { text: '图表4 三次产业结构' },
          tooltip: { trigger: 'item' },
          series: [{ type: 'pie', radius: ['45%', '70%'], center: ['50%', '56%'], data: [{ name: '第一产业', value: row.primaryIndustry }, { name: '第二产业', value: row.secondaryIndustry }, { name: '第三产业', value: row.tertiaryIndustry }], color: [MORANDI_GREEN, MORANDI_BLUE, MORANDI_LAVENDER], label: { color: '#EDE8DC', formatter: '{b}\n{d}%' } }],
          graphic: { type: 'text', left: 'center', top: '50%', style: { text: `三产\n${((row.tertiaryIndustry / row.gdp) * 100).toFixed(1)}%`, fill: '#EDE8DC', fontSize: 16, fontWeight: 700 } },
        }}
      />
      <Chart modalTitle={`${province} vs 全国均值`}
        option={{
          title: { text: '图表5 本省 vs 全国均值' },
          legend: { data: [province, '全国均值'] },
          xAxis: { type: 'category', data: indicators.map(([name]) => name), ...axisStyle },
          yAxis: { type: 'value', ...axisStyle },
          series: [{ name: province, type: 'bar', data: indicators.map(([, value]) => value), itemStyle: { color: MORANDI_TERRA } }, { name: '全国均值', type: 'bar', data: indicators.map(([, , value]) => value), itemStyle: { color: MORANDI_BLUE, opacity: 0.75 } }],
        }}
      />
      <Chart modalTitle={`${province} GDP占全国比重`} height={160}
        option={{
          title: { text: '图表6 GDP占全国比重' },
          tooltip: { trigger: 'item' },
          series: [{ type: 'pie', radius: ['62%', '78%'], startAngle: 90, data: [{ name: province, value: row.gdp }, { name: '其他省份', value: nationalRow.gdp - row.gdp, itemStyle: { color: 'rgba(196,191,182,0.12)' } }], label: { show: false }, color: [MORANDI_TERRA] }],
          graphic: { type: 'text', left: 'center', top: '48%', style: { text: `${((row.gdp / nationalRow.gdp) * 100).toFixed(1)}%`, fill: MORANDI_GOLD, fontSize: 24, fontWeight: 700 } },
        }}
      />
      <div className="spark-grid">
        {(['gdp', 'gdpPerCapita', 'gdpGrowth', 'population', 'fiscalRevenue', 'perCapitaIncome'] as MetricKey[]).map((key, index) => {
          const max = Math.max(...trend.map((item) => item[key]));
          return (
            <div className="spark-cell" key={key}>
              <span>{metricLabel(key)}</span>
              <div>{trend.map((item) => <i key={item.year} style={{ height: `${Math.max(8, (item[key] / max) * 100)}%`, background: MORANDI_PALETTE[index] }} />)}</div>
            </div>
          );
        })}
      </div>
      <div className="analysis-text">
        <strong>图表8 自动分析</strong>
        <p>{province}在{selectedYear}年GDP为{fmt(row.gdp)}亿元，处于全国第{selectedYearRows(allData, selectedYear).sort((a, b) => b.gdp - a.gdp).findIndex((item) => item.provinceName === province) + 1}位。</p>
        <p>2014-2024年GDP区间为{fmt(minGdp)}-{fmt(maxGdp)}亿元，时间序列表现出连续扩张特征。</p>
        <p>第三产业占比为{((row.tertiaryIndustry / row.gdp) * 100).toFixed(1)}%，可作为服务业发展水平的核心观察指标。</p>
      </div>
    </div>
  );
}

export function ProvinceComparePanel({
  provinces,
  allData,
  selectedYear,
  onRemoveCompare,
}: {
  provinces: string[];
  allData: ProvinceEconomy[];
  selectedYear: number;
  onRemoveCompare: (province: string) => void;
}) {
  const seriesData = provinces.map((province) => allData.filter((item) => item.provinceName === province).sort((a, b) => a.year - b.year));
  const years = seriesData[0]?.map((item) => item.year) ?? [];
  const currentRows = provinces.map((province) => allData.find((item) => item.provinceName === province && item.year === selectedYear)).filter(Boolean) as ProvinceEconomy[];
  const national = nationalByYear(allData);
  return (
    <div className="compare-panel b-panel">
      <div className="compare-provinces">
        {provinces.map((name) => <span key={name} className="compare-tag">{name}<button onClick={() => onRemoveCompare(name)}>×</button></span>)}
      </div>
      {provinces.length < 2 && <p className="compare-hint">请选择至少 2 个省份进行对比，最多支持 4 个。</p>}
      <Chart modalTitle="多线GDP对比" option={{ title: { text: '图表1 多线GDP对比' }, legend: { data: provinces }, xAxis: { type: 'category', data: years, ...axisStyle }, yAxis: { type: 'value', name: '亿元', ...axisStyle }, series: seriesData.map((rows, i) => ({ name: provinces[i], type: 'line', smooth: true, data: rows.map((item) => item.gdp) })) }} />
      <Chart modalTitle="多线人均GDP对比" option={{ title: { text: '图表2 多线人均GDP对比' }, legend: { data: provinces }, xAxis: { type: 'category', data: years, ...axisStyle }, yAxis: { type: 'value', name: '元/人', ...axisStyle }, series: seriesData.map((rows, i) => ({ name: provinces[i], type: 'line', smooth: true, data: rows.map((item) => item.gdpPerCapita) })) }} />
      <Chart modalTitle="关键指标分组柱状图" option={{ title: { text: '图表3 当年关键指标分组柱状图' }, legend: { data: provinces }, xAxis: { type: 'category', data: ['GDP', '人均GDP', '增速', '人口', '三产占比', '城镇化'], ...axisStyle }, yAxis: { type: 'value', ...axisStyle }, series: currentRows.map((row) => ({ name: row.provinceName, type: 'bar', data: [row.gdp, row.gdpPerCapita, row.gdpGrowth, row.population, (row.tertiaryIndustry / row.gdp) * 100, row.urbanizationRate] })) }} />
      <Chart modalTitle="六维雷达图" height={230} option={{ title: { text: '图表4 六维雷达图' }, tooltip: {}, radar: { indicator: [{ name: 'GDP', max: 140000 }, { name: '人均GDP', max: 210000 }, { name: '增速', max: 9 }, { name: '人口', max: 13000 }, { name: '三产', max: 75 }, { name: '城镇化', max: 90 }], axisName: { color: '#B8B2A6' }, splitLine: { lineStyle: { color: 'rgba(196,191,182,0.15)' } }, splitArea: { areaStyle: { color: ['rgba(196,191,182,0.02)', 'rgba(196,191,182,0.05)'] } } }, series: [{ type: 'radar', data: currentRows.map((row) => ({ name: row.provinceName, value: [row.gdp, row.gdpPerCapita, row.gdpGrowth, row.population, (row.tertiaryIndustry / row.gdp) * 100, row.urbanizationRate] })) }] }} />
      <Chart modalTitle="产业结构堆叠柱状图" option={{ title: { text: '图表5 产业结构堆叠柱状图' }, legend: { data: ['一产', '二产', '三产'] }, xAxis: { type: 'category', data: currentRows.map((row) => row.provinceName), ...axisStyle }, yAxis: { type: 'value', name: '亿元', ...axisStyle }, series: ['primaryIndustry', 'secondaryIndustry', 'tertiaryIndustry'].map((key, i) => ({ name: ['一产', '二产', '三产'][i], type: 'bar', stack: 'industry', data: currentRows.map((row) => row[key as MetricKey]) })) }} />
      <Chart modalTitle="增速对比+全国平均" option={{ title: { text: '图表6 增速对比+全国平均' }, legend: { data: [...provinces, '全国平均'] }, xAxis: { type: 'category', data: years, ...axisStyle }, yAxis: { type: 'value', name: '%', ...axisStyle }, series: [...seriesData.map((rows, i) => ({ name: provinces[i], type: 'bar', data: rows.map((item) => item.gdpGrowth) })), { name: '全国平均', type: 'line', data: national.map((item) => item.gdpGrowth), lineStyle: { type: 'dashed', color: MORANDI_GOLD } }] }} />
    </div>
  );
}

export function RegionAnalysisPanel({
  regionCode,
  allData,
  selectedYear,
}: {
  regionCode: string;
  allData: ProvinceEconomy[];
  selectedYear: number;
}) {
  const region = REGIONS.find((item) => item.code === regionCode);
  const provinces = region?.provinces ?? [];
  const rows = selectedYearRows(allData, selectedYear).filter((item) => provinces.includes(item.provinceName));
  const nationalRows = selectedYearRows(allData, selectedYear);
  const totalGdp = rows.reduce((sum, row) => sum + row.gdp, 0);
  const totalPopulation = rows.reduce((sum, row) => sum + row.population, 0);
  const nationalGdp = nationalRows.reduce((sum, row) => sum + row.gdp, 0);
  const years = [...new Set(allData.map((item) => item.year))].sort((a, b) => a - b);
  const regionTrend = years.map((year) => allData.filter((item) => item.year === year && provinces.includes(item.provinceName)).reduce((sum, item) => sum + item.gdp, 0));
  const nationalTrend = years.map((year) => allData.filter((item) => item.year === year).reduce((sum, item) => sum + item.gdp, 0));

  return (
    <div className="region-panel b-panel">
      <div className="metric-cards compact">
        <div><strong>{fmt(totalGdp)}</strong><span>区域GDP/亿元</span></div>
        <div><strong>{((totalGdp / nationalGdp) * 100).toFixed(1)}%</strong><span>全国占比</span></div>
        <div><strong>{fmt(totalPopulation)}</strong><span>人口/万人</span></div>
        <div><strong>{fmt((totalGdp * 10000) / totalPopulation)}</strong><span>人均GDP/元</span></div>
        <div><strong>{provinces.length}</strong><span>省份数</span></div>
      </div>
      <Chart modalTitle="区域内部省份排名" option={{ title: { text: '图表2 区域内部省份排名' }, xAxis: { type: 'value', ...axisStyle }, yAxis: { type: 'category', data: [...rows].sort((a, b) => a.gdp - b.gdp).map((row) => row.provinceName), ...axisStyle }, series: [{ type: 'bar', data: [...rows].sort((a, b) => a.gdp - b.gdp).map((row) => row.gdp), itemStyle: { color: region?.color ?? MORANDI_TERRA } }] }} />
      <Chart modalTitle="区域产业结构" height={210} option={{ title: { text: '图表3 区域产业结构' }, tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: ['45%', '70%'], data: [{ name: '第一产业', value: rows.reduce((s, d) => s + d.primaryIndustry, 0) }, { name: '第二产业', value: rows.reduce((s, d) => s + d.secondaryIndustry, 0) }, { name: '第三产业', value: rows.reduce((s, d) => s + d.tertiaryIndustry, 0) }], color: [MORANDI_GREEN, MORANDI_BLUE, MORANDI_LAVENDER], label: { color: '#EDE8DC', formatter: '{b} {d}%' } }] }} />
      <Chart modalTitle="区域GDP趋势 vs 全国趋势" option={{ title: { text: '图表4 区域GDP趋势 vs 全国趋势' }, legend: { data: [region?.name ?? '区域', '全国'] }, xAxis: { type: 'category', data: years, ...axisStyle }, yAxis: { type: 'value', name: '亿元', ...axisStyle }, series: [{ name: region?.name ?? '区域', type: 'line', smooth: true, data: regionTrend, areaStyle: { opacity: 0.16 } }, { name: '全国', type: 'line', smooth: true, data: nationalTrend, lineStyle: { type: 'dashed' } }] }} />
    </div>
  );
}

export function DataInsightPanel({
  allData,
  selectedYear,
  selectedMetric,
}: {
  allData: ProvinceEconomy[];
  selectedYear: number;
  selectedMetric: MetricKey;
}) {
  const rows = selectedYearRows(allData, selectedYear);
  const sorted = [...rows].sort((a, b) => b[selectedMetric] - a[selectedMetric]);
  const top = sorted[0];
  const bottom = sorted.at(-1);
  const avg = rows.reduce((sum, row) => sum + row[selectedMetric], 0) / Math.max(rows.length, 1);
  return (
    <div className="insight-items">
      <span>{selectedYear}年{metricLabel(selectedMetric)}最高为{top?.provinceName ?? '-'}。</span>
      <span>全国省均值约为{fmt(avg, selectedMetric === 'gdpGrowth' || selectedMetric.includes('Rate') ? 1 : 0)}。</span>
      <span>{bottom?.provinceName ?? '-'}处于该指标低位，可与头部省份对比观察差距。</span>
    </div>
  );
}
