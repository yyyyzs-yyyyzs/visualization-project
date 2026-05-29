import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import type { ProvinceEconomy, MetricKey } from '../../types';
import { REGIONS } from '../../types';
import { MORANDI_PALETTE } from '../../utils/chartTheme';
import { kde } from '../../utils/statistics';

interface ScatterMatrixProps {
  allData: ProvinceEconomy[];
  year: number;
  height?: number;
}

const SPLOM_METRICS: Array<{ key: MetricKey; label: string; unit: string }> = [
  { key: 'gdp', label: 'GDP', unit: '亿元' },
  { key: 'gdpPerCapita', label: '人均GDP', unit: '元/人' },
  { key: 'gdpGrowth', label: 'GDP增速', unit: '%' },
  { key: 'tertiaryIndustry', label: '三产增加值', unit: '亿元' },
  { key: 'perCapitaIncome', label: '人均收入', unit: '元' },
];

const REGION_COLORS: Record<string, string> = {
  'east': MORANDI_PALETTE[0],
  'central': MORANDI_PALETTE[1],
  'west': MORANDI_PALETTE[2],
  'northeast': MORANDI_PALETTE[3],
};

function getRegion(provinceName: string) {
  for (const r of REGIONS) {
    if (r.provinces.includes(provinceName)) return r.code;
  }
  return 'west';
}

export default function ScatterMatrix({ allData, year, height = 520 }: ScatterMatrixProps) {
  const { option } = useMemo(() => {
    const rows = allData.filter((d) => d.year === year);
    const n = SPLOM_METRICS.length;
    const gridGap = 6;
    const cellSize = 100 / n;

    const grids: Record<string, unknown>[] = [];
    const xAxes: Record<string, unknown>[] = [];
    const yAxes: Record<string, unknown>[] = [];
    const series: Record<string, unknown>[] = [];

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const idx = row * n + col;
        const left = col * cellSize + gridGap / 2;
        const top = 48 + row * cellSize;

        grids.push({
          left: `${left}%`,
          top: `${top}%`,
          width: `${cellSize - gridGap}%`,
          height: `${cellSize - gridGap - 3}%`,
          show: true,
          borderColor: 'rgba(196,191,182,0.12)',
        });

        xAxes.push({
          gridIndex: idx,
          type: 'value',
          axisLabel: row === n - 1 ? { fontSize: 8, color: '#B8B2A6' } : { show: false },
          axisLine: { lineStyle: { color: 'rgba(196,191,182,0.15)' } },
          splitLine: { show: false },
          scale: true,
        });

        yAxes.push({
          gridIndex: idx,
          type: 'value',
          axisLabel: col === 0 ? { fontSize: 8, color: '#B8B2A6' } : { show: false },
          axisLine: { lineStyle: { color: 'rgba(196,191,182,0.15)' } },
          splitLine: { show: false },
          scale: true,
        });

        if (row === col) {
          // Diagonal: density curve
          const values = rows.map((d) => d[SPLOM_METRICS[row].key] as number);
          const kdeResult = kde(values, undefined, 60);
          series.push({
            type: 'line',
            xAxisIndex: idx,
            yAxisIndex: idx,
            data: kdeResult.x.map((xv, i) => [xv, kdeResult.y[i]]),
            smooth: true,
            showSymbol: false,
            lineStyle: { color: MORANDI_PALETTE[0], width: 2 },
            areaStyle: { color: MORANDI_PALETTE[0], opacity: 0.3 },
            silent: true,
          });
        } else {
          // Off-diagonal: scatter plot
          const xKey = SPLOM_METRICS[col].key;
          const yKey = SPLOM_METRICS[row].key;

          const regionGroups = new Map<string, { name: string; data: Array<{ value: [number, number]; name: string }> }>();
          for (const d of rows) {
            const region = getRegion(d.provinceName);
            if (!regionGroups.has(region)) {
              regionGroups.set(region, {
                name: REGIONS.find((r) => r.code === region)?.name ?? region,
                data: [],
              });
            }
            regionGroups.get(region)!.data.push({
              value: [d[xKey] as number, d[yKey] as number],
              name: d.provinceName,
            });
          }

          for (const [code, group] of regionGroups) {
            series.push({
              type: 'scatter',
              xAxisIndex: idx,
              yAxisIndex: idx,
              name: group.name,
              data: group.data,
              symbolSize: 7,
              itemStyle: { color: REGION_COLORS[code] ?? MORANDI_PALETTE[0], opacity: 0.7 },
              emphasis: { scale: 1.6, itemStyle: { opacity: 1 } },
            });
          }
        }
      }
    }

    // Column headers (top)
    const colHeaderSeries = SPLOM_METRICS.map((_m, col) => ({
      type: 'scatter' as const,
      xAxisIndex: col,
      yAxisIndex: 0,
      data: [{ value: [0, 0], name: '' }],
      symbolSize: 0,
      silent: true,
    }));

    const tooltipFormatter = (p: { name: string; value: number[]; seriesName: string }) => {
      if (!p.name) return '';
      // Determine which cell this is from by the series type
      // Use the actual data values
      const xv = p.value[0]?.toLocaleString('zh-CN') ?? '—';
      const yv = p.value[1]?.toLocaleString('zh-CN') ?? '—';
      return `<b>${p.name}</b><br/>X: ${xv}<br/>Y: ${yv}`;
    };

    return {
      option: {
        title: { text: `${year}年 5维指标散点图矩阵`, left: 0, top: 0 },
        tooltip: {
          trigger: 'item',
          formatter: tooltipFormatter,
        },
        grid: grids,
        xAxis: xAxes,
        yAxis: yAxes,
        series: [...series, ...colHeaderSeries],
        legend: {
          data: ['东部', '中部', '西部', '东北'],
          textStyle: { color: '#B8B2A6', fontSize: 9 },
          top: 20,
          right: 0,
        },
      },
    };
  }, [allData, year]);

  return (
    <div className="chart-card">
      <ReactECharts option={option as never} style={{ height, width: '100%' }} notMerge lazyUpdate />
    </div>
  );
}
