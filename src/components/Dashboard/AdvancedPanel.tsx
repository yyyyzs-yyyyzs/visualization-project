import { useState } from 'react';
import type { ProvinceEconomy } from '../../types';
import {
  ViolinChart,
  CorrelationHeatmap,
  ScatterMatrix,
  SankeyChart,
  StreamChart,
  ClusterScatter,
  BumpChart,
  DataStory,
} from '../AdvancedCharts';

interface AdvancedPanelProps {
  allData: ProvinceEconomy[];
  selectedYear: number;
}

type AdvancedTab = 'distribution' | 'correlation' | 'flow' | 'cluster' | 'story';

const TABS: { key: AdvancedTab; label: string }[] = [
  { key: 'distribution', label: '分布分析' },
  { key: 'correlation', label: '相关分析' },
  { key: 'flow', label: '流向与时序' },
  { key: 'cluster', label: '聚类降维' },
  { key: 'story', label: '数据叙事' },
];

export default function AdvancedPanel({ allData, selectedYear }: AdvancedPanelProps) {
  const [activeTab, setActiveTab] = useState<AdvancedTab>('distribution');
  const [violinMode, setViolinMode] = useState<'year' | 'region'>('year');
  const [sankeyMode, setSankeyMode] = useState<'industry' | 'region'>('industry');

  return (
    <div className="advanced-panel">
      {/* Tab bar */}
      <div className="advanced-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`advanced-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="advanced-content">
        {activeTab === 'distribution' && (
          <div className="advanced-section">
            <div className="advanced-section-header">
              <h4>分布形态分析</h4>
              <div className="advanced-toggle">
                <button className={`toggle-btn ${violinMode === 'year' ? 'active' : ''}`} onClick={() => setViolinMode('year')}>按年份</button>
                <button className={`toggle-btn ${violinMode === 'region' ? 'active' : ''}`} onClick={() => setViolinMode('region')}>按区域</button>
              </div>
            </div>
            <ViolinChart allData={allData} mode={violinMode} height={340} />
            <p className="advanced-desc">小提琴图展示人均GDP在各省份间的分布形态。曲线宽度表示省份密度，中位线（白色实线）和四分位线（虚线）刻画分布的集中趋势和离散程度。</p>
          </div>
        )}

        {activeTab === 'correlation' && (
          <div className="advanced-section">
            <CorrelationHeatmap allData={allData} year={selectedYear} height={400} />
            <p className="advanced-desc">Pearson相关系数矩阵。暖色（灰陶）表示正相关——指标同向变动；冷色（灰蓝）表示负相关——指标反向变动。|r|越接近1，颜色越深。</p>

            <div style={{ marginTop: 16 }}>
              <ScatterMatrix allData={allData} year={selectedYear} height={520} />
              <p className="advanced-desc">散点图矩阵展示5个核心指标的两两关系。对角线为密度曲线，下三角为散点图，每点代表一个省份，颜色按四大经济区域分组。</p>
            </div>
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="advanced-section">
            <div className="advanced-section-header">
              <h4>GDP流向分析</h4>
              <div className="advanced-toggle">
                <button className={`toggle-btn ${sankeyMode === 'industry' ? 'active' : ''}`} onClick={() => setSankeyMode('industry')}>产业流向</button>
                <button className={`toggle-btn ${sankeyMode === 'region' ? 'active' : ''}`} onClick={() => setSankeyMode('region')}>区域流向</button>
              </div>
            </div>
            <SankeyChart allData={allData} year={selectedYear} mode={sankeyMode} height={380} />
            <p className="advanced-desc">桑基图展示GDP从产业/区域到省份的流向与构成。流线宽度与GDP值成正比，hover可查看具体数值。</p>

            <div style={{ marginTop: 16 }}>
              <StreamChart allData={allData} height={340} />
              <p className="advanced-desc">河流图展示2014-2024年七大区域GDP占全国比重的时序变化。所有区域占比总和为100%，副轴折线为全国GDP总量。</p>
            </div>

            <div style={{ marginTop: 16 }}>
              <BumpChart allData={allData} height={380} />
              <p className="advanced-desc">Bump Chart展示Top15省份GDP排名动态变化（2014-2024）。Y轴反转（第1名在最上方），线条越粗排名越靠前，hover查看历年排名轨迹。</p>
            </div>
          </div>
        )}

        {activeTab === 'cluster' && (
          <div className="advanced-section">
            <ClusterScatter allData={allData} year={selectedYear} height={400} />
            <p className="advanced-desc">选取8个核心经济指标，经PCA降维至二维平面。K-means（k=3）聚类将经济画像相似的省份归为一组。聚类中心用菱形标记，省份名标签显示简称。PC1主要解释经济规模，PC2解释经济结构。</p>
          </div>
        )}

        {activeTab === 'story' && (
          <div className="advanced-section">
            <DataStory allData={allData} />
            <p className="advanced-desc" style={{ marginTop: 12 }}>数据叙事模块自动生成4段分析文本，配合迷你Sparkline展示趋势。支持自动轮播（6秒/段）或手动切换。分析仅描述趋势与特征，不涉及因果推断。</p>
          </div>
        )}
      </div>
    </div>
  );
}
