import * as THREE from 'three';

/**
 * 加载中国内地省份 GeoJSON（优先本地加载，fallback 到 CDN）
 */
const GEOJSON_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';

let cachedGeoJSON: any = null;
let loadingPromise: Promise<any> | null = null;

export async function loadChinaGeoJSON(): Promise<any> {
  if (cachedGeoJSON) return cachedGeoJSON;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // 先尝试本地文件
    try {
      const resp = await fetch(import.meta.env.BASE_URL + 'data/china_geo.json');
      if (resp.ok) {
        cachedGeoJSON = await resp.json();
        return cachedGeoJSON;
      }
    } catch { /* fallback */ }

    // Fallback 到 CDN
    const resp = await fetch(GEOJSON_URL);
    if (!resp.ok) throw new Error(`GeoJSON 加载失败: ${resp.status}`);
    cachedGeoJSON = await resp.json();
    return cachedGeoJSON;
  })();

  return loadingPromise;
}

// 省份名称映射（GeoJSON 属性中的名称 → 标准名称）
const NAME_MAP: Record<string, string> = {
  '北京市': '北京', '天津市': '天津', '河北省': '河北', '山西省': '山西',
  '内蒙古自治区': '内蒙古', '辽宁省': '辽宁', '吉林省': '吉林', '黑龙江省': '黑龙江',
  '上海市': '上海', '江苏省': '江苏', '浙江省': '浙江', '安徽省': '安徽',
  '福建省': '福建', '江西省': '江西', '山东省': '山东', '河南省': '河南',
  '湖北省': '湖北', '湖南省': '湖南', '广东省': '广东', '广西壮族自治区': '广西',
  '海南省': '海南', '重庆市': '重庆', '四川省': '四川', '贵州省': '贵州',
  '云南省': '云南', '西藏自治区': '西藏', '陕西省': '陕西', '甘肃省': '甘肃',
  '青海省': '青海', '宁夏回族自治区': '宁夏', '新疆维吾尔自治区': '新疆',
};

export function normalizeProvinceName(name: string): string {
  return NAME_MAP[name] || name;
}

/**
 * 提取多边形面积最大的外环（排除岛屿碎片）
 * GeoJSON 坐标结构：
 *   Polygon:      number[][][]  = [ring, ring, ...]   ring = [[lng,lat], ...]
 *   MultiPolygon: number[][][][] = [polygon, polygon, ...]  polygon = [ring, ring, ...]
 */
export function getMainPolygon(coordinates: any): number[][] {
  // 判断：coordinates[0][0][0] 如果是数字 → Polygon，如果是数组 → MultiPolygon
  const isMultiPolygon = Array.isArray(coordinates[0][0][0]);

  if (isMultiPolygon) {
    // MultiPolygon: 遍历所有 polygon，取每个的第一个环（外环），选面积最大的
    const multi = coordinates as number[][][][];
    let best: number[][] = multi[0][0];
    let bestArea = computePolygonArea(multi[0][0]);
    for (let i = 1; i < multi.length; i++) {
      const outerRing = multi[i][0];
      if (!outerRing) continue;
      const area = computePolygonArea(outerRing);
      if (area > bestArea) { best = outerRing; bestArea = area; }
    }
    return best;
  } else {
    // Polygon: 遍历所有环，选面积最大的（排除洞/飞地）
    const rings = coordinates as number[][][];
    let best: number[][] = rings[0];
    let bestArea = computePolygonArea(rings[0]);
    for (let i = 1; i < rings.length; i++) {
      const area = computePolygonArea(rings[i]);
      if (area > bestArea) { best = rings[i]; bestArea = area; }
    }
    return best;
  }
}

function computePolygonArea(ring: number[][]): number {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

/**
 * 将多边形环转换为 THREE.Shape
 */
export function polygonToShape(ring: number[][], projectFn: (lng: number, lat: number) => [number, number]): THREE.Shape {
  const shape = new THREE.Shape();
  const [sx, sy] = projectFn(ring[0][0], ring[0][1]);
  shape.moveTo(sx, sy);
  for (let i = 1; i < ring.length; i++) {
    const [px, py] = projectFn(ring[i][0], ring[i][1]);
    shape.lineTo(px, py);
  }
  return shape;
}
