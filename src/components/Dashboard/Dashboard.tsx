import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TopBar from './TopBar';
import LeftPanel from './LeftPanel';
import CenterCanvas from './CenterCanvas';
import RightPanel from './RightPanel';
import BottomBar from './BottomBar';
import { MapLegend } from './BCharts';
import { useEconomicData } from '../../hooks/useEconomicData';
import { useAutoPlayDemo } from '../ThreeD/AutoPlayDemo';
import './Dashboard.css';
import { METRIC_OPTIONS } from '../../types';
import { METRIC_COLOR_SCHEMES } from '../../utils/chartTheme';
import type { FlowLine, MetricKey } from '../../types';

const REGION_FLOWS: Record<string, FlowLine[]> = {
  yangtze: [
    { from: [121.5, 31.2], to: [118.8, 32.1], value: 80, color: '#D4B896' },
    { from: [121.5, 31.2], to: [120.2, 30.3], value: 70, color: '#D4B896' },
    { from: [121.5, 31.2], to: [117.3, 31.9], value: 50, color: '#D4B896' },
    { from: [118.8, 32.1], to: [120.2, 30.3], value: 60, color: '#D4B896' },
    { from: [118.8, 32.1], to: [117.3, 31.9], value: 55, color: '#D4B896' },
  ],
  jjj: [
    { from: [116.4, 39.9], to: [117.2, 39.1], value: 60, color: '#A3B0C4' },
    { from: [116.4, 39.9], to: [114.5, 38.0], value: 70, color: '#A3B0C4' },
    { from: [117.2, 39.1], to: [114.5, 38.0], value: 50, color: '#A3B0C4' },
  ],
  chengyu: [{ from: [104.1, 30.7], to: [106.5, 29.5], value: 90, color: '#D4B5B5' }],
};

const DEMO_NATIONAL_FLOWS: FlowLine[] = [
  { from: [116.4, 39.9], to: [121.5, 31.2], value: 95, color: '#C4A88B' },
  { from: [121.5, 31.2], to: [113.3, 23.1], value: 90, color: '#A3B0C4' },
  { from: [116.4, 39.9], to: [113.3, 23.1], value: 85, color: '#B5C4B1' },
  { from: [121.5, 31.2], to: [118.8, 32.1], value: 75, color: '#D4B896' },
  { from: [113.3, 23.1], to: [120.2, 30.3], value: 70, color: '#C4A4A4' },
];

type PanelState = 'intro' | 'detail' | 'compare' | 'region' | 'advanced';

