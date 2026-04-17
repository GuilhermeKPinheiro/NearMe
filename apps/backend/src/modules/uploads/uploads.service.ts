import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadsService {
  private readonly bucketName = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'nearme-media';
  private client: SupabaseClient | null = null;

  private getClient() {
    if (this.client) {
      return this.client;
    }

    const url = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !serviceRoleKey) {
      throw new InternalServerErrorException('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para habilitar uploads.');
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    return this.client;
  }

  private extensionFor(file: Express.Multer.File) {
    const byMimeType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };

    const mimeExtension = byMimeType[file.mimetype];

    if (mimeExtension) {
      return mimeExtension;
    }

    const fromName = file.originalname.split('.').pop()?.trim().toLowerCase();
    return fromName || 'jpg';
  }

  async uploadImage(userId: string, file: Express.Multer.File) {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Apenas imagens sao permitidas.');
    }

    const extension = this.extensionFor(file);
    const path = `${userId}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
    const client = this.getClient();

    const { error } = await client.storage.from(this.bucketName).upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

    if (error) {
      throw new InternalServerErrorException(`Falha ao enviar imagem para o storage: ${error.message}`);
    }

    const { data } = client.storage.from(this.bucketName).getPublicUrl(path);

    return {
      url: data.publicUrl,
      path,
      bucket: this.bucketName,
    };
  }
}
