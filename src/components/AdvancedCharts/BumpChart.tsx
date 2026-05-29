import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import type { ProvinceEconomy } from '../../types';
import { MORANDI_PALETTE, axisStyle, withChartDefaults } from '../../utils/chartTheme';

interface BumpChartProps {
  allData: ProvinceEconomy[];
  height?: number;
}

export default function BumpChart({ allData, height = 400 }: BumpChartProps) {
  const option = useMemo(() => {
    const years = [...new Set(allData.map((d) => d.year))].sort((a, b) => a - b);

    // Top15 by latest year GDP
    const latestYear = years[years.length - 1];
    const latestRanked = allData
      .filter((d) => d.year === latestYear)
      .sort((a, b) => b.gdp - a.gdp);
    const top15 = latestRanked.slice(0, 15).map((d) => d.provinceName);

    // Build rank data for each province across years
    const series = top15.map((province, pi) => {
      const rankData: number[] = [];
      for (const year of years) {
        const rows = allData
          .filter((d) => d.year === year)
          .sort((a, b) => b.gdp - a.gdp);
        const rank = rows.findIndex((d) => d.provinceName === province) + 1;
        rankData.push(rank || 16);
      }

      const isTop3 = pi < 3;
      return {
        name: province,
        type: 'line',
        data: rankData,
        smooth: true,
        symbol: 'circle',
        symbolSize: isTop3 ? 6 : 4,
        lineStyle: {
          width: isTop3 ? 3 : 1.5,
          color: MORANDI_PALETTE[pi % MORANDI_PALETTE.length],
        },
        itemStyle: { color: MORANDI_PALETTE[pi % MORANDI_PALETTE.length] },
        emphasis: { focus: 'series', lineStyle: { width: isTop3 ? 5 : 3 } },
        endLabel: {
          show: true,
          formatter: '{b}',
          offset: [8, 0],
          color: '#EDE8DC',
          fontWeight: isTop3 ? 700 : 400,
          fontSize: isTop3 ? 11 : 9,
        },
      };
    });

    return {
      title: { text: 'Top15省份 GDP排名动态变化（Bump Chart）' },
      tooltip: {
        trigger: 'axis',
        formatter: (params: Array<{ seriesName: string; value: number; color: string; axisValue: string }>) => {
          const sorted = [...params].sort((a, b) => a.value - b.value);
          const lines = sorted.map((p) =>
            `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: <b>第${p.value}名</b>`,
          );
          return `<b>${params[0]?.axisValue ?? ''}年</b><br/>${lines.join('<br/>')}`;
        },
      },
      xAxis: {
        type: 'category',
        data: years.map(String),
        ...axisStyle,
      },
      yAxis: {
        type: 'value',
        name: '排名',
        inverse: true,
        min: 1,
        max: 15,
        interval: 1,
        ...axisStyle,
        axisLabel: { color: '#B8B2A6', fontSize: 10, formatter: (v: number) => `第${v}名` },
      },
      series,
      legend: { show: false },
      grid: { top: 40, right: 85, bottom: 30, left: 52, containLabel: true },
    };
  }, [allData]);

  return (
    <div className="chart-card">
      <ReactECharts option={withChartDefaults(option) as never} style={{ height, width: '100%' }} notMerge lazyUpdate />
    </div>
  );
}
