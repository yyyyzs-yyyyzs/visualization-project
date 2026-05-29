import { useMemo, useEffect, useRef, useState } from 'react';
import type { ProvinceEconomy } from '../../types';

interface DataStoryProps {
  allData: ProvinceEconomy[];
}

interface StoryBlock {
  id: string;
  title: string;
  text: string;
  sparkData: number[];
  sparkYears: number[];
}

const fmt = (value: number, decimals = 0) =>
  value.toLocaleString('zh-CN', { maximumFractionDigits: decimals });

function storyGDPLeaders(data: ProvinceEconomy[]): StoryBlock {
  const latest = data.filter((d) => d.year === 2024).sort((a, b) => b.gdp - a.gdp);
  const top3 = latest.slice(0, 3);
  const gdp2014 = data.filter((d) => d.year === 2014).reduce((s, d) => s + d.gdp, 0);
  const gdp2024 = data.filter((d) => d.year === 2024).reduce((s, d) => s + d.gdp, 0);
  const growth = ((gdp2024 - gdp2014) / gdp2014 * 100).toFixed(1);

  const years = [...new Set(data.map((d) => d.year))].sort((a, b) => a - b);
  const sparkData = years.map((y) => data.filter((d) => d.year === y).reduce((s, d) => s + d.gdp, 0) / 10000);

  return {
    id: 'gdp-leaders',
    title: 'GDP总量格局',
    text: `2024年全国GDP总量达到${fmt(gdp2024)}亿元。${top3[0]?.provinceName}、${top3[1]?.provinceName}、${top3[2]?.provinceName}稳居前三，合计占比全国${(top3.reduce((s, d) => s + d.gdp, 0) / gdp2024 * 100).toFixed(1)}%。2014-2024十年间全国GDP增长约${growth}%，经济总量翻了一番以上。`,
    sparkData,
    sparkYears: years,
  };
}

function storyGrowthCatchup(data: ProvinceEconomy[]): StoryBlock {
  const years = [...new Set(data.map((d) => d.year))].sort((a, b) => a - b);
  // Find provinces with accelerating growth in recent years
  const provinces = [...new Set(data.map((d) => d.provinceName))];
  const growthRates = provinces.map((p) => {
    const d2020 = data.find((d) => d.provinceName === p && d.year === 2020);
    const d2024 = data.find((d) => d.provinceName === p && d.year === 2024);
    if (!d2020 || !d2024) return { p, growth: 0 };
    return { p, growth: d2024.gdpGrowth - d2020.gdpGrowth };
  });
  growthRates.sort((a, b) => b.growth - a.growth);
  const top = growthRates.slice(0, 3);

  const sparkData = years.map((y) => {
    const rows = data.filter((d) => d.year === y);
    return rows.reduce((s, d) => s + d.gdpGrowth, 0) / rows.length;
  });

  return {
    id: 'growth-catchup',
    title: '增速追赶效应',
    text: `近年来${top[0]?.p}、${top[1]?.p}、${top[2]?.p}等省份增速提升明显，表现出追赶态势。中西部省份增速整体高于东部成熟经济体，区域差距呈收窄趋势。全国平均增速在近年趋于平稳，由高速增长转向高质量发展阶段。`,
    sparkData,
    sparkYears: years,
  };
}

function storyStructureShift(data: ProvinceEconomy[]): StoryBlock {
  const years = [...new Set(data.map((d) => d.year))].sort((a, b) => a - b);
  const d2014 = data.find((d) => d.year === 2014 && d.provinceName === '北京');
  const d2024 = data.find((d) => d.year === 2024 && d.provinceName === '北京');
  const tertiary2024 = data.filter((d) => d.year === 2024).reduce((s, d) => s + d.tertiaryIndustry, 0);
  const total2024 = data.filter((d) => d.year === 2024).reduce((s, d) => s + d.gdp, 0);

  const sparkData = years.map((y) => {
    const rows = data.filter((d) => d.year === y);
    const t = rows.reduce((s, d) => s + d.tertiaryIndustry, 0);
    const g = rows.reduce((s, d) => s + d.gdp, 0);
    return g > 0 ? (t / g * 100) : 0;
  });

  return {
    id: 'structure-shift',
    title: '产业结构转型',
    text: `2024年全国第三产业占比达${(tertiary2024 / total2024 * 100).toFixed(1)}%，较2014年显著提升。以北京为例，三产占比从2014年的${d2014 ? (d2014.tertiaryIndustry / d2014.gdp * 100).toFixed(1) : '—'}%升至2024年的${d2024 ? (d2024.tertiaryIndustry / d2024.gdp * 100).toFixed(1) : '—'}%，服务业主导的经济结构持续深化。`,
    sparkData,
    sparkYears: years,
  };
}

