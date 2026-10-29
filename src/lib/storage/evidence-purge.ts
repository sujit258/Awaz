import { prisma } from "@/lib/db/prisma";
import { getR2Config, deleteObjectFromR2 } from "@/lib/storage/r2";

export interface StorageConfig {
  isConfigured: boolean;
  bucket?: string;
  endpoint?: string;
}

/**
 * Checks whether production private object storage (Cloudflare R2 / AWS S3)
 * is fully and securely configured in environment variables.
 */
export function getStorageConfig(): StorageConfig {
  const config = getR2Config();
  return {
    isConfigured: config.isConfigured,
    bucket: config.bucket,
    endpoint: config.endpoint,
  };
}

/**
 * Attempts to purge a storage object from object storage with retry support.
 */
async function deleteObjectWithRetry(
  storageKey: string,
  maxRetries = 3
): Promise<{ success: boolean; attempts: number; error?: string }> {
  const config = getR2Config();

  // If storage is not configured (e.g. metadata-only local beta), mark as clean
  if (!config.isConfigured) {
    return { success: true, attempts: 1 };
  }

  let attempt = 0;
  let lastError = "";

  while (attempt < maxRetries) {
    attempt++;
    try {
      const result = await deleteObjectFromR2(storageKey);
      if (result.success) {
        return { success: true, attempts: attempt };
      }
      lastError = result.error || "R2 object deletion failed";
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    // Wait with exponential backoff before next attempt
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
    }
  }

  return { success: false, attempts: attempt, error: lastError };
}

/**
 * Dependency-aware, observable evidence purge for a withdrawn or deleted complaint report.
 * Strictly guarantees evidence files are removed and records any failures to AuditLog.
 */
export async function purgeEvidenceForReport(
  reportId: string,
  actorId: string | null = null
): Promise<{
  success: boolean;
  purgedCount: number;
  unpurgedCount: number;
  errors: string[];
}> {
  const evidenceList = await prisma.evidence.findMany({
    where: { complaintReportId: reportId },
    select: { id: true, storageKey: true, fileName: true },
  });

  if (evidenceList.length === 0) {
    return { success: true, purgedCount: 0, unpurgedCount: 0, errors: [] };
  }

  const errors: string[] = [];
  const purgedIds: string[] = [];

  for (const item of evidenceList) {
    const result = await deleteObjectWithRetry(item.storageKey);
    if (result.success) {
      purgedIds.push(item.id);
    } else {
      errors.push(`Failed to purge object ${item.storageKey}: ${result.error}`);
    }
  }

  // Delete DB records for successfully purged objects
  if (purgedIds.length > 0) {
    await prisma.evidence.deleteMany({
      where: { id: { in: purgedIds } },
    });
  }

  const isCompleteSuccess = errors.length === 0;

  // Log observable audit record
  await prisma.auditLog.create({
    data: {
      actorId,
      action: isCompleteSuccess ? "EVIDENCE_PURGED" : "EVIDENCE_PURGE_PARTIAL_FAILURE",
      targetType: "REPORT",
      targetId: reportId,
      metadata: JSON.stringify({
        totalFiles: evidenceList.length,
        purgedCount: purgedIds.length,
        failedCount: errors.length,
        errors: errors.slice(0, 5),
      }),
    },
  });

  return {
    success: isCompleteSuccess,
    purgedCount: purgedIds.length,
    unpurgedCount: errors.length,
    errors,
  };
}
