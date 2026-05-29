import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import type { ProvinceEconomy, MetricKey } from '../../types';
import { MORANDI_PALETTE, axisStyle, withChartDefaults } from '../../utils/chartTheme';
import { pca, kmeans } from '../../utils/statistics';

interface ClusterScatterProps {
  allData: ProvinceEconomy[];
  year: number;
  height?: number;
}

const CLUSTER_METRICS: MetricKey[] = [
  'gdp', 'gdpPerCapita', 'gdpGrowth', 'tertiaryIndustry',
  'perCapitaIncome', 'urbanizationRate', 'retailSales', 'fixedInvestment',
];

const CLUSTER_COLORS: string[] = [MORANDI_PALETTE[0], MORANDI_PALETTE[1], MORANDI_PALETTE[2], MORANDI_PALETTE[3], MORANDI_PALETTE[4]];

export default function ClusterScatter({ allData, year, height = 380 }: ClusterScatterProps) {
  const option = useMemo(() => {
    const rows = allData.filter((d) => d.year === year);
    const provinceNames = rows.map((d) => d.provinceName);

    // Build data matrix [nSamples][nFeatures]
    const dataMatrix = rows.map((d) =>
      CLUSTER_METRICS.map((key) => d[key] as number),
    );

    // PCA
    const pcaResult = pca(dataMatrix, 2);
    const projected = pcaResult.projected;
    const var1 = pcaResult.variances[0] ?? 0;
    const var2 = pcaResult.variances[1] ?? 0;
    const totalVar = pcaResult.variances.reduce((s, v) => s + v, 0);
    const pc1Pct = totalVar > 0 ? ((var1 / totalVar) * 100).toFixed(1) : '0';
    const pc2Pct = totalVar > 0 ? ((var2 / totalVar) * 100).toFixed(1) : '0';

    // K-means (k=3)
    const { clusters, centroids } = kmeans(projected, 3);

    // Build series per cluster
    const clusterGroups = new Map<number, { name: string; value: [number, number] }[]>();
    for (let i = 0; i < projected.length; i++) {
      const c = clusters[i];
      if (!clusterGroups.has(c)) clusterGroups.set(c, []);
      clusterGroups.get(c)!.push({
        name: provinceNames[i],
        value: [Number(projected[i][0].toFixed(3)), Number(projected[i][1].toFixed(3))],
      });
    }

    const series = [
      ...Array.from(clusterGroups.entries()).map(([c, data]) => ({
        type: 'scatter',
        name: `聚类 ${c + 1}`,
        data,
        symbolSize: 12,
        itemStyle: { color: CLUSTER_COLORS[c % CLUSTER_COLORS.length], opacity: 0.8 },
        label: { show: true, formatter: '{b}', position: 'top', fontSize: 9, color: '#B8B2A6' },
        emphasis: { scale: 1.5, label: { fontSize: 12, fontWeight: 'bold' } },
      })),
      {
        type: 'scatter',
        name: '聚类中心',
        data: centroids.map((c, i) => ({
          name: `中心 ${i + 1}`,
          value: [Number(c[0].toFixed(3)), Number(c[1].toFixed(3))],
        })),
        symbolSize: 18,
        symbol: 'diamond',
        itemStyle: { color: '#EDE8DC', opacity: 1 },
        label: { show: true, formatter: '{b}', position: 'right', fontSize: 10, color: '#EDE8DC' },
      },
    ] as never[];

    return {
      title: { text: `${year}年 多维经济指标PCA降维聚类` },
      tooltip: {
        trigger: 'item',
        formatter: (p: { name: string; value: number[] }) =>
          `${p.name}<br/>PC1: ${p.value[0]}<br/>PC2: ${p.value[1]}`,
      },
      xAxis: {
        type: 'value',
        name: `PC1 (${pc1Pct}%) — 经济规模`,
        nameLocation: 'center',
        nameGap: 30,
        ...axisStyle,
      },
      yAxis: {
        type: 'value',
        name: `PC2 (${pc2Pct}%) — 经济结构`,
        nameLocation: 'center',
        nameGap: 35,
        ...axisStyle,
      },
      series,
      legend: { textStyle: { color: '#B8B2A6', fontSize: 10 } },
      grid: { top: 52, right: 18, bottom: 35, left: 55, containLabel: true },
    };
  }, [allData, year]);

  return (
    <div className="chart-card">
      <ReactECharts option={withChartDefaults(option) as never} style={{ height, width: '100%' }} notMerge lazyUpdate />
      <p style={{ color: '#8E8B82', fontSize: 10, marginTop: 8, textAlign: 'center' }}>
        PC1 解释经济规模（GDP、财政收入等），PC2 解释经济结构（三产占比、城镇化率等）。点数越近代表经济画像越相似。
      </p>
    </div>
  );
}
