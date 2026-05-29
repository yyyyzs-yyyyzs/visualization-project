import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import type { ProvinceEconomy } from '../../types';
import { MORANDI_PALETTE } from '../../utils/chartTheme';
import { withChartDefaults } from '../../utils/chartTheme';

interface SankeyChartProps {
  allData: ProvinceEconomy[];
  year: number;
  mode?: 'industry' | 'region';
  height?: number;
}

export default function SankeyChart({ allData, year, mode = 'industry', height = 360 }: SankeyChartProps) {
  const option = useMemo(() => {
    const rows = allData.filter((d) => d.year === year);
    const top10 = [...rows].sort((a, b) => b.gdp - a.gdp).slice(0, 10);

    if (mode === 'industry') {
      // 三次产业 → Top10省份
      const nodes = [
        { name: '第一产业', itemStyle: { color: '#B5C4B1' } },
        { name: '第二产业', itemStyle: { color: '#A3B0C4' } },
        { name: '第三产业', itemStyle: { color: '#B8B0C4' } },
        ...top10.map((d, i) => ({
          name: d.provinceName,
          itemStyle: { color: MORANDI_PALETTE[i % MORANDI_PALETTE.length] },
        })),
      ];

      const links = [
        ...top10.map((d) => ({
          source: '第一产业',
          target: d.provinceName,
          value: d.primaryIndustry,
        })),
        ...top10.map((d) => ({
          source: '第二产业',
          target: d.provinceName,
          value: d.secondaryIndustry,
        })),
        ...top10.map((d) => ({
          source: '第三产业',
          target: d.provinceName,
          value: d.tertiaryIndustry,
        })),
      ];

      return {
        title: { text: `${year}年 产业→省份GDP流向（Top10）` },
        tooltip: { trigger: 'item', formatter: (p: { name: string; value: number }) => `${p.name}: ${p.value?.toLocaleString('zh-CN')} 亿元` },
        series: [{
          type: 'sankey',
          layout: 'none',
          emphasis: { focus: 'adjacency' },
          nodeAlign: 'left',
          data: nodes,
          links,
          label: { color: '#EDE8DC', fontSize: 10 },
          lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.25 },
        }],
      };
    }

    // Region → provinces mode
    const regionDefs = [
      { name: '东部', provinces: ['北京', '天津', '河北', '上海', '江苏', '浙江', '福建', '山东', '广东', '海南'], color: MORANDI_PALETTE[0] },
      { name: '中部', provinces: ['山西', '安徽', '江西', '河南', '湖北', '湖南'], color: MORANDI_PALETTE[1] },
      { name: '西部', provinces: ['内蒙古', '广西', '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆'], color: MORANDI_PALETTE[2] },
      { name: '东北', provinces: ['辽宁', '吉林', '黑龙江'], color: MORANDI_PALETTE[3] },
    ];

    const allProvinceNodes: { name: string; itemStyle: { color: string } }[] = [];
    const allLinks: { source: string; target: string; value: number }[] = [];

    for (const region of regionDefs) {
      const regionRows = rows.filter((d) => region.provinces.includes(d.provinceName));
      for (const d of regionRows) {
        allProvinceNodes.push({ name: d.provinceName, itemStyle: { color: region.color } });
        allLinks.push({ source: region.name, target: d.provinceName, value: d.gdp });
      }
    }

    const nodes = [
      ...regionDefs.map((r) => ({ name: r.name, itemStyle: { color: r.color } })),
      ...allProvinceNodes,
    ];

    return {
      title: { text: `${year}年 区域→省份GDP流向` },
      tooltip: { trigger: 'item', formatter: (p: { name: string; value: number }) => `${p.name}: ${p.value?.toLocaleString('zh-CN')} 亿元` },
      series: [{
        type: 'sankey',
        layout: 'none',
        emphasis: { focus: 'adjacency' },
        nodeAlign: 'left',
        data: nodes,
        links: allLinks,
        label: { color: '#EDE8DC', fontSize: 9 },
        lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.2 },
      }],
    };
  }, [allData, year, mode]);

  return (
    <div className="chart-card">
      <ReactECharts option={withChartDefaults(option) as never} style={{ height, width: '100%' }} notMerge lazyUpdate />
    </div>
  );
}
