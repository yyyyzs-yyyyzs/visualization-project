import { useState, useRef, useCallback, useEffect } from 'react';
import type { DemoStep, MetricKey } from '../../types';

interface AutoPlayDemoParams {
  selectedYear: number;
  selectedMetric: MetricKey;
  selectedProvince: string | null;
  compareProvinces: string[];
  selectedRegion: string | null;
  setSelectedYear: (y: number) => void;
  setSelectedMetric: (m: MetricKey) => void;
  setSelectedProvince: (p: string | null) => void;
  setCompareProvinces: (p: string[]) => void;
  setSelectedRegion: (r: string | null) => void;
  setShowFlows: (v: boolean) => void;
  setPanelState: (s: string) => void;
  setIsAutoPlaying: (v: boolean) => void;
  years: number[];
  provinces: string[];
}

interface AutoPlayDemoReturn {
  demoStep: number;
  demoTotal: number;
  isDemoPlaying: boolean;
  startDemo: () => void;
  stopDemo: () => void;
}

const DEMO_STEPS: DemoStep[] = [
  { action: '全国总览', metric: 'gdp', year: 2024, duration: 3 },
  { action: '切换指标', metric: 'gdpPerCapita', year: 2024, duration: 2 },
  { action: '时间演变', metric: 'gdpPerCapita', year: 2014, duration: 11 },
  { action: '切换指标', metric: 'gdpGrowth', year: 2024, duration: 2 },
  { action: '选中广东', metric: 'gdp', year: 2024, province: '广东', duration: 3 },
  { action: '选中江苏', metric: 'gdp', year: 2024, province: '江苏', duration: 3 },
  { action: '三省对比', metric: 'gdp', year: 2024, compareProvinces: ['广东', '江苏', '浙江'], duration: 4 },
  { action: '长三角', region: 'yangtze', duration: 4 },
  { action: '京津冀', region: 'jjj', duration: 3 },
  { action: '回到总览', duration: 2 },
];

export function useAutoPlayDemo(params: AutoPlayDemoParams): AutoPlayDemoReturn {
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const timerRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);
  const yearPlayRef = useRef<number | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (yearPlayRef.current) { clearInterval(yearPlayRef.current); yearPlayRef.current = null; }
  }, []);

  const stopDemo = useCallback(() => {
    clearAllTimers();
    setIsDemoPlaying(false);
    setDemoStep(0);
    stepIndexRef.current = 0;
    const p = paramsRef.current;
    p.setIsAutoPlaying(false);
    p.setSelectedYear(2024);
    p.setSelectedMetric('gdp');
    p.setSelectedProvince(null);
    p.setCompareProvinces([]);
    p.setSelectedRegion(null);
    p.setShowFlows(false);
    p.setPanelState('intro');
  }, [clearAllTimers]);

  const executeStep = useCallback((index: number) => {
    const p = paramsRef.current;
    if (index >= DEMO_STEPS.length) {
      stopDemo();
      return;
    }

    const step = DEMO_STEPS[index];
    setDemoStep(index + 1);
    stepIndexRef.current = index;

    // Apply step settings
    if (step.metric) p.setSelectedMetric(step.metric);
    if (step.year) p.setSelectedYear(step.year);
    if (step.region) {
      p.setSelectedRegion(step.region);
      p.setShowFlows(true);
      p.setSelectedProvince(null);
      p.setCompareProvinces([]);
      p.setPanelState('region');
    } else if (step.compareProvinces) {
      p.setSelectedRegion(null);
      p.setShowFlows(false);
      p.setSelectedProvince(null);
      p.setCompareProvinces(step.compareProvinces);
      p.setPanelState('compare');
    } else if (step.province) {
      p.setSelectedRegion(null);
      p.setShowFlows(false);
      p.setCompareProvinces([]);
      p.setSelectedProvince(step.province);
      p.setPanelState('detail');
    } else if (step.action === '全国总览' || step.action === '切换指标' || step.action === '回到总览') {
      p.setSelectedRegion(null);
      p.setShowFlows(false);
      p.setSelectedProvince(null);
      p.setCompareProvinces([]);
      p.setPanelState('intro');
    }

    // 特殊处理：时间演变
    if (step.action === '时间演变') {
      let yearIdx = p.years.indexOf(2014);
      p.setSelectedYear(2014);
      yearPlayRef.current = window.setInterval(() => {
        yearIdx++;
        if (yearIdx >= p.years.length) {
          if (yearPlayRef.current) { clearInterval(yearPlayRef.current); yearPlayRef.current = null; }
          // 下一步
          const nextIdx = stepIndexRef.current + 1;
          timerRef.current = window.setTimeout(() => executeStep(nextIdx), 200);
        } else {
          p.setSelectedYear(p.years[yearIdx]);
        }
      }, 1000);
    } else {
      // 普通步骤：等 duration 秒后进入下一步
      timerRef.current = window.setTimeout(() => {
        executeStep(index + 1);
      }, step.duration * 1000);
    }
  }, [stopDemo]);

  const startDemo = useCallback(() => {
    clearAllTimers();
    setIsDemoPlaying(true);
    stepIndexRef.current = 0;
    setDemoStep(0);
    paramsRef.current.setIsAutoPlaying(true);
    executeStep(0);
  }, [clearAllTimers, executeStep]);

  // Cleanup on unmount
  useEffect(() => {
    return clearAllTimers;
  }, [clearAllTimers]);

  return {
    demoStep,
    demoTotal: DEMO_STEPS.length,
    isDemoPlaying,
    startDemo,
    stopDemo,
  };
}
