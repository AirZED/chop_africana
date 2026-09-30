import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

declare global {
  var __r2Client: S3Client | undefined;
}

function getClient(): S3Client {
  if (!global.__r2Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("R2 environment variables are not set");
    }
    global.__r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return global.__r2Client;
}

function publicUrlFor(key: string): string {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) throw new Error("R2_PUBLIC_URL environment variable is not set");
  return `${base.replace(/\/$/, "")}/${key}`;
}

/** Uploads a file to the R2 bucket under `folder/` and returns its public URL. */
export async function uploadImageToR2(
  file: Buffer,
  contentType: string,
  folder: "menu" | "shop"
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME environment variable is not set");

  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const key = `${folder}/${randomUUID()}.${ext}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  return publicUrlFor(key);
}

/** Best-effort delete of a previously-uploaded R2 image, given its public URL. No-op for non-R2 URLs. */
export async function deleteImageFromR2(url: string | undefined | null): Promise<void> {
  const base = process.env.R2_PUBLIC_URL;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!url || !base || !bucket || !url.startsWith(base)) return;

  const key = url.slice(base.replace(/\/$/, "").length + 1);
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    // Non-fatal — an orphaned object in the bucket isn't worth failing the request over.
  }
}
