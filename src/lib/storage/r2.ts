import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export interface R2Config {
  isConfigured: boolean;
  bucket: string;
  endpoint?: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;

export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "pdf"] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Reads Cloudflare R2 / S3 configuration strictly from server environment variables.
 * Compatible with both R2_* and S3_* naming conventions.
 */
export function getR2Config(): R2Config {
  const bucket = process.env.R2_BUCKET || process.env.S3_BUCKET || "awaz";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
  const region = process.env.R2_REGION || process.env.S3_REGION || "auto";

  const isConfigured = Boolean(
    endpoint &&
    accessKeyId &&
    secretAccessKey &&
    bucket
  );

  return {
    isConfigured,
    bucket,
    endpoint: endpoint || undefined,
    region,
    accessKeyId: accessKeyId || undefined,
    secretAccessKey: secretAccessKey || undefined,
  };
}

let cachedS3Client: S3Client | null = null;

/**
 * Resets cached S3 client instance (primarily for testing and environment reloads).
 */
export function resetR2ClientForTesting(): void {
  cachedS3Client = null;
}

/**
 * Returns a configured S3-compatible client targeting Cloudflare R2.
 */
export function getR2Client(): S3Client {
  const config = getR2Config();
  if (!config.isConfigured || !config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error("Cloudflare R2 private object storage is not configured.");
  }

  if (!cachedS3Client) {
    cachedS3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return cachedS3Client;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  cleanExt?: string;
}

/**
 * Validates file metadata before issuing presigned URLs or accepting uploads.
 */
export function validateEvidenceFile(
  fileName: string,
  fileType: string,
  fileSize: number
): ValidationResult {
  if (!fileName || typeof fileName !== "string") {
    return { valid: false, error: "File name is required." };
  }

  if (fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size must be greater than 0 and less than ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(fileType as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: "Invalid file format. Allowed formats: JPEG, PNG, WEBP, HEIC, and PDF.",
    };
  }

  // Extract and sanitize extension
  const cleanExt = fileName.trim().toLowerCase().split(".").pop();
  if (!cleanExt || !ALLOWED_EXTENSIONS.includes(cleanExt as typeof ALLOWED_EXTENSIONS[number])) {
    return {
      valid: false,
      error: `File extension '.${cleanExt}' is not permitted.`,
    };
  }

  return { valid: true, cleanExt };
}

/**
 * Generates a cryptographically unpredictable object key in the private bucket.
 * Prevents key collision, path traversal, and object enumeration.
 */
export function generateEvidenceStorageKey(reportId: string, cleanExt: string): string {
  // Pattern: evidence/<reportId>/<uuid>-<timestamp>.<ext>
  const uniqueId = randomUUID();
  const timestamp = Date.now();
  return `evidence/${reportId}/${uniqueId}-${timestamp}.${cleanExt}`;
}

/**
 * Creates a short-lived presigned PUT URL for secure, direct-to-R2 upload.
 * Defaults to 5 minutes (300 seconds) expiration.
 */
export async function createPresignedUploadUrl(
  storageKey: string,
  fileType: string,
  fileSize: number,
  expiresInSeconds = 300
): Promise<string> {
  const client = getR2Client();
  const config = getR2Config();

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Creates a short-lived presigned GET URL for authorized evidence download.
 * Defaults to 15 minutes (900 seconds) expiration.
 * Sets Content-Disposition header to force attachment download with sanitized filename.
 */
export async function createPresignedDownloadUrl(
  storageKey: string,
  fileName: string,
  expiresInSeconds = 900
): Promise<string> {
  const client = getR2Client();
  const config = getR2Config();

  const safeFileName = fileName.replace(/[^\w\s.-]/gi, "_");

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
    ResponseContentDisposition: `attachment; filename="${safeFileName}"`,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Uploads a raw buffer directly to Cloudflare R2.
 */
export async function uploadBufferToR2(
  storageKey: string,
  buffer: Buffer | Uint8Array,
  contentType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getR2Client();
    const config = getR2Config();

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
    });

    await client.send(command);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Safely deletes an evidence object from Cloudflare R2.
 */
export async function deleteObjectFromR2(
  storageKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getR2Client();
    const config = getR2Config();

    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: storageKey,
    });

    await client.send(command);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Checks if an object exists in Cloudflare R2 without downloading it.
 */
export async function checkObjectExistsInR2(storageKey: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const config = getR2Config();

    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: storageKey,
    });

    await client.send(command);
    return true;
  } catch {
    return false;
  }
}
