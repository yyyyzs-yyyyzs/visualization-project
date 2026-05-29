export const MORANDI_PALETTE = [
  '#C4A88B', '#A3B0C4', '#B5C4B1', '#C4A4A4',
  '#D4CDA0', '#B8B0C4', '#C4BFB6', '#8E9CAF',
  '#A3B8A1', '#D4B5B5', '#D4B896', '#A8A090',
] as const;

export const MORANDI_TERRA = '#C4A88B';
export const MORANDI_BLUE = '#A3B0C4';
export const MORANDI_GREEN = '#B5C4B1';
export const MORANDI_ROSE = '#C4A4A4';
export const MORANDI_LAVENDER = '#B8B0C4';
export const MORANDI_GREIGE = '#D4CFC7';
export const MORANDI_GOLD = '#D4B896';
export const MORANDI_SILVER = '#B0BEC5';
export const MORANDI_HIGHLIGHT = '#D4CDA0';

// 莫兰迪色阶：低值→浅淡 | 高值→深浓，区分度明显
export const METRIC_COLOR_SCHEMES: Record<string, [string, string, string]> = {
  gdp:              ['#EDE5DB', '#C4A88B', '#8C6E5A'],  // 暖棕：浅米→莫兰迪棕→深咖
  gdpPerCapita:     ['#ECE4D8', '#C4A88B', '#8C6E5A'],  // 同上
  gdpGrowth:        ['#E4EBE3', '#9AB89A', '#5C7A5E'],  // 莫兰迪绿：浅绿→灰绿→深绿
  population:       ['#E5E5EC', '#8E9CAF', '#5C6D85'],  // 灰蓝：浅灰蓝→莫兰迪蓝→深蓝灰
  primaryIndustry:  ['#E8EDE4', '#A3B8A1', '#6B8A6E'],  // 植物绿：浅草→灰绿→暗绿
  secondaryIndustry:['#E7E5EC', '#9C94B2', '#6B6285'],  // 薰衣草紫：浅紫→莫兰迪紫→深紫
  tertiaryIndustry: ['#EDE5E8', '#C4A4A4', '#8C6E6E'],  // 灰玫瑰：浅粉→莫兰迪粉→深玫瑰
  retailSales:      ['#ECE6DA', '#C4A88B', '#946B52'],  // 陶土橙：浅米→莫兰迪橙→深陶土
  perCapitaIncome:  ['#ECE5D8', '#D4B896', '#A67C52'],  // 琥珀金：浅金→莫兰迪金→深琥珀
  urbanizationRate: ['#E5E7EC', '#8E9CAF', '#4B6078'],  // 石板蓝：浅灰→莫兰迪蓝→深石板
};

export const morandiChartTheme = {
  backgroundColor: 'transparent',
  color: MORANDI_PALETTE,
  textStyle: { color: '#B8B2A6', fontSize: 10 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(44,54,72,0.94)',
    borderColor: 'rgba(196,191,182,0.3)',
    textStyle: { color: '#EDE8DC', fontSize: 11 },
  },
  legend: { textStyle: { color: '#B8B2A6', fontSize: 10 } },
  grid: { top: 42, right: 18, bottom: 30, left: 52, containLabel: true },
};

export function withChartDefaults(option: Record<string, unknown>): Record<string, unknown> {
  return {
    ...morandiChartTheme,
    ...option,
    title: {
      left: 0,
      top: 0,
      textStyle: { color: '#EDE8DC', fontSize: 12, fontWeight: 600 },
      ...(option.title as object),
    },
    tooltip: {
      ...morandiChartTheme.tooltip,
      ...(option.tooltip as object),
    },
    legend: {
      top: 20,
      right: 0,
      ...morandiChartTheme.legend,
      ...(option.legend as object),
    },
    grid: {
      ...morandiChartTheme.grid,
      ...(option.grid as object),
    },
  };
}

export const axisStyle = {
  axisLine: { lineStyle: { color: 'rgba(196,191,182,0.25)' } },
  axisTick: { lineStyle: { color: 'rgba(196,191,182,0.18)' } },
  axisLabel: { color: '#B8B2A6', fontSize: 10 },
  splitLine: { lineStyle: { color: 'rgba(196,191,182,0.08)' } },
};
