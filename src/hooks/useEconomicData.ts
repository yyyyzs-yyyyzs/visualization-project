import { useCallback, useMemo, useState } from 'react';
import type { MetricKey, ProvinceEconomy } from '../types';
import { REGIONS } from '../types';
import provinceEconomy from '../data/province_economy.json';

interface UseEconomicDataReturn {
  allData: ProvinceEconomy[];
  years: number[];
  provinces: string[];
  loading: boolean;
  error: string | null;
  getDataByYear: (year: number) => ProvinceEconomy[];
  getDataByProvince: (province: string) => ProvinceEconomy[];
  getMetricRange: (metric: MetricKey, year: number) => { min: number; max: number };
  getProvinceMetric: (province: string, metric: MetricKey, year: number) => number | null;
  getProvinceCenter: (province: string) => [number, number] | null;
  getRegionProvinces: (regionCode: string) => string[];
}

const CENTERS: Record<string, [number, number]> = {
  北京: [116.41, 39.9],
  天津: [117.2, 39.09],
  河北: [114.5, 38.05],
  山西: [112.56, 37.87],
  内蒙古: [111.67, 40.82],
  辽宁: [123.43, 41.8],
  吉林: [125.33, 43.9],
  黑龙江: [126.53, 45.8],
  上海: [121.47, 31.23],
  江苏: [118.79, 32.06],
  浙江: [120.15, 30.27],
  安徽: [117.27, 31.86],
  福建: [119.3, 26.08],
  江西: [115.89, 28.68],
  山东: [117.0, 36.65],
  河南: [113.62, 34.75],
  湖北: [114.3, 30.59],
  湖南: [112.98, 28.2],
  广东: [113.27, 23.13],
  广西: [108.32, 22.82],
  海南: [110.35, 20.02],
  重庆: [106.55, 29.56],
  四川: [104.06, 30.67],
  贵州: [106.71, 26.57],
  云南: [102.71, 25.04],
  西藏: [91.11, 29.65],
  陕西: [108.95, 34.27],
  甘肃: [103.82, 36.06],
  青海: [101.78, 36.62],
  宁夏: [106.27, 38.47],
  新疆: [87.62, 43.82],
};

export function useEconomicData(): UseEconomicDataReturn {
  const [allData] = useState<ProvinceEconomy[]>(provinceEconomy as ProvinceEconomy[]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const years = useMemo(() => [...new Set(allData.map((d) => d.year))].sort((a, b) => a - b), [allData]);
  const provinces = useMemo(() => [...new Set(allData.map((d) => d.provinceName))], [allData]);

  const getDataByYear = useCallback((year: number) => allData.filter((d) => d.year === year), [allData]);
  const getDataByProvince = useCallback(
    (province: string) => allData.filter((d) => d.provinceName === province).sort((a, b) => a.year - b.year),
    [allData],
  );

  const getMetricRange = useCallback(
    (metric: MetricKey, year: number) => {
      const values = allData
        .filter((d) => d.year === year)
        .map((d) => d[metric])
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
      return { min: values.length ? Math.min(...values) : 0, max: values.length ? Math.max(...values) : 1 };
    },
    [allData],
  );

  const getProvinceMetric = useCallback(
    (province: string, metric: MetricKey, year: number) => {
      const row = allData.find((d) => d.provinceName === province && d.year === year);
      const value = row?.[metric];
      return typeof value === 'number' ? value : null;
    },
    [allData],
  );

  const getProvinceCenter = useCallback((province: string) => CENTERS[province] ?? null, []);
  const getRegionProvinces = useCallback(
    (regionCode: string) => REGIONS.find((region) => region.code === regionCode)?.provinces ?? [],
    [],
  );

  return {
    allData,
    years,
    provinces,
    loading,
    error,
    getDataByYear,
    getDataByProvince,
    getMetricRange,
    getProvinceMetric,
    getProvinceCenter,
    getRegionProvinces,
  };
}
