import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import type { ProvinceEconomy } from '../../types';
import { REGIONS } from '../../types';
import { MORANDI_PALETTE, axisStyle, withChartDefaults } from '../../utils/chartTheme';
import { kde, quantile } from '../../utils/statistics';

interface ViolinChartProps {
  allData: ProvinceEconomy[];
  mode: 'year' | 'region';
  height?: number;
}

const REGION_4 = REGIONS.filter((r) => ['east', 'central', 'west', 'northeast'].includes(r.code));

// Deterministic pseudo-random based on index (avoids re-render jitter)
function pseudoJitter(index: number, center: number, spread = 0.25) {
  const seed = ((index * 2654435761) % 1000) / 1000;
  return center + (seed - 0.5) * spread;
}

export default function ViolinChart({ allData, mode, height = 340 }: ViolinChartProps) {
  const option = useMemo(() => {
    if (mode === 'year') {
      const years = [2014, 2019, 2024];
      const colors = [MORANDI_PALETTE[7], MORANDI_PALETTE[0], MORANDI_PALETTE[2]];

      const series = years.map((year, yi) => {
        const rows = allData.filter((d) => d.year === year);
        const values = rows.map((d) => d.gdp);
        const kdeResult = kde(values, undefined, 80);
        const maxDensity = Math.max(...kdeResult.y, 1e-10);
        const halfWidth = 0.45;

        // Scale density to chart width
        const areaData: [number, number][] = [];
        for (let i = 0; i < kdeResult.x.length; i++) {
          areaData.push([yi + (kdeResult.y[i] / maxDensity) * halfWidth, kdeResult.x[i]]);
        }
        for (let i = kdeResult.x.length - 1; i >= 0; i--) {
          areaData.push([yi - (kdeResult.y[i] / maxDensity) * halfWidth, kdeResult.x[i]]);
        }

        const medianVal = quantile(values, 0.5);
        const q1 = quantile(values, 0.25);
        const q3 = quantile(values, 0.75);
        const iqr = q3 - q1;
        const lowerWhisker = Math.max(Math.min(...values), q1 - 1.5 * iqr);
        const upperWhisker = Math.min(Math.max(...values), q3 + 1.5 * iqr);

        // Deterministic jittered scatter
        const scatter = values.map((v, idx) => [pseudoJitter(idx, yi, 0.35), v]);

        return [
          {
            type: 'line',
            name: `${year}年 KDE`,
            data: areaData,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: colors[yi], width: 0 },
            areaStyle: { color: colors[yi], opacity: 0.45 },
            silent: true,
            z: 2,
            emphasis: { focus: 'none' },
          } as never,
          {
            type: 'scatter',
            name: `${year}年`,
            data: scatter,
            symbolSize: 5,
            itemStyle: { color: colors[yi], opacity: 0.65 },
            z: 4,
            emphasis: { scale: 1.8, itemStyle: { opacity: 1 } },
          } as never,
          // Median line
          {
            type: 'line',
            name: `${year}年 中位数`,
            data: [
              [yi - 0.28, medianVal],
              [yi + 0.28, medianVal],
            ],
            silent: true,
            lineStyle: { color: '#EDE8DC', width: 2 },
            symbol: 'none',
            z: 5,
          } as never,
          // Q1-Q3 box outline
          {
            type: 'line',
            name: `${year}年 IQR`,
            data: [
              [yi - 0.22, q1],
              [yi + 0.22, q1],
              [yi + 0.22, q3],
              [yi - 0.22, q3],
              [yi - 0.22, q1],
            ],
            silent: true,
            lineStyle: { color: '#EDE8DC', width: 1.5, type: 'dashed' as const },
            symbol: 'none',
            z: 3,
          } as never,
          // Whisker lines (vertical)
          {
            type: 'line',
            name: '',
            data: [[yi, q3], [yi, upperWhisker]],
            silent: true,
            lineStyle: { color: '#EDE8DC', width: 1 },
            symbol: 'none',
            z: 3,
          } as never,
          {
            type: 'line',
            name: '',
            data: [[yi, q1], [yi, lowerWhisker]],
            silent: true,
            lineStyle: { color: '#EDE8DC', width: 1 },
            symbol: 'none',
            z: 3,
          } as never,
        ];
      }).flat();

      return {
        title: { text: 'GDP分布形态对比（小提琴图）' },
        tooltip: {
          trigger: 'item',
          formatter: (p: { seriesName: string; value: number[] }) =>
            `${p.seriesName}<br/>GDP: ${p.value[1]?.toLocaleString('zh-CN')} 亿元`,
        },
        xAxis: {
          type: 'value' as const,
          min: -0.5,
          max: 2.5,
          axisLabel: { color: '#B8B2A6', fontSize: 10, formatter: (v: number) => ['2014', '2019', '2024'][Math.round(v)] ?? '' },
          axisLine: axisStyle.axisLine,
          axisTick: axisStyle.axisTick,
          splitLine: axisStyle.splitLine,
        },
        yAxis: { type: 'value' as const, name: 'GDP（亿元）', axisLabel: axisStyle.axisLabel, axisLine: axisStyle.axisLine, axisTick: axisStyle.axisTick, splitLine: axisStyle.splitLine },
        series,
        legend: { data: ['2014年', '2019年', '2024年'], textStyle: { color: '#B8B2A6', fontSize: 10 }, top: 20 },
        grid: { top: 52, right: 18, bottom: 30, left: 62, containLabel: true },
      };
    }

    // Region mode
    const year = 2024;
    const rows = allData.filter((d) => d.year === year);
    const regionColors = [MORANDI_PALETTE[0], MORANDI_PALETTE[1], MORANDI_PALETTE[2], MORANDI_PALETTE[3]];

    const series = REGION_4.map((region, ri) => {
      const provinceRows = rows.filter((d) => region.provinces.includes(d.provinceName));
      const values = provinceRows.map((d) => d.gdp);
      if (values.length === 0) return [];

      const kdeResult = kde(values, undefined, 80);
      const maxDensity = Math.max(...kdeResult.y, 1e-10);
      const halfWidth = 0.4;

      const areaData: [number, number][] = [];
      for (let i = 0; i < kdeResult.x.length; i++) {
        areaData.push([ri + (kdeResult.y[i] / maxDensity) * halfWidth, kdeResult.x[i]]);
      }
      for (let i = kdeResult.x.length - 1; i >= 0; i--) {
        areaData.push([ri - (kdeResult.y[i] / maxDensity) * halfWidth, kdeResult.x[i]]);
      }

      const medianVal = quantile(values, 0.5);
      const q1 = quantile(values, 0.25);
      const q3 = quantile(values, 0.75);

      return [
        {
          type: 'line',
          name: `${region.name} KDE`,
          data: areaData,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: regionColors[ri], width: 0 },
          areaStyle: { color: regionColors[ri], opacity: 0.4 },
          silent: true,
          z: 2,
        },
        {
          type: 'scatter',
          name: region.name,
          data: values.map((v, idx) => [pseudoJitter(idx, ri, 0.32), v]),
          symbolSize: 6,
          itemStyle: { color: regionColors[ri], opacity: 0.6 },
          z: 4,
          emphasis: { scale: 1.8, itemStyle: { opacity: 1 } },
        },
        {
          type: 'line',
          name: '',
          data: [
            [ri - 0.25, medianVal],
            [ri + 0.25, medianVal],
          ],
          silent: true,
          lineStyle: { color: '#EDE8DC', width: 2.5 },
          symbol: 'none',
          z: 5,
        },
        {
          type: 'line',
          name: '',
          data: [
            [ri - 0.2, q1],
            [ri + 0.2, q1],
            [ri + 0.2, q3],
            [ri - 0.2, q3],
            [ri - 0.2, q1],
          ],
          silent: true,
          lineStyle: { color: '#EDE8DC', width: 1, type: 'dashed' as const },
          symbol: 'none',
          z: 3,
        },
      ];
    }).flat();

    return {
      title: { text: `${year}年 各区域GDP分布（小提琴图）` },
      tooltip: {
        trigger: 'item',
        formatter: (p: { seriesName: string; value: number[] }) =>
          `${p.seriesName}<br/>GDP: ${p.value[1]?.toLocaleString('zh-CN')} 亿元`,
      },
      xAxis: {
        type: 'value' as const,
        min: -0.5,
        max: REGION_4.length - 0.5,
        axisLabel: { color: '#B8B2A6', fontSize: 10, formatter: (v: number) => REGION_4[Math.round(v)]?.name ?? '' },
        axisLine: axisStyle.axisLine,
        axisTick: axisStyle.axisTick,
        splitLine: axisStyle.splitLine,
      },
      yAxis: { type: 'value' as const, name: 'GDP（亿元）', axisLabel: axisStyle.axisLabel, axisLine: axisStyle.axisLine, axisTick: axisStyle.axisTick, splitLine: axisStyle.splitLine },
      series,
      legend: { data: REGION_4.map((r) => r.name), textStyle: { color: '#B8B2A6', fontSize: 10 }, top: 20 },
      grid: { top: 52, right: 18, bottom: 30, left: 62, containLabel: true },
    };
  }, [allData, mode]);

  return (
    <div className="chart-card">
      <ReactECharts option={withChartDefaults(option) as never} style={{ height, width: '100%' }} notMerge lazyUpdate />
    </div>
  );
}
