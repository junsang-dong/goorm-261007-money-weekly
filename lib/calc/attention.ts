/** 일별 거래량 배열의 변동계수(CV). Phase 2 관심도 엔진에서 순위 계산에 쓴다. */
export function volumeCV(volumes: number[]): number {
  if (volumes.length === 0) return 0;
  const mean = volumes.reduce((sum, value) => sum + value, 0) / volumes.length;
  if (mean === 0) return 0;
  const variance =
    volumes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / volumes.length;
  return Math.sqrt(variance) / mean;
}