function storyRegionalGap(data: ProvinceEconomy[]): StoryBlock {
  const years = [...new Set(data.map((d) => d.year))].sort((a, b) => a - b);
  const d2024 = data.filter((d) => d.year === 2024);

  const eastProvinces = ['北京', '天津', '河北', '上海', '江苏', '浙江', '福建', '山东', '广东', '海南'];
  const westProvinces = ['内蒙古', '广西', '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆'];

  const east = d2024.filter((d) => eastProvinces.includes(d.provinceName));
  const west = d2024.filter((d) => westProvinces.includes(d.provinceName));
  const eastPC = east.reduce((s, d) => s + d.gdpPerCapita * d.population, 0) / east.reduce((s, d) => s + d.population, 0);
  const westPC = west.reduce((s, d) => s + d.gdpPerCapita * d.population, 0) / west.reduce((s, d) => s + d.population, 0);

  const sparkData = years.map((y) => {
    const rows = data.filter((d) => d.year === y);
    const e = rows.filter((d) => eastProvinces.includes(d.provinceName));
    const w = rows.filter((d) => westProvinces.includes(d.provinceName));
    const ePC = e.reduce((s, d) => s + d.gdpPerCapita, 0) / e.length;
    const wPC = w.reduce((s, d) => s + d.gdpPerCapita, 0) / w.length;
    return ePC / Math.max(wPC, 1);
  });

  return {
    id: 'regional-gap',
    title: '区域差距观察',
    text: `2024年东部人均GDP约为西部的${(eastPC / Math.max(westPC, 1)).toFixed(1)}倍。尽管区域差距依然存在，但中西部近年增速领先，差距呈现缓慢收敛趋势。人均收入、城镇化率等民生指标的差距也在逐步缩小。`,
    sparkData,
    sparkYears: years,
  };
}

export default function DataStory({ allData }: DataStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stories = useMemo(() => {
    if (allData.length === 0) return [];
    return [
      storyGDPLeaders(allData),
      storyGrowthCatchup(allData),
      storyStructureShift(allData),
      storyRegionalGap(allData),
    ];
  }, [allData]);

  useEffect(() => {
    if (autoPlay && stories.length > 0) {
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % stories.length);
      }, 6000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, stories.length]);

  const current = stories[activeIndex];
  if (!current) return null;

  return (
    <div style={{
      border: '1px solid rgba(196,191,182,0.2)',
      borderRadius: 8,
      background: 'rgba(196,168,139,0.06)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ color: '#D4B896', fontSize: 13 }}>数据叙事 · {current.title}</strong>
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          style={{
            background: 'transparent',
            border: `1px solid ${autoPlay ? 'rgba(196,168,139,0.4)' : 'rgba(196,191,182,0.2)'}`,
            color: autoPlay ? '#C4A88B' : '#8E8B82',
            borderRadius: 4,
            padding: '3px 10px',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          {autoPlay ? '自动轮播中' : '点击切换'}
        </button>
      </div>

      {/* Sparkline */}
      <div style={{
        height: 50,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
        padding: '4px 0',
        borderBottom: '1px solid rgba(196,191,182,0.1)',
      }}>
        {current.sparkData.map((val, i) => {
          const max = Math.max(...current.sparkData);
          const min = Math.min(...current.sparkData);
          const h = max > min ? Math.max(8, ((val - min) / (max - min)) * 100) : 50;
          return (
            <div
              key={i}
              title={`${current.sparkYears[i]}: ${fmt(val, 1)}`}
              style={{
                flex: 1,
                height: `${h}%`,
                background: i === current.sparkData.length - 1 ? '#C4A88B' : '#A3B0C4',
                borderRadius: '2px 2px 0 0',
                opacity: 0.7,
                transition: 'height 0.3s',
                minHeight: 3,
              }}
            />
          );
        })}
      </div>

      {/* Text */}
      <p style={{ color: '#B8B2A6', fontSize: 12, lineHeight: 1.8 }}>{current.text}</p>

      {/* Navigation dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {stories.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setActiveIndex(i); setAutoPlay(false); }}
            style={{
              width: i === activeIndex ? 18 : 8,
              height: 8,
              borderRadius: 4,
              border: 'none',
              background: i === activeIndex ? '#C4A88B' : 'rgba(196,191,182,0.25)',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <button
          onClick={() => { setActiveIndex((prev) => (prev - 1 + stories.length) % stories.length); setAutoPlay(false); }}
          style={{
            background: 'transparent',
            border: '1px solid rgba(196,191,182,0.15)',
            color: '#B8B2A6',
            borderRadius: 4,
            padding: '3px 10px',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          ← 上一条
        </button>
        <span style={{ color: '#8E8B82', fontSize: 10 }}>{activeIndex + 1} / {stories.length}</span>
        <button
          onClick={() => { setActiveIndex((prev) => (prev + 1) % stories.length); setAutoPlay(false); }}
          style={{
            background: 'transparent',
            border: '1px solid rgba(196,191,182,0.15)',
            color: '#B8B2A6',
            borderRadius: 4,
            padding: '3px 10px',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          下一条 →
        </button>
      </div>
    </div>
  );
}
