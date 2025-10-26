// lib/s3-upload.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 1. I-configure ang S3 Client gamit ang Railway variables
const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Importante para sa S3-compatible services
});

const BUCKET_NAME = process.env.S3_BUCKET!;

/**
 * Uploads a file to the S3 bucket.
 * @param file - The File object from FormData.
 * @param folder - The folder name in the bucket (e.g., 'profile_pictures' or 'chat_files').
 * @returns The public URL of the uploaded file.
 */
export async function uploadFileToS3(file: File, folder: string): Promise<string> {
  try {
    // 2. Gawing buffer ang file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 3. Gumawa ng unique na file name
    const fileName = `${folder}/${Date.now()}-${file.name}`;

    // 4. I-upload sa S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ACL: 'public-read', // Para ma-view ng lahat
        ContentType: file.type || undefined,
      })
    );

    // 5. I-construct at ibalik ang public URL
    // TANDAAN: Ang format ng URL ay depende sa S3 provider.
    // Para sa Railway (at DigitalOcean): https://[bucket].[region].[endpoint-host]/[fileName]
    const endpointHost = new URL(process.env.S3_ENDPOINT!).host;
    const publicUrl = `https://${BUCKET_NAME}.${process.env.S3_REGION}.${endpointHost}/${fileName}`;
    
    return publicUrl;

  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error('Failed to upload file to S3');
  }
}