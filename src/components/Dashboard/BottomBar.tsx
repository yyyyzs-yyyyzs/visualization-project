import { useCallback, useRef } from 'react';
import type { MetricKey, ProvinceEconomy } from '../../types';
import { DataInsightPanel } from './BCharts';

interface BottomBarProps {
  allData: ProvinceEconomy[];
  selectedYear: number;
  selectedMetric: MetricKey;
  years: number[];
  isPlaying: boolean;
  isAutoPlaying: boolean;
  demoStep: number;
  demoTotal: number;
  onSelectYear: (year: number) => void;
  onTogglePlay: () => void;
}

export default function BottomBar({
  allData,
  selectedYear,
  selectedMetric,
  years,
  isPlaying,
  isAutoPlaying,
  demoStep,
  demoTotal,
  onSelectYear,
  onTogglePlay,
}: BottomBarProps) {
  const sliderRef = useRef<HTMLInputElement>(null);
  const minYear = years[0] || 2014;
  const maxYear = years[years.length - 1] || 2024;
  const range = Math.max(1, maxYear - minYear);

  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onSelectYear(Number.parseInt(event.target.value, 10));
  }, [onSelectYear]);

  return (
    <footer className="bottombar">
      <div className="insight-bar">
        {isAutoPlaying ? (
          <span className="insight-text">{selectedYear}年 · 演示步骤 {demoStep}/{demoTotal}</span>
        ) : (
          <DataInsightPanel allData={allData} selectedYear={selectedYear} selectedMetric={selectedMetric} />
        )}
      </div>
      <div className="timeline">
        <button className={`play-btn ${isPlaying ? 'playing' : ''}`} onClick={onTogglePlay} title={isPlaying ? '暂停' : '播放'}>
          {isPlaying ? 'Ⅱ' : '▶'}
        </button>
        <span className="year-label">{minYear}</span>
        <div className="slider-wrapper">
          <input
            ref={sliderRef}
            type="range"
            className="year-slider"
            min={minYear}
            max={maxYear}
            step={1}
            value={selectedYear}
            onChange={handleSliderChange}
          />
          <div className="slider-ticks">
            {years.map((year) => (
              <span
                key={year}
                className={`tick ${year === selectedYear ? 'active' : ''}`}
                style={{ left: `${((year - minYear) / range) * 100}%` }}
                onClick={() => onSelectYear(year)}
              />
            ))}
          </div>
        </div>
        <span className="year-label">{maxYear}</span>
        <span className="current-year">{selectedYear}</span>
      </div>
      {isAutoPlaying && (
        <div className="demo-progress-bar">
          <div className="demo-progress-fill" style={{ width: `${(demoStep / demoTotal) * 100}%` }} />
        </div>
      )}
    </footer>
  );
}
