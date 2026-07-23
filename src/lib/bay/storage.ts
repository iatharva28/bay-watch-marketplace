/**
 * BAY Cloudflare R2 Storage Helper
 *
 * R2 is S3-compatible, so we use the AWS SDK with R2 endpoints.
 * Used for product images, seller logos, and user avatars.
 *
 * Setup:
 *   1. Create an R2 bucket at https://dash.cloudflare.com → R2
 *   2. Generate API tokens (R2 → Manage API Tokens)
 *   3. Set the env vars in .env.local
 *
 * Public access: enable the R2 public URL on the bucket, or use
 * signed URLs for private access (Phase 2).
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.local"
    );
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

/**
 * Upload a file to R2.
 *
 * @param key - The storage path (e.g. "products/abc-123/image.webp")
 * @param body - The file content (Buffer or stream)
 * @param contentType - MIME type (e.g. "image/webp")
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME!;
  const publicUrl = process.env.R2_PUBLIC_URL!;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${publicUrl}/${key}`;
}

/**
 * Delete a file from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME!;

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

/**
 * Generate a unique storage key for a product image.
 * Format: products/{productId}/{uuid}.{ext}
 */
export function generateImageKey(
  productId: string,
  filename: string
): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "webp";
  const uuid = crypto.randomUUID();
  return `products/${productId}/${uuid}.${ext}`;
}

/**
 * Validate an uploaded file.
 * Returns an error message if invalid, null if valid.
 */
export function validateImageFile(file: File): string | null {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`;
  }

  if (file.size > MAX_SIZE) {
    return `File too large. Maximum size: 5MB`;
  }

  return null;
}
