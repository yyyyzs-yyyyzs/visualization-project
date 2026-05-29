import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import type { ProvinceEconomy } from '../../types';
import { MORANDI_PALETTE, axisStyle, withChartDefaults } from '../../utils/chartTheme';

interface StreamChartProps {
  allData: ProvinceEconomy[];
  height?: number;
}

// Non-overlapping 4 major regions (sum = 100%)
const REGIONS_4 = [
  { name: '东部', provinces: ['北京', '天津', '河北', '上海', '江苏', '浙江', '福建', '山东', '广东', '海南'] },
  { name: '中部', provinces: ['山西', '安徽', '江西', '河南', '湖北', '湖南'] },
  { name: '西部', provinces: ['内蒙古', '广西', '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆'] },
  { name: '东北', provinces: ['辽宁', '吉林', '黑龙江'] },
];

export default function StreamChart({ allData, height = 320 }: StreamChartProps) {
  const option = useMemo(() => {
    const years = [...new Set(allData.map((d) => d.year))].sort((a, b) => a - b);

    // Compute total GDP per year
    const totalByYear = new Map<number, number>();
    for (const year of years) {
      const total = allData.filter((d) => d.year === year).reduce((s, d) => s + d.gdp, 0);
      totalByYear.set(year, total);
    }

    // Compute region GDP share per year (normalized to ensure sum = 100%)
    const regionRaw = REGIONS_4.map((region) =>
      years.map((year) => {
        const yearTotal = totalByYear.get(year) ?? 1;
        const regionGdp = allData
          .filter((d) => d.year === year && region.provinces.includes(d.provinceName))
          .reduce((s, d) => s + d.gdp, 0);
        return Number(((regionGdp / yearTotal) * 100).toFixed(1));
      }),
    );

    // Normalize to exactly 100% per year
    const regionData = years.map((_, yi) => {
      const raw = REGIONS_4.map((_, ri) => regionRaw[ri][yi]);
      const rawSum = raw.reduce((s, v) => s + v, 0);
      return raw.map((v) => rawSum > 0 ? Number((v / rawSum * 100).toFixed(1)) : 25);
    });

    const series = REGIONS_4.map((region, ri) => ({
      name: region.name,
      type: 'line',
      stack: 'total',
      smooth: true,
      symbol: 'none',
      data: years.map((_, yi) => regionData[yi][ri]),
      areaStyle: { opacity: 0.7 },
      lineStyle: { width: 0.5, color: MORANDI_PALETTE[ri] },
      itemStyle: { color: MORANDI_PALETTE[ri] },
      emphasis: { focus: 'series' },
    }));

    // Total GDP line (right y-axis, 万亿元)
    const totalGdpData = years.map((year) => {
      const total = totalByYear.get(year) ?? 0;
      return Number((total / 10000).toFixed(1));
    });

    series.push({
      name: 'GDP总量（万亿元）',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: totalGdpData,
      lineStyle: { color: '#EDE8DC', width: 2 },
      itemStyle: { color: '#EDE8DC' },
      areaStyle: { opacity: 0 },
    } as never);

    return {
      title: { text: '2014-2024年 四大区域GDP占比变化（河流图）' },
      tooltip: {
        trigger: 'axis',
        formatter: (params: Array<{ seriesName: string; value: number; color: string; axisValue: string }>) => {
          const parts = params
            .filter((p) => p.seriesName !== 'GDP总量（万亿元）')
            .map((p) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: <b>${p.value}%</b>`);
          const total = params.find((p) => p.seriesName === 'GDP总量（万亿元）');
          return `<b>${params[0]?.axisValue ?? ''}年</b><br/>${parts.join('<br/>')}${total ? `<br/><hr style="border-color:rgba(255,255,255,0.1)"/>GDP总量: <b>${total.value}</b> 万亿元` : ''}`;
        },
      },
      xAxis: {
        type: 'category',
        data: years,
        boundaryGap: false,
        ...axisStyle,
      },
      yAxis: [
        {
          type: 'value',
          name: '占比 (%)',
          min: 0,
          max: 100,
          ...axisStyle,
        },
        {
          type: 'value',
          name: '万亿元',
          ...axisStyle,
          axisLabel: { color: '#B8B2A6', fontSize: 10 },
        },
      ],
      series,
      legend: {
        data: [...REGIONS_4.map((r) => r.name), 'GDP总量（万亿元）'],
        textStyle: { color: '#B8B2A6', fontSize: 9 },
        top: 20,
        right: 0,
      },
      grid: { top: 60, right: 55, bottom: 30, left: 52, containLabel: true },
    };
  }, [allData]);

  return (
    <div className="chart-card">
      <ReactECharts option={withChartDefaults(option) as never} style={{ height, width: '100%' }} notMerge lazyUpdate />
    </div>
  );
}
