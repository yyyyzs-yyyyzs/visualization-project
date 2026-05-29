import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEconomicData } from '../../hooks/useEconomicData';
import { project, colorScale } from '../../utils/projection';
import { METRIC_COLOR_SCHEMES, MORANDI_GREIGE, MORANDI_TERRA, MORANDI_BLUE } from '../../utils/chartTheme';
import { loadChinaGeoJSON, normalizeProvinceName, getMainPolygon, polygonToShape } from '../../utils/geoLoader';
import type { MetricKey } from '../../types';

interface ChinaMap3DProps {
  selectedYear: number;
  selectedMetric: MetricKey;
  selectedProvince: string | null;
  hoveredProvince: string | null;
  selectedRegion: string | null;
  onSelectProvince: (name: string | null) => void;
  onHoverProvince: (name: string | null) => void;
}

interface ProvinceData {
  name: string;
  code: string;
  geometry: THREE.ExtrudeGeometry;
  edgeGeometry: THREE.EdgesGeometry;
}

interface ProvinceState {
  targetY: number;
  currentY: number;
  emissiveIntensity: number;
  opacity: number;
  borderOpacity: number;
}

const EXTRUDE_SETTINGS = {
  depth: 0.5,
  bevelThickness: 0.06,
  bevelSize: 0.03,
  bevelSegments: 2,
};

