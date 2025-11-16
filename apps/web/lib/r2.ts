// apps/web/lib/r2.ts
import { S3Client } from "@aws-sdk/client-s3";

export const R2_BUCKET_NAME = "solsins-media"; // hard-coded to avoid env typos
export const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL!;

// IMPORTANT: this must be the ACCOUNT endpoint, NOT the bucket/public endpoint
export const R2_ENDPOINT =
   "https://284ade9e8f38a2f3291f7e7ba8cc71dd.eu.r2.cloudflarestorage.com";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});
