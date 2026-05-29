import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import type { ProvinceEconomy, MetricKey } from '../../types';
import { METRIC_OPTIONS } from '../../types';
import { correlationMatrix } from '../../utils/statistics';
import { withChartDefaults } from '../../utils/chartTheme';

interface CorrelationHeatmapProps {
  allData: ProvinceEconomy[];
  year: number;
  height?: number;
}

const CORR_METRICS: MetricKey[] = [
  'gdp', 'gdpPerCapita', 'gdpGrowth', 'population',
  'tertiaryIndustry', 'retailSales', 'perCapitaIncome',
  'urbanizationRate', 'fiscalRevenue', 'fixedInvestment',
];

function metricLabel(key: MetricKey) {
  return METRIC_OPTIONS.find((m) => m.key === key)?.label ?? key;
}

export default function CorrelationHeatmap({ allData, year, height = 420 }: CorrelationHeatmapProps) {
  const option = useMemo(() => {
    const rows = allData.filter((d) => d.year === year);
    const labels = CORR_METRICS.map(metricLabel);

    const metricData = CORR_METRICS.map((key) =>
      rows.map((d) => d[key] as number),
    );

    const matrix = correlationMatrix(metricData);

    const dataPoints: Array<{ value: [number, number, number] }> = [];
    for (let i = 0; i < CORR_METRICS.length; i++) {
      for (let j = 0; j < CORR_METRICS.length; j++) {
        const r = Number(matrix[i][j].toFixed(2));
        dataPoints.push({ value: [j, i, r] });
      }
    }

    return {
      title: { text: `${year}年 经济指标相关性热力图` },
      tooltip: {
        trigger: 'item' as const,
        formatter: (p: { value: number[] }) =>
          `<b>${labels[p.value[1]]}</b> ↔ <b>${labels[p.value[0]]}</b><br/>Pearson r = <b>${p.value[2].toFixed(2)}</b>`,
      },
      xAxis: {
        type: 'category' as const,
        data: labels,
        position: 'top' as const,
        axisLabel: { rotate: 40, fontSize: 9, color: '#B8B2A6', interval: 0 },
        axisLine: { lineStyle: { color: 'rgba(196,191,182,0.2)' } },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category' as const,
        data: labels,
        axisLabel: { fontSize: 9, color: '#B8B2A6', interval: 0 },
        axisLine: { lineStyle: { color: 'rgba(196,191,182,0.2)' } },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      visualMap: {
        min: -1,
        max: 1,
        show: true,
        top: 2,
        right: 4,
        calculable: false,
        text: ['+1 正相关', '-1 负相关'],
        textStyle: { color: '#B8B2A6', fontSize: 9 },
        inRange: {
          color: ['#8E9CAF', '#A3B0C4', '#D4CFC7', '#C4A88B', '#D4B896'],
        },
        itemWidth: 12,
        itemHeight: 100,
      },
      series: [
        {
          type: 'heatmap',
          data: dataPoints,
          label: {
            show: true,
            formatter: (p: { value: number[] }) => p.value[2].toFixed(2),
            fontSize: 9,
            color: '#EDE8DC',
          },
          emphasis: {
            disabled: false,
            itemStyle: {
              shadowBlur: 14,
              shadowColor: 'rgba(212,184,150,0.7)',
              borderColor: '#EDE8DC',
              borderWidth: 1.5,
            },
          },
        },
      ],
      grid: { top: 10, right: 60, bottom: 8, left: 8, containLabel: true },
    };
  }, [allData, year]);

  return (
    <div className="chart-card">
      <ReactECharts
        option={withChartDefaults(option) as never}
        style={{ height, width: '100%' }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
