/**
 * 统计学工具函数
 * 供人物 C 的高级可视化组件使用
 */

export interface PCAResult {
  components: number[][];  // 主成分向量 [nComponents][nFeatures]
  variances: number[];      // 各主成分方差
  projected: number[][];    // 投影数据 [nSamples][nComponents]
}

/**
 * Pearson 相关系数
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  const mx = mean(x);
  const my = mean(y);
  const sx = std(x, mx);
  const sy = std(y, my);
  if (sx === 0 || sy === 0) return 0;

  let cov = 0;
  for (let i = 0; i < n; i++) {
    cov += (x[i] - mx) * (y[i] - my);
  }
  return cov / (n - 1) / (sx * sy);
}

/**
 * 相关性矩阵
 */
export function correlationMatrix(data: number[][]): number[][] {
  const m = data.length;
  const result: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    result[i][i] = 1;
    for (let j = i + 1; j < m; j++) {
      const r = pearsonCorrelation(data[i], data[j]);
      result[i][j] = r;
      result[j][i] = r;
    }
  }
  return result;
}

/**
 * 均值
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * 标准差
 */
export function std(values: number[], meanVal?: number): number {
  if (values.length < 2) return 0;
  const m = meanVal ?? mean(values);
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * 标准化（Z-score）
 */
export function standardize(values: number[]): number[] {
  const m = mean(values);
  const s = std(values, m);
  if (s === 0) return values.map(() => 0);
  return values.map(v => (v - m) / s);
}

/**
 * 矩阵转置
 */
export function transpose(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const result: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j];
    }
  }
  return result;
}

/**
 * PCA 降维（简化实现）
 */
export function pca(data: number[][], nComponents = 2): PCAResult {
  // 标准化
  const standardized = transpose(transpose(data).map(col => standardize(col)));
  const nSamples = standardized.length;
  const nFeatures = standardized[0]?.length || 0;

  if (nSamples === 0 || nFeatures === 0) {
    return { components: [], variances: [], projected: [] };
  }

  // 协方差矩阵
  const covMat: number[][] = Array.from({ length: nFeatures }, () => Array(nFeatures).fill(0));
  for (let i = 0; i < nFeatures; i++) {
    for (let j = i; j < nFeatures; j++) {
      let cov = 0;
      for (let k = 0; k < nSamples; k++) {
        cov += standardized[k][i] * standardized[k][j];
      }
      cov /= nSamples - 1;
      covMat[i][j] = cov;
      covMat[j][i] = cov;
    }
  }

  // 幂迭代法求特征值和特征向量（简化）
  const { eigenvalues, eigenvectors } = powerIteration(covMat, nComponents);

  // 投影
  const projected: number[][] = [];
  for (let i = 0; i < nSamples; i++) {
    const proj: number[] = [];
    for (let c = 0; c < nComponents; c++) {
      let val = 0;
      for (let j = 0; j < nFeatures; j++) {
        val += standardized[i][j] * eigenvectors[c][j];
      }
      proj.push(val);
    }
    projected.push(proj);
  }

  return {
    components: eigenvectors,
    variances: eigenvalues,
    projected,
  };
}

function powerIteration(mat: number[][], k: number): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = mat.length;
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];

  for (let comp = 0; comp < Math.min(k, n); comp++) {
    // 初始化随机向量
    let vec = Array.from({ length: n }, () => Math.random());
    let norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    vec = vec.map(v => v / norm);

    // 幂迭代
    for (let iter = 0; iter < 50; iter++) {
      const newVec: number[] = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newVec[i] += mat[i][j] * vec[j];
        }
      }
      // 减掉已求出的主成分
      for (let prev = 0; prev < comp; prev++) {
        const ev = eigenvectors[prev];
        let dot = 0;
        for (let i = 0; i < n; i++) dot += newVec[i] * ev[i];
        for (let i = 0; i < n; i++) newVec[i] -= dot * ev[i];
      }
      norm = Math.sqrt(newVec.reduce((s, v) => s + v * v, 0));
      if (norm < 1e-10) break;
      vec = newVec.map(v => v / norm);
    }

    // 瑞利商求特征值
    let lambda = 0;
    const temp: number[] = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        temp[i] += mat[i][j] * vec[j];
      }
      lambda += vec[i] * temp[i];
    }

    eigenvalues.push(lambda);
    eigenvectors.push(vec);
  }

  return { eigenvalues, eigenvectors };
}

/**
 * K-means 聚类
 */
export function kmeans(
  data: number[][],
  k: number,
  maxIter = 100
): { clusters: number[]; centroids: number[][] } {
  const n = data.length;
  const dim = data[0]?.length || 0;
  if (n === 0 || dim === 0) return { clusters: [], centroids: [] };

  // 随机初始化聚类中心
  const centroids: number[][] = [];
  const indices = new Set<number>();
  while (indices.size < Math.min(k, n)) {
    indices.add(Math.floor(Math.random() * n));
  }
  for (const idx of indices) {
    centroids.push([...data[idx]]);
  }

  const clusters: number[] = Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // 分配
    let changed = false;
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        let dist = 0;
        for (let d = 0; d < dim; d++) {
          dist += (data[i][d] - centroids[c][d]) ** 2;
        }
        if (dist < minDist) {
          minDist = dist;
          bestCluster = c;
        }
      }
      if (clusters[i] !== bestCluster) {
        clusters[i] = bestCluster;
        changed = true;
      }
    }

    if (!changed) break;

    // 更新中心
    const counts: number[] = Array(k).fill(0);
    const sums: number[][] = Array.from({ length: k }, () => Array(dim).fill(0));
    for (let i = 0; i < n; i++) {
      const c = clusters[i];
      counts[c]++;
      for (let d = 0; d < dim; d++) {
        sums[c][d] += data[i][d];
      }
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let d = 0; d < dim; d++) {
          centroids[c][d] = sums[c][d] / counts[c];
        }
      }
    }
  }

  return { clusters, centroids };
}

/**
 * KDE 高斯核密度估计
 */
export function kde(
  data: number[],
  bandwidth?: number,
  nPoints = 100
): { x: number[]; y: number[] } {
  if (data.length === 0) return { x: [], y: [] };
  const h = bandwidth ?? silvermanBandwidth(data);
  const xmin = Math.min(...data) - 3 * h;
  const xmax = Math.max(...data) + 3 * h;
  const step = (xmax - xmin) / (nPoints - 1);

  const x: number[] = [];
  const y: number[] = [];
  const n = data.length;

  for (let i = 0; i < nPoints; i++) {
    const xi = xmin + i * step;
    let density = 0;
    for (let j = 0; j < n; j++) {
      const z = (xi - data[j]) / h;
      density += Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    }
    density /= n * h;
    x.push(xi);
    y.push(density);
  }

  return { x, y };
}

function silvermanBandwidth(data: number[]): number {
  const s = std(data);
  const n = data.length;
  return 1.06 * s * Math.pow(n, -0.2);
}

/**
 * 分位数
 */
export function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - pos) + sorted[hi] * (pos - lo);
}

/**
 * 归一化到 [0,1]
 */
export function normalize(values: number[]): number[] {
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  if (mx === mn) return values.map(() => 0.5);
  return values.map(v => (v - mn) / (mx - mn));
}
