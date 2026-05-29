import type { MetricKey, ProvinceEconomy } from '../../types';
import { ChartModalProvider, ProvinceComparePanel, ProvinceDetailPanel, RegionAnalysisPanel } from './BCharts';
import AdvancedPanel from './AdvancedPanel';

interface RightPanelProps {
  allData: ProvinceEconomy[];
  panelState: 'intro' | 'detail' | 'compare' | 'region' | 'advanced';
  selectedProvince: string | null;
  compareProvinces: string[];
  selectedRegion: string | null;
  selectedYear: number;
  selectedMetric: MetricKey;
  onClose: () => void;
  onStartCompare: () => void;
  onRemoveCompare: (name: string) => void;
}

export default function RightPanel({
  allData,
  panelState,
  selectedProvince,
  compareProvinces,
  selectedRegion,
  selectedYear,
  selectedMetric: _selectedMetric,
  onClose,
  onStartCompare,
  onRemoveCompare,
}: RightPanelProps) {
  return (
    <ChartModalProvider>
      <aside className="right-panel">
        <div className="right-panel-header">
          <span className="right-panel-title">
            {panelState === 'intro' && '数据总览'}
            {panelState === 'detail' && selectedProvince}
            {panelState === 'compare' && `省份对比 (${compareProvinces.length})`}
            {panelState === 'region' && '区域经济圈分析'}
            {panelState === 'advanced' && '高级分析'}
          </span>
          {panelState !== 'intro' && <button className="close-btn" onClick={onClose}>×</button>}
        </div>
        <div className="right-panel-content">
          {panelState === 'intro' && (
            <div className="intro-panel">
              <p>点击地图省份查看省份画像，或在左侧排行榜直接选择省份。</p>
              <p>对比模式支持 2-4 个省份，区域按钮会切换到经济圈分析。</p>
              <div className="intro-shortcuts">
                <h4>基础分析（人物 B）</h4>
                <p>省份详情：8 个可视化区域</p>
                <p>省份对比：6 个 ECharts 图表</p>
                <p>区域分析：总览卡片 + 3 个图表</p>
              </div>
              <div className="intro-shortcuts" style={{ marginTop: 8 }}>
                <h4>高级分析（人物 C）</h4>
                <p>小提琴图 · 热力图 · 散点图矩阵</p>
                <p>桑基图 · 河流图 · Bump Chart</p>
                <p>PCA聚类 · 数据叙事</p>
                <p style={{ color: '#C4A88B', marginTop: 4 }}>← 点击左侧「高级分析」进入</p>
              </div>
            </div>
          )}
          {panelState === 'detail' && selectedProvince && (
            <ProvinceDetailPanel province={selectedProvince} allData={allData} selectedYear={selectedYear} onStartCompare={onStartCompare} />
          )}
          {panelState === 'compare' && (
            <ProvinceComparePanel provinces={compareProvinces} allData={allData} selectedYear={selectedYear} onRemoveCompare={onRemoveCompare} />
          )}
          {panelState === 'region' && selectedRegion && (
            <RegionAnalysisPanel regionCode={selectedRegion} allData={allData} selectedYear={selectedYear} />
          )}
          {panelState === 'advanced' && (
            <AdvancedPanel allData={allData} selectedYear={selectedYear} />
          )}
        </div>
      </aside>
    </ChartModalProvider>
  );
}
