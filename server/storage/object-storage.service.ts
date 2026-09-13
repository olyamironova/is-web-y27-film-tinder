import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';

@Injectable()
export class ObjectStorageService {
  private readonly client: S3Client | null;

  constructor(private readonly config: ConfigService) {
    const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY');
    const endpoint = config.get<string>('S3_ENDPOINT');
    this.client = accessKeyId && secretAccessKey && endpoint
      ? new S3Client({
          endpoint,
          region: config.get<string>('S3_REGION', 'ru-central1'),
          credentials: { accessKeyId, secretAccessKey },
        })
      : null;
  }

  async uploadAvatar(file: Express.Multer.File): Promise<string> {
    const extension = extname(file.originalname).toLowerCase() || '.jpg';
    const key = `avatars/${randomUUID()}${extension}`;
    const bucket = this.config.get<string>('S3_BUCKET');

    if (this.client && bucket) {
      await this.client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      const publicUrl = this.config.get<string>('S3_PUBLIC_URL');
      if (!publicUrl) throw new InternalServerErrorException('Для S3 необходимо задать S3_PUBLIC_URL');
      return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }

    const directory = join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(directory, { recursive: true });
    const filename = key.split('/').pop()!;
    await writeFile(join(directory, filename), file.buffer);
    return `/uploads/avatars/${filename}`;
  }
}
