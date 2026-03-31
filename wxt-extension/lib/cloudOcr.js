export const CLOUD_OCR_FREE_LIMIT = 50;

export function normalizeCloudOcrUseCount(count) {
  const normalizedCount = Number(count);

  if (!Number.isFinite(normalizedCount) || normalizedCount < 0) {
    return 0;
  }

  return Math.floor(normalizedCount);
}

export function getRemainingCloudOcrUses(
  count,
  limit = CLOUD_OCR_FREE_LIMIT,
) {
  return Math.max(limit - normalizeCloudOcrUseCount(count), 0);
}

export function getCloudOcrUsagePercent(
  count,
  limit = CLOUD_OCR_FREE_LIMIT,
) {
  if (!limit) return 0;

  return Math.min((normalizeCloudOcrUseCount(count) / limit) * 100, 100);
}
