/**
 * 墨卡托投影工具
 * 将 GeoJSON 经纬度坐标转换为平面坐标（Three.js 场景坐标）
 * 参数: center: [104.5, 37.5], scale: 55
 */

const CENTER_LNG = 104.5;
const CENTER_LAT = 37.5;
const SCALE = 55;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 将经纬度转为平面坐标
 */
export function project(lng: number, lat: number): [number, number] {
  const lambda = degToRad(lng - CENTER_LNG);
  const phi = degToRad(lat);
  const phi0 = degToRad(CENTER_LAT);

  const x = SCALE * Math.cos(phi0) * lambda;
  const y = SCALE * (phi - phi0);

  return [x, y];
}

/**
 * 将经纬度转为 3D 坐标（y=0 平面）
 */
export function projectTo3D(lng: number, lat: number, zOffset = 0): [number, number, number] {
  const [x, y] = project(lng, lat);
  // 地图 Shape 在 XY 平面（Z 为挤出高度），飞线端点对齐到地图表面
  return [x, y, zOffset];
}

/**
 * 计算两个经纬度点之间的距离（km，简化公式）
 */
export function haversineDistance(
  lng1: number, lat1: number,
  lng2: number, lat2: number
): number {
  const R = 6371;
  const dLat = degToRad(lat2 - lat1);
  const dLng = degToRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 线性插值色阶
 */
export function colorScale(
  value: number,
  min: number,
  max: number,
  stops: [string, string, string]
): string {
  if (isNaN(value) || max === min) return stops[0];
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

  // 三段色阶
  if (t < 0.5) {
    const u = t * 2;
    const c1 = hexToRgb(stops[0]);
    const c2 = hexToRgb(stops[1]);
    const r = Math.round(lerp(c1[0], c2[0], u));
    const g = Math.round(lerp(c1[1], c2[1], u));
    const b = Math.round(lerp(c1[2], c2[2], u));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } else {
    const u = (t - 0.5) * 2;
    const c2 = hexToRgb(stops[1]);
    const c3 = hexToRgb(stops[2]);
    const r = Math.round(lerp(c2[0], c3[0], u));
    const g = Math.round(lerp(c2[1], c3[1], u));
    const b = Math.round(lerp(c2[2], c3[2], u));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

/**
 * 提亮颜色（向暖色方向偏移）
 */
export function brightenColor(hex: string, amount = 0.2): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // 向 #D4CDA0（暖金色）方向混合
  const nr = Math.min(255, Math.round(r + (0xD4 - r) * amount));
  const ng = Math.min(255, Math.round(g + (0xCD - g) * amount));
  const nb = Math.min(255, Math.round(b + (0xA0 - b) * amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}
