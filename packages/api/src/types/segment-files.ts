import { type LocaleCode } from ".";

export const FileStorageProvider = {
  LOCAL: "local",
};

export type FileStorageProviderType =
  (typeof FileStorageProvider)[keyof typeof FileStorageProvider];

export interface SegmentFile {
  id: string;
  size: number;
  name: string;
  mimetype: string;
  createdAt: Date;
  updatedAt: Date;
  localeCode: LocaleCode;
  provider: FileStorageProviderType;
}
