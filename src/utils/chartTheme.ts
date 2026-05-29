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

export const METRIC_COLOR_SCHEMES: Record<string, [string, string, string]> = {
  gdp: ['#D4CFC7', '#B0BEC5', '#C4A88B'],
  gdpPerCapita: ['#D4CFC7', '#B0BEC5', '#C4A88B'],
  gdpGrowth: ['#C5D3C0', '#B0BEC5', '#D4B5B5'],
  population: ['#D4CFC7', '#B8B0C4', '#8E9CAF'],
  primaryIndustry: ['#D4CFC7', '#C4C0D4', '#A8A0B8'],
  secondaryIndustry: ['#D4CFC7', '#C4C0D4', '#A8A0B8'],
  tertiaryIndustry: ['#D4CFC7', '#C4C0D4', '#A8A0B8'],
  retailSales: ['#D4CFC7', '#B5C4B1', '#C4A88B'],
  perCapitaIncome: ['#D4CFC7', '#B0BEC5', '#D4B896'],
  urbanizationRate: ['#D4CFC7', '#B8B0C4', '#8E9CAF'],
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
