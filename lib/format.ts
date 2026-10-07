export function formatVolume(volume: number): string {
  const man = volume / 10_000;
  return `${man.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}만 주`;
}

export function formatVolumeFull(volume: number): string {
  return `${volume.toLocaleString("ko-KR")}주`;
}

export function formatPct(value: number): string {
  const abs = Math.abs(value).toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
  if (value > 0) return `+${abs}%`;
  if (value < 0) return `-${abs}%`;
  return "0.0%";
}

export const SPIKE_THRESHOLD = 100;

export function isVolumeSpike(volumeChangePct: number): boolean {
  return volumeChangePct >= SPIKE_THRESHOLD;
}