export default function ChinaMap3D({
  selectedYear,
  selectedMetric,
  selectedProvince,
  hoveredProvince,
  selectedRegion,
  onSelectProvince,
  onHoverProvince,
}: ChinaMap3DProps) {
  const { getProvinceMetric, getMetricRange, getRegionProvinces } = useEconomicData();
  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [loading, setLoading] = useState(true);
  const stateMapRef = useRef<Map<string, ProvinceState>>(new Map());
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const edgeRefs = useRef<Map<string, THREE.LineSegments>>(new Map());
  const regionProvincesRef = useRef<string[]>([]);

  // 颜色存储 — 渲染时写入，useFrame 读取
  const colorStoreRef = useRef<Map<string, string>>(new Map());

  // 加载 GeoJSON
  useEffect(() => {
    let cancelled = false;
    loadChinaGeoJSON().then(geoJSON => {
      if (cancelled) return;
      const built: ProvinceData[] = [];
      for (const feature of (geoJSON.features || [])) {
        const rawName = feature.properties?.name || '';
        const name = normalizeProvinceName(rawName);
        if (!name || name === rawName) continue;
        const coords = feature.geometry?.coordinates;
        if (!coords) continue;
        try {
          const mainRing = getMainPolygon(coords);
          if (!mainRing || mainRing.length < 3) continue;
          const shape = polygonToShape(mainRing, project);
          const geom = new THREE.ExtrudeGeometry(shape, EXTRUDE_SETTINGS);
          built.push({
            name,
            code: feature.properties?.code || '',
            geometry: geom,
            edgeGeometry: new THREE.EdgesGeometry(geom, 15),
          });
        } catch { /* skip */ }
      }
      setProvinces(built);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // 初始化状态
  useEffect(() => {
    const map = stateMapRef.current;
    provinces.forEach(p => {
      if (!map.has(p.name)) {
        map.set(p.name, { targetY: 0, currentY: 0, emissiveIntensity: 0, opacity: 1, borderOpacity: 0.35 });
      }
    });
  }, [provinces]);

  // 更新区域省份列表
  useEffect(() => {
    regionProvincesRef.current = selectedRegion ? getRegionProvinces(selectedRegion) : [];
  }, [selectedRegion, getRegionProvinces]);

  // 根据交互状态更新目标值
  useEffect(() => {
    const map = stateMapRef.current;
    const regionList = regionProvincesRef.current;
    const regionActive = !!selectedRegion;

    map.forEach((state, name) => {
      const isSelected = selectedProvince === name;
      const isHovered = hoveredProvince === name;
      const inRegion = regionList.includes(name);
      const dimmed = regionActive && !inRegion;

      if (isSelected) {
        state.targetY = 0.3; state.emissiveIntensity = 0.35; state.opacity = 1; state.borderOpacity = 0.9;
      } else if (isHovered) {
        state.targetY = 0.3; state.emissiveIntensity = 0.2; state.opacity = 1; state.borderOpacity = 0.85;
      } else if (dimmed) {
        state.targetY = 0; state.emissiveIntensity = 0; state.opacity = 0.25; state.borderOpacity = 0.08;
      } else {
        state.targetY = 0; state.emissiveIntensity = 0; state.opacity = 1; state.borderOpacity = 0.35;
      }
    });
  }, [selectedProvince, hoveredProvince, selectedRegion]);

  // 计算当年/当前指标的全国范围 + 色阶
  const { min: metricMin, max: metricMax } = useMemo(
    () => getMetricRange(selectedMetric, selectedYear),
    [getMetricRange, selectedMetric, selectedYear]
  );
  const colorScheme = METRIC_COLOR_SCHEMES[selectedMetric] || METRIC_COLOR_SCHEMES.gdp;

  // 核心：当年份/指标变化时，直接用 Three.js API 更新所有材质颜色
  // R3F 的声明式 prop 在此场景下不会触发子组件重渲染，故改为命令式更新
  useEffect(() => {
    const mMap = meshRefs.current;
    if (mMap.size === 0) return;
    mMap.forEach((mesh, name) => {
      const value = getProvinceMetric(name, selectedMetric, selectedYear);
      const dataColor = (value != null)
        ? colorScale(value, metricMin, metricMax, colorScheme)
        : MORANDI_GREIGE;
      const material = mesh.material as THREE.MeshPhongMaterial;
      material.color.set(dataColor);
      colorStoreRef.current.set(name, dataColor);
    });
  }, [selectedYear, selectedMetric, metricMin, metricMax, colorScheme, getProvinceMetric]);

  // useFrame：Y轴动画 + 交互状态（hover/选中时的 emissive + 颜色提亮）
  useFrame((_, delta) => {
    const dt = Math.min(delta * 8, 1);
    const sMap = stateMapRef.current;
    const mMap = meshRefs.current;
    const eMap = edgeRefs.current;

    mMap.forEach((mesh, name) => {
      const state = sMap.get(name);
      if (!state) return;

      state.currentY += (state.targetY - state.currentY) * dt;
      mesh.position.y = state.currentY;
      mesh.visible = state.opacity > 0.01;

      const material = mesh.material as THREE.MeshPhongMaterial;
      material.opacity = state.opacity;
      material.transparent = true;
      material.depthWrite = state.opacity > 0.9;
      material.emissiveIntensity = state.emissiveIntensity;

      if (state.emissiveIntensity > 0.05) {
        material.emissive = new THREE.Color(MORANDI_TERRA);
      } else {
        material.emissive = new THREE.Color(0x000000);
      }

      const edgeLine = eMap.get(name);
      if (edgeLine) {
        const edgeMat = edgeLine.material as THREE.LineBasicMaterial;
        edgeMat.opacity = state.borderOpacity;
        edgeMat.transparent = true;
        edgeMat.color = new THREE.Color(state.borderOpacity > 0.5 ? '#C4A4A4' : MORANDI_BLUE);
      }
    });
  });

  if (loading) return null;

  return (
    <group position={[0, 0, 0]}>
      {provinces.map(p => {
        const value = getProvinceMetric(p.name, selectedMetric, selectedYear);
        const dataColor = (value != null)
          ? colorScale(value, metricMin, metricMax, colorScheme)
          : MORANDI_GREIGE;

        // 同步颜色到 ref，供 useFrame 和 useEffect 读取
        colorStoreRef.current.set(p.name, dataColor);

        return (
          <group key={p.name}>
            <mesh
              geometry={p.geometry}
              ref={(m: THREE.Mesh | null) => {
                if (m) meshRefs.current.set(p.name, m);
                else meshRefs.current.delete(p.name);
              }}
              onClick={(e) => { e.stopPropagation(); onSelectProvince(p.name); }}
              onPointerOver={(e) => { e.stopPropagation(); onHoverProvince(p.name); }}
              onPointerOut={() => onHoverProvince(null)}
            >
              <meshPhongMaterial
                color={dataColor}
                shininess={20}
                specular={new THREE.Color(MORANDI_GREIGE)}
                transparent
              />
            </mesh>
            <lineSegments
              geometry={p.edgeGeometry}
              ref={(e: THREE.LineSegments | null) => {
                if (e) edgeRefs.current.set(p.name, e);
                else edgeRefs.current.delete(p.name);
              }}
            >
              <lineBasicMaterial color={MORANDI_BLUE} transparent opacity={0.35} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}
