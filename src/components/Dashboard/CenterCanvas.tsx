import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ChinaMap3D from '../ThreeD/ChinaMap3D';
import FlowLines from '../ThreeD/FlowLines';
import { SceneLights, GroundGlow } from '../ThreeD/SceneSetup';
import { projectTo3D } from '../../utils/projection';
import { useEconomicData } from '../../hooks/useEconomicData';
import type { MetricKey, FlowLine } from '../../types';

interface CenterCanvasProps {
  selectedYear: number;
  selectedMetric: MetricKey;
  selectedProvince: string | null;
  hoveredProvince: string | null;
  selectedRegion: string | null;
  showFlows: boolean;
  flows: FlowLine[];
  onSelectProvince: (name: string | null) => void;
  onHoverProvince: (name: string | null) => void;
}

function CameraController({ selectedProvince }: { selectedProvince: string | null }) {
  const controlsRef = useRef<any>(null);
  const { getProvinceCenter } = useEconomicData();
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const isAnimating = useRef(false);

  // 选中省份时动画移动到该省份中心；取消选中时归位
  useEffect(() => {
    if (selectedProvince) {
      const center = getProvinceCenter(selectedProvince);
      if (center) {
        const [x, y, z] = projectTo3D(center[0], center[1], 0);
        targetPos.current.set(x, y, z);
        isAnimating.current = true;
      }
    } else {
      // 取消选中时不强制归位，保留用户自由浏览位置
    }
  }, [selectedProvince, getProvinceCenter]);

  useFrame((_, delta) => {
    if (!isAnimating.current || !controlsRef.current) return;
    const dist = controlsRef.current.target.distanceTo(targetPos.current);
    if (dist < 0.1) {
      controlsRef.current.target.copy(targetPos.current);
      isAnimating.current = false;
    } else {
      controlsRef.current.target.lerp(targetPos.current, Math.min(delta * 5, 0.15));
    }
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={28}
      maxDistance={110}
      maxPolarAngle={Math.PI / 2.2}
      target={[0, 0, 0]}
    />
  );
}

export default function CenterCanvas({
  selectedYear, selectedMetric, selectedProvince, hoveredProvince,
  selectedRegion, showFlows, flows, onSelectProvince, onHoverProvince,
}: CenterCanvasProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, -42, 68], fov: 36, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <SceneLights />
        <GroundGlow />
        <ChinaMap3D
          selectedYear={selectedYear}
          selectedMetric={selectedMetric}
          selectedProvince={selectedProvince}
          hoveredProvince={hoveredProvince}
          selectedRegion={selectedRegion}
          onSelectProvince={onSelectProvince}
          onHoverProvince={onHoverProvince}
        />
        <FlowLines flows={flows} visible={showFlows} />
        <CameraController selectedProvince={selectedProvince} />
      </Canvas>
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        color: '#9C9A94', fontSize: 10, opacity: 0.7,
        pointerEvents: 'none',
      }}>
        左键旋转 · 滚轮缩放 · 右键平移 · 点击省份查看详情
      </div>
    </div>
  );
}