export default function Dashboard() {
  const { allData, years, provinces } = useEconomicData();
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('gdp');
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [compareProvinces, setCompareProvinces] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showFlows, setShowFlows] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>('intro');
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const playTimerRef = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (years.length && !years.includes(selectedYear)) setSelectedYear(years[years.length - 1]);
  }, [selectedYear, years]);

  const stats = useMemo(() => {
    const yearData = allData.filter((item) => item.year === selectedYear);
    const gdpSum = yearData.reduce((sum, item) => sum + item.gdp, 0);
    const popSum = yearData.reduce((sum, item) => sum + item.population, 0);
    const avgGrowth = yearData.reduce((sum, item) => sum + item.gdpGrowth, 0) / Math.max(yearData.length, 1);
    const gdpTop = [...yearData].sort((a, b) => b.gdp - a.gdp)[0];
    const pcTop = [...yearData].sort((a, b) => b.gdpPerCapita - a.gdpPerCapita)[0];
    return {
      gdpTotal: (gdpSum / 10000).toFixed(1),
      gdpTopProvince: gdpTop?.provinceName ?? '-',
      gdpPerCapitaTop: pcTop?.provinceName ?? '-',
      avgGrowth: avgGrowth.toFixed(1),
      totalPop: (popSum / 10000).toFixed(2),
    };
  }, [allData, selectedYear]);

  const metricRange = useMemo(() => {
    const values = allData.filter((item) => item.year === selectedYear).map((item) => item[selectedMetric]);
    return {
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 1,
      label: METRIC_OPTIONS.find((item) => item.key === selectedMetric)?.label ?? selectedMetric,
    };
  }, [allData, selectedMetric, selectedYear]);

  const flows = useMemo(() => {
    if (selectedRegion && REGION_FLOWS[selectedRegion]) return REGION_FLOWS[selectedRegion];
    if (isAutoPlaying) return DEMO_NATIONAL_FLOWS;
    return [];
  }, [isAutoPlaying, selectedRegion]);

  const handleSelectProvince = useCallback((name: string | null) => {
    if (!name) {
      setSelectedProvince(null);
      if (panelState === 'detail') setPanelState('intro');
      return;
    }
    if (panelState === 'compare') {
      setCompareProvinces((prev) => (prev.includes(name) || prev.length >= 4 ? prev : [...prev, name]));
      return;
    }
    setSelectedProvince(name);
    setSelectedRegion(null);
    setShowFlows(false);
    setPanelState('detail');
  }, [panelState]);

  const handleStartCompare = useCallback(() => {
    if (!selectedProvince) return;
    setCompareProvinces((prev) => {
      const next = prev.includes(selectedProvince) ? prev : [selectedProvince, ...prev].slice(0, 4);
      return next.length ? next : [selectedProvince];
    });
    setPanelState('compare');
  }, [selectedProvince]);

  const handleRemoveCompare = useCallback((name: string) => {
    setCompareProvinces((prev) => prev.filter((item) => item !== name));
  }, []);

  const handleSelectRegion = useCallback((region: string | null) => {
    setSelectedRegion(region);
    setSelectedProvince(null);
    setCompareProvinces([]);
    setShowFlows(Boolean(region));
    setPanelState(region ? 'region' : 'intro');
  }, []);

  const handleTogglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  useEffect(() => {
    if (isPlaying && years.length) {
      playTimerRef.current = window.setInterval(() => {
        setSelectedYear((year) => {
          const index = years.indexOf(year);
          return index < years.length - 1 ? years[index + 1] : years[0];
        });
      }, 1000);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, years]);

  const { demoStep, demoTotal, isDemoPlaying, startDemo, stopDemo } = useAutoPlayDemo({
    selectedYear,
    selectedMetric,
    selectedProvince,
    compareProvinces,
    selectedRegion,
    setSelectedYear,
    setSelectedMetric,
    setSelectedProvince,
    setCompareProvinces,
    setSelectedRegion,
    setShowFlows,
    setPanelState: (state: string) => setPanelState(state as PanelState),
    setIsAutoPlaying,
    years,
    provinces,
  });

  const handleClosePanel = useCallback(() => {
    setPanelState('intro');
    setSelectedProvince(null);
    setCompareProvinces([]);
    setSelectedRegion(null);
    setShowFlows(false);
  }, []);

  const handleOpenAdvanced = useCallback(() => {
    setPanelState('advanced');
    setSelectedProvince(null);
    setCompareProvinces([]);
    setSelectedRegion(null);
    setShowFlows(false);
  }, []);

  const handleToggleDemo = useCallback(() => {
    if (isDemoPlaying) stopDemo();
    else startDemo();
  }, [isDemoPlaying, startDemo, stopDemo]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const startX = e.clientX;
    const startWidth = rightPanelWidth;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      const newWidth = Math.min(620, Math.max(280, startWidth + delta));
      setRightPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [rightPanelWidth]);

  return (
    <div className="dashboard">
      <TopBar selectedYear={selectedYear} selectedMetric={selectedMetric} isDemoPlaying={isDemoPlaying} onToggleDemo={handleToggleDemo} {...stats} />
      <div className="dashboard-main" style={{ gridTemplateColumns: `240px 1fr ${rightPanelWidth}px` }}>
        <LeftPanel
          allData={allData}
          selectedYear={selectedYear}
          selectedMetric={selectedMetric}
          selectedRegion={selectedRegion}
          onSelectMetric={setSelectedMetric}
          onSelectRegion={handleSelectRegion}
          onSelectProvince={handleSelectProvince}
          onOpenAdvanced={handleOpenAdvanced}
        />
        <main className="dashboard-center">
          <CenterCanvas
            selectedYear={selectedYear}
            selectedMetric={selectedMetric}
            selectedProvince={selectedProvince}
            hoveredProvince={hoveredProvince}
            selectedRegion={selectedRegion}
            showFlows={showFlows}
            flows={flows}
            onSelectProvince={handleSelectProvince}
            onHoverProvince={setHoveredProvince}
          />
          <MapLegend min={metricRange.min} max={metricRange.max} label={metricRange.label} colors={METRIC_COLOR_SCHEMES[selectedMetric]} />
        </main>
        <div
          className="resize-handle"
          onMouseDown={handleResizeStart}
        />
        <RightPanel
          allData={allData}
          panelState={panelState}
          selectedProvince={selectedProvince}
          compareProvinces={compareProvinces}
          selectedRegion={selectedRegion}
          selectedYear={selectedYear}
          selectedMetric={selectedMetric}
          onClose={handleClosePanel}
          onStartCompare={handleStartCompare}
          onRemoveCompare={handleRemoveCompare}
        />
      </div>
      <BottomBar
        allData={allData}
        selectedYear={selectedYear}
        selectedMetric={selectedMetric}
        years={years}
        isPlaying={isPlaying}
        isAutoPlaying={isDemoPlaying}
        demoStep={demoStep}
        demoTotal={demoTotal}
        onSelectYear={setSelectedYear}
        onTogglePlay={handleTogglePlay}
      />
    </div>
  );
}
