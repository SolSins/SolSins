import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! }
});

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "CREATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { filename, contentType } = await req.json();
  const key = `media/${user.id}/${Date.now()}-${filename}`;
  const cmd = new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, ContentType: contentType, ACL: "public-read" });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 }); // 5 min
  return NextResponse.json({ uploadUrl: url, fileUrl: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}` });
}
