import { LocaleCode } from '@/locales/locales';

export enum MimeType {
  PDF = 'application/pdf',
  MP4 = 'video/mp4',
  WEBM = 'video/webm',
  OGG = 'video/ogg',
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  WEBP = 'image/webp',
}

export interface FileMetadata {
  originalname: string;
  size: number;
  buffer: Buffer;
  mimetype: MimeType;
}

export interface UploadMetadata extends FileMetadata {
  segmentId?: string;
  locale?: LocaleCode;
}

export type LocalizedFiles = { [key: string]: FileMetadata[] };
