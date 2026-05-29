export interface ProvinceEconomy {
  year: number;
  provinceCode: string;
  provinceName: string;
  provinceShort: string;
  region: string;
  gdp: number;
  gdpGrowth: number;
  gdpPerCapita: number;
  population: number;
  primaryIndustry: number;
  secondaryIndustry: number;
  tertiaryIndustry: number;
  fiscalRevenue: number;
  fiscalExpenditure: number;
  fixedInvestment: number;
  retailSales: number;
  tradeExport: number;
  tradeImport: number;
  urbanizationRate: number;
  perCapitaIncome: number;
  rndExpenditure: number;
}

export type MetricKey =
  | 'gdp'
  | 'gdpGrowth'
  | 'gdpPerCapita'
  | 'population'
  | 'primaryIndustry'
  | 'secondaryIndustry'
  | 'tertiaryIndustry'
  | 'fiscalRevenue'
  | 'fiscalExpenditure'
  | 'fixedInvestment'
  | 'retailSales'
  | 'tradeExport'
  | 'tradeImport'
  | 'urbanizationRate'
  | 'perCapitaIncome'
  | 'rndExpenditure';

export interface MetricOption {
  key: MetricKey;
  label: string;
  unit: string;
  colorScheme: 'gdp' | 'growth' | 'population' | 'industry' | 'income' | 'trade';
}

export const METRIC_OPTIONS: MetricOption[] = [
  { key: 'gdp', label: 'GDP总量', unit: '亿元', colorScheme: 'gdp' },
  { key: 'gdpPerCapita', label: '人均GDP', unit: '元/人', colorScheme: 'gdp' },
  { key: 'gdpGrowth', label: 'GDP增速', unit: '%', colorScheme: 'growth' },
  { key: 'population', label: '常住人口', unit: '万人', colorScheme: 'population' },
  { key: 'tertiaryIndustry', label: '第三产业', unit: '亿元', colorScheme: 'industry' },
  { key: 'retailSales', label: '社零总额', unit: '亿元', colorScheme: 'trade' },
  { key: 'perCapitaIncome', label: '人均收入', unit: '元', colorScheme: 'income' },
  { key: 'urbanizationRate', label: '城镇化率', unit: '%', colorScheme: 'population' },
];

export interface ProvinceGeoFeature {
  type: 'Feature';
  properties: {
    name: string;
    code: string;
    center: [number, number];
  };
  geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: number[][][][] | number[][][];
  };
}

export interface ChinaGeoJSON {
  type: 'FeatureCollection';
  features: ProvinceGeoFeature[];
}

export interface FlowLine {
  from: [number, number];
  to: [number, number];
  value: number;
  color?: string;
}

export interface Region {
  code: string;
  name: string;
  provinces: string[];
  color: string;
}

export const REGIONS: Region[] = [
  { code: 'east', name: '东部', provinces: ['北京', '天津', '河北', '上海', '江苏', '浙江', '福建', '山东', '广东', '海南'], color: '#C4A88B' },
  { code: 'central', name: '中部', provinces: ['山西', '安徽', '江西', '河南', '湖北', '湖南'], color: '#A3B0C4' },
  { code: 'west', name: '西部', provinces: ['内蒙古', '广西', '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆'], color: '#B5C4B1' },
  { code: 'northeast', name: '东北', provinces: ['辽宁', '吉林', '黑龙江'], color: '#C4A4A4' },
  { code: 'yangtze', name: '长三角', provinces: ['上海', '江苏', '浙江', '安徽'], color: '#D4B896' },
  { code: 'jjj', name: '京津冀', provinces: ['北京', '天津', '河北'], color: '#A3B0C4' },
  { code: 'chengyu', name: '成渝', provinces: ['四川', '重庆'], color: '#D4B5B5' },
];

export interface DemoStep {
  action: string;
  metric?: MetricKey;
  year?: number;
  province?: string;
  compareProvinces?: string[];
  region?: string;
  duration: number;
}
